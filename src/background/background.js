import Fuse from "fuse.js";

// initializing rmp query and other related info - I.K
const CAMPUS_DIRECTORY_BASE_URL = "https://campusdirectory.ucsc.edu/api/uid/";
const RATE_MY_PROFESSORS_ENDPOINT = "https://www.ratemyprofessors.com/graphql";
const UCSC_SCHOOL_ID = "U2Nob29sLTEwNzg="; // Base64 encoded "School-1078"
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

let hasLoggedSuccessfulRmpConnection = false;
const CACHE_DURATION = 24 * 3600 * 1000; // 24 hours

async function fetchProfileFromAPI(uID) {
  const response = await fetch(`${CAMPUS_DIRECTORY_BASE_URL}${uID}`);
  if (!response.ok) {
    throw new Error(
      `Campus directory request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  if (!data) {
    throw new Error("Campus directory returned empty payload");
  }

  return { data, success: true };
}

async function fetchCampusDirectoryProfile(uID) {
  if (!uID) {
    return { data: null, success: false };
  }

  const storageKey = `profile_${uID}`;
  try {
    const cache = await chrome.storage.local.get([storageKey]);
    const cachedEntry = cache[storageKey];
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
      return cachedEntry.data;
    }

    const apiResponse = await fetchProfileFromAPI(uID);
    await chrome.storage.local.set({
      [storageKey]: {
        data: apiResponse,
        timestamp: Date.now(),
      },
    });
    // 2 cases:
    // sends the data if cache has it
    // or sends the error message for an API failure         - E.H
    // if (apiResponse.success) {
    //   console.log(`CACHE SAVED - Data saved for ${uID}`);
    // } else {
    //   console.log(`CACHE ERROR - API failure for ${uID}.`);
    // }
    return apiResponse;
  } catch (error) {
    console.error(`Failed to fetch campus directory profile for ${uID}`, error);
    await chrome.storage.local.remove(storageKey).catch(() => {});
    return { data: null, success: false };
  }
}

function buildRmpQueryVariables(name, schoolId) {
  const trimmed = name ? name.trim() : "";
  let text = trimmed;

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

// fetches rmp data given a prof name and the school id - I.K
async function fetchRateMyProfessorData(name, schoolId) {
  if (!name) return null;

  const variables = buildRmpQueryVariables(name, schoolId);
  const response = await fetch(RATE_MY_PROFESSORS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic dGVzdDp0ZXN0",
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
    throw new Error(
      `RateMyProfessors request failed with status ${response.status}`,
    );
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
    const compact = (value) => value.replace(/[^a-zA-Z]/g, "").toLowerCase();
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

// gets the best match by using fuzzy search - I.K
function selectBestRmpMatch(edges, name) {
  if (!Array.isArray(edges) || edges.length === 0) return null;

  const candidates = edges
    .map((edge) => edge?.node)
    .filter(Boolean)
    .map((node) => ({
      ...node,
      searchTokens: createSearchTokens(node),
    }));

  if (candidates.length === 0) return null;
  if (!name) return candidates[0];

  const fuse = new Fuse(candidates, {
    includeScore: true,
    shouldSort: true,
    threshold: 0.35,
    keys: ["searchTokens"],
  });

  const formattedName = buildRmpQueryVariables(name)?.text || "";
  const searchTerms = [formattedName, name]
    .map((term) => term && term.trim())
    .filter(Boolean);

  const normalizeForFallback = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  for (const term of searchTerms) {
    const results = fuse.search(term);
    if (results.length > 0) {
      const [best] = results;
      if (best?.item) {
        return best.item;
      }
    }
  }

  // fallback to direct normalized comparison
  const target = normalizeForFallback(searchTerms[0] || name);
  const fallbackMatch = candidates.find((candidate) => {
    const comparisonValues = (candidate.searchTokens || []).map((token) =>
      normalizeForFallback(token),
    );
    return comparisonValues.includes(target);
  });
  if (fallbackMatch) return fallbackMatch;

  return candidates[0];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "fetchProfessorData") {
    (async () => {
      try {
        const [campusResponse, rmpEdges] = await Promise.all([
          fetchCampusDirectoryProfile(message.ID),
          fetchRateMyProfessorData(message.name, message.rateMyProfSchoolId),
        ]);

        const campusData = campusResponse?.data ?? null;
        const campusSuccess =
          typeof campusResponse?.success === "boolean"
            ? campusResponse.success
            : Boolean(campusData);

        const rateMyProfessorNode = selectBestRmpMatch(rmpEdges, message.name);

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

    return true;
  }

  if (message?.ID) {
    (async () => {
      try {
        const campusResponse = await fetchCampusDirectoryProfile(message.ID);
        sendResponse(campusResponse);
      } catch (error) {
        console.error(`Failed to fetch profile for ${message.ID}`, error);
        sendResponse({ data: null, success: false });
      }
    })();

    return true;
  }

  return false;
});
