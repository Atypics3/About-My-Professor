import Fuse from "fuse.js";
// --- Constants ---
const CAMPUS_DIRECTORY_BASE_URL = "https://campusdirectory.ucsc.edu/api/uid/";
const RATE_MY_PROFESSORS_ENDPOINT = "https://www.ratemyprofessors.com/graphql";
const UCSC_SCHOOL_ID = "U2Nob29sLTEwNzg="; // Base64 encoded "School-1078"
const CACHE_DURATION_MS = 24 * 3600 * 1000;  // 24 hours

// GraphQL query for RateMyProfessors
const RATE_MY_PROFESSORS_QUERY = `query NewSearchTeachersQuery($text: String!, $schoolID: ID) {
  newSearch {
    teachers(query: { text: $text, schoolID: $schoolID }, first: 5) {
      didFallback
      edges {
        cursor
        node {
          id
          legacyId
          firstName
          lastName
          avgRatingRounded
          numRatings
          wouldTakeAgainPercentRounded
          wouldTakeAgainCount
          teacherRatingTags {
            id
            legacyId
            tagCount
            tagName
          }
          avgDifficultyRounded
          school {
            name
            id
          }
          department
        }
      }
    }
  }
}`;


// --- State ---
let hasLoggedSuccessfulRmpConnection = false;

// --- Campus Directory API Functions ---
/**
 * Fetches profile data directly from the campus directory API.
 * This function does NOT use the cache.
 * @param {string} uID - The professor's User ID (e.g., "pdey")
 * @returns {Promise<object>} The raw data from the API.
 */
