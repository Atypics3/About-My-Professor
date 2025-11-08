// 24 hr duration in ms - E.H
const CACHE_DURATION = 24 * 3600 * 1000;

/**
 * Main listener for messages from content.js
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // check for valid IDs - E.H
  if (message.ID) {
    const uID = message.ID;
    const storageKey = `profile_${uID}`; // e.g. profile_jdoe

    (async () => {
      try {
        const cache = await chrome.storage.local.get([storageKey]);
        const cachedData = cache[storageKey];
        const now = Date.now();

        // compares difference between time when data was cached against its duration - E.H
        // if cache is valid, then send the data
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
          // console.log(`CACHE HIT - Using cached data for ${uID}`);
          sendResponse(cachedData.data);
          return;
        }

        // if cache is stale or not found for user, fetch new data   - E.H
        // console.log(`CACHE MISS - fetching new data for ${uID}`);

        const apiResponse = await fetchProfileFromAPI(uID);

        const dataToCache = {
          data: apiResponse, // data object = {data: ..., success: true}
          timestamp: Date.now(), // current time
        };

        await chrome.storage.local.set({ [storageKey]: dataToCache });

        // 2 cases:
        // sends the data if cache has it
        // or sends the error message for an API failure         - E.H
        // if (apiResponse.success) {
        //     console.log(`CACHE SAVED - Data saved for ${uID}`);
        // } else {
        //     console.log(`CACHE ERROR - API failure for ${uID}.`);
        // }

        sendResponse(apiResponse);
      } catch (error) {
        console.error(`Failed to fetch profile for ${uID}`, error.message);
        sendResponse({ data: null, success: false });
      }
    })();

    // tells Chrome that a asynchronous response will be sent
    return true;
  }
});

/**
 * fetchProfileFromAPI()
 * Helper function to fetch a professor's profile from the campus API
 * Fetches the API response for that profile if successful
 * Or throws error if not found
 */
async function fetchProfileFromAPI(uID) {
  try {
    const response = await fetch(
      "https://campusdirectory.ucsc.edu/api/uid/" + uID,
    );

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const profile = data || null;

    if (profile) {
      return { data: profile, success: true };
    } else {
      // API returned no data for this user  - E.H
      throw new Error("User not found in API response");
    }
  } catch (error) {
    console.error(`fetchProfileFromAPI failed for ${uID}:`, error.message);
    return { data: null, success: false };
  }
}
