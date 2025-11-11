import Fuse from "fuse.js";

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

async function fetchCampusDirectoryProfile(uID) {
  if (!uID) return null;

  const response = await fetch(`${CAMPUS_DIRECTORY_BASE_URL}${uID}`);
  if (!response.ok) {
    throw new Error(`Campus directory request failed with status ${response.status}`);
  }
  return response.json();
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

  const formattedName = buildRmpQueryVariables(name)?.query?.text || "";
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
  if (!message || (message.action && message.action !== "fetchProfessorData")) {
    return false;
  }

  (async () => {
    try {
      const [campusDirectoryData, rmpEdges] = await Promise.all([
        fetchCampusDirectoryProfile(message.ID),
        fetchRateMyProfessorData(message.name, message.rateMyProfSchoolId),
      ]);

      const rateMyProfessorNode = selectBestRmpMatch(rmpEdges, message.name);

      sendResponse({
        data: campusDirectoryData,
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
});