async function fetchProfileFromAPI(uID) {
  const response = await fetch(`${CAMPUS_DIRECTORY_BASE_URL}${uID}`);
  if (!response.ok) {
    throw new Error(`Campus directory request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data) {
    throw new Error("Campus directory returned empty payload");
  }

  return data;
}

/**
 * A cached wrapper for the campus directory API.
 * Checks local storage for fresh data before fetching.
 * @param {string} uID - The professor's User ID (e.g., "pdey")
 * @returns {Promise<object>} A response object, e.g., { data: {...}, success: true }
 */
async function fetchCachedCampusDirectoryProfile(uID) {
  if (!uID) {
    return {data: null, success: false};
  }

  const storageKey = `amp_${uID}`;
  try {
    const cache = await chrome.storage.local.get([storageKey]);
    const cachedEntry = cache[storageKey];
    const now = Date.now();

    // check the cache for if the user is in it and if its lifetime is valid
    if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION_MS) {
      //console.log(`CACHE HIT - Using cached data for ${uID}`);
      return cachedEntry.data;
    }

    // otherwise fetch new data for specified user and save to cache
    //console.log(`CACHE MISS - Fetching new data for ${uID}`);
    const apiResponse = await fetchProfileFromAPI(uID);
    const successResponse = {data: apiResponse, success: true};
    await chrome.storage.local.set({
      [storageKey]: {
        data: successResponse,
        timestamp: Date.now(),
      },
    });

    return successResponse;

  } catch(error) {
    console.error(`Failed to fetch campus directory profile for ${uID}`, error);
    // attempt to clear a potentially corrupted cache entry
    await chrome.storage.local.remove(storageKey).catch(() => {});
    return { data: null, success: false};
  }
}


// --- RateMyProfessors API Functions ---
/**
 * Builds the variables object for the RMP GraphQL query.
 * @param {string} name - The professor's name (e.g., "TANTALO,C")
 * @param {string} schoolId - The RMP school ID.
 * @returns {object} The variables object for the query.
 */
function buildRmpQueryVariables(name, schoolId) {
  const trimmed = name ? name.trim() : "";
  let text = trimmed;

  // Converts "Last, First" to "First Last" for better search results
  if (trimmed.includes(",")) {
    const [last, first] = trimmed.split(",").map((part) => part.trim());
    if (first && last) {
      text = `${first} ${last}`;
    }
  }

  return {
    text,
    schoolID: schoolId || UCSC_SCHOOL_ID,
  };
}


/**
 * Fetches data directly from the RateMyProfessors GraphQL endpoint.
 * This function does NOT use the cache.
 * @param {string} name - The professor's name.
 * @param {string} schoolId - The RMP school ID.
 * @returns {Promise<Array|null>} A list of matching professor "edges" or null.
 */
async function fetchRateMyProfessorData(name, schoolId) {
  if (!name) return null;

  const variables = buildRmpQueryVariables(name, schoolId);
  const response = await fetch(RATE_MY_PROFESSORS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic dGVzdDp0ZXN0", // "test:test"
    },
    body: JSON.stringify({
      query: RATE_MY_PROFESSORS_QUERY,
      variables,
    }),
  });

  if (!hasLoggedSuccessfulRmpConnection && response.ok) {
    console.log("RateMyProfessors GraphQL connection successful");
    hasLoggedSuccessfulRmpConnection = true;
  }

  if (!response.ok) {
    throw new Error(`RateMyProfessors request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.errors?.length) {
    console.error(
      "RateMyProfessors GraphQL errors:",
      payload.errors.map((err) => err.message).join(", "),
    );
    return null;
  }

  return payload?.data?.newSearch?.teachers?.edges ?? null;
}


/**
 * A cached wrapper for the RateMyProfessors API.
 * Checks local storage for fresh data before fetching.
 * @param {string} name - The professor's name (e.g., "TANTALO,C")
 * @param {string} schoolId - The RMP school ID.
 * @returns {Promise<Array|null>} A list of matching professor "edges" or null.
 */
async function fetchCachedRateMyProfessorData(name, schoolId) {
  if (!name) {
    return null;
  }

  // Use the formatted name as part of the key for consistency
  const formattedName = buildRmpQueryVariables(name, schoolId).text;
  const storageKey = `rmp_${formattedName.replace(/\s+/g, '_').toLowerCase()}`;

  try {
    const cache = await chrome.storage.local.get([storageKey]);
    const cachedEntry = cache[storageKey];
    const now = Date.now();

    // 1. check the cache
    if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION_MS) {
      console.log(`[CACHE HIT] Using cached RMP data for ${name}`);
      return cachedEntry.data;
    }

    // 2. CACHE MISS: Fetch new data
    console.log(`[CACHE MISS] Fetching new RMP data for ${name}`);
    const apiResponse = await fetchRateMyProfessorData(name, schoolId);

    // 3. SAVE TO CACHE
    await chrome.storage.local.set({
      [storageKey]: {
        data: apiResponse, // This will be the array of edges, or null
        timestamp: Date.now(),
      },
    });

    return apiResponse;

  } catch (error) {
    console.error(`Failed to fetch RMP data for ${name}`, error);
    await chrome.storage.local.remove(storageKey).catch(() => {});
    return null; // Return null on failure
  }
}


// --- RMP Data Processing Functions ---
/**
 * Creates a list of searchable "tokens" from a professor's RMP data.
 * @param {object} node - The RMP professor data node.
 * @returns {Array<string>} A list of search terms (e.g., "John Doe", "Doe, J.", "Tough Grader").
 */
function createSearchTokens(node) {
  const first = node?.firstName ? String(node.firstName).trim() : "";
  const last = node?.lastName ? String(node.lastName).trim() : "";
  const tokens = [];

  if (first || last) {
    const fullName = [first, last].filter(Boolean).join(" ");
    const reversedName = [last, first].filter(Boolean).join(", ");
    const initials = first ? `${first[0]}.` : "";

    if (fullName) tokens.push(fullName);
    if (reversedName) tokens.push(reversedName);
    if (initials && last) {
      tokens.push(`${last}, ${initials}`);
      tokens.push(`${initials} ${last}`);
    }

    // compact versions without spaces or punctuation
    const compact = (value) =>
      value
        .replace(/[^a-zA-Z]/g, "")
        .toLowerCase();
    if (fullName) tokens.push(compact(fullName));
    if (reversedName) tokens.push(compact(reversedName));
    if (initials && last) tokens.push(compact(`${last}${initials}`));
  }

  if (Array.isArray(node?.teacherRatingTags)) {
    node.teacherRatingTags.forEach((tag) => {
      if (tag?.tagName) {
        tokens.push(String(tag.tagName).trim());
      }
    });
  }

  return Array.from(new Set(tokens.filter(Boolean)));
}


/**
 * Uses Fuse.js fuzzy search to find the best RMP match for a given name.
 * @param {Array} edges - The list of professor "edges" from the RMP API.
 * @param {string} name - The name we are searching for (e.g., "TANTALO,C").
 * @returns {object|null} The best matching professor node, or null.
 */
function selectBestRmpMatch(edges, name) {
  if (!Array.isArray(edges) || edges.length === 0) return null;

  // Enhance each candidate with a list of searchable tokens
  const candidates = edges
    .map((edge) => edge?.node)
    .filter(Boolean)
    .map((node) => ({
      ...node,
      searchTokens: createSearchTokens(node),
    }));

  if (candidates.length === 0) return null;
  if (!name) return candidates[0]; // Just return the first if no name is provided

  // Initialize Fuse.js for fuzzy searching
  const fuse = new Fuse(candidates, {
    includeScore: true,
    shouldSort: true,
    threshold: 0.35,
    keys: ["searchTokens"], // Search within our generated tokens
  });

  const formattedName = buildRmpQueryVariables(name)?.text || "";
  const searchTerms = [formattedName, name]
    .map((term) => term && term.trim())
    .filter(Boolean);

  const normalizeForFallback = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  // Try fuzzy search first
  for (const term of searchTerms) {
    const results = fuse.search(term);
    if (results.length > 0) {
      const [best] = results;
      if (best?.item) {
        return best.item;
      }
    }
  }

  // Fallback to a direct, normalized comparison
  const target = normalizeForFallback(searchTerms[0] || name);
  const fallbackMatch = candidates.find((candidate) => {
    const comparisonValues = (candidate.searchTokens || []).map((token) =>
      normalizeForFallback(token),
    );
    return comparisonValues.includes(target);
  });
  if (fallbackMatch) return fallbackMatch;

  // If no good match, return the top result from the API
  return candidates[0];
}

// --- Main Message Listener ---

/**
 * Listens for messages from content.js and routes them to the correct functions.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // --- Route 1: The main action for fetching all data ---
  if (message?.action === "fetchProfessorData") {
    (async () => {
      try {
        // Run both API calls in parallel, using the CACHED functions
        const [campusResponse, rmpEdges] = await Promise.all([
          fetchCachedCampusDirectoryProfile(message.ID),
          fetchCachedRateMyProfessorData(message.name, message.rateMyProfSchoolId),
        ]);

        const campusData = campusResponse?.data ?? null;
        const campusSuccess = campusData?.success ?? false;

        // Find the best RMP match from the (potentially cached) results
        const rateMyProfessorNode = selectBestRmpMatch(rmpEdges, message.name);

        // Send the consolidated response
        sendResponse({
          data: campusData,
          campusSuccess,
          rateMyProfessor: rateMyProfessorNode,
        });
      } catch (error) {
        console.error("Error fetching professor data", error);
        sendResponse({
          error: error.message,
        });
      }
    })();

    return true; // Indicates an asynchronous response
  }

  // --- Route 2: Legacy/simple action for only campus data ---
  if (message?.ID) {
    (async () => {
      try {
        const campusResponse = await fetchCachedCampusDirectoryProfile(message.ID);
        sendResponse(campusResponse);
      } catch (error) {
        console.error(`Failed to fetch profile for ${message.ID}`, error);
        sendResponse({ data: null, success: false });
      }
    })();

    return true; // Indicates an asynchronous response
  }

  // If no matching action, return false
  return false;
});