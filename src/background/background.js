/**
 * @file background.js
 * This script acts as the main router for the extension.
 * It listens for messages from the content script and delegates
 * tasks to the appropriate caching service (ampCache.js or rmpCache.js).
 */

// --- Imports ---
import { fetchCachedCampusDirectoryProfile } from './ampCache.js';
import {
  fetchCachedRateMyProfessorData,
  selectBestRmpMatch
} from "./rmpCache.js"


// --- Main Message Listener ---
/**
 * Listens for messages from content.js and routes them to the correct functions.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // --- Route 1: The main action for fetching all data ---
  if (message?.action === "fetchProfessorData") {
    (async () => {
      try {
        // Run both API calls in parallel, using the imported CACHED functions
        const [campusResponse, rmpEdges] = await Promise.all([
          fetchCachedCampusDirectoryProfile(message.ID),
          fetchCachedRateMyProfessorData(message.ID, message.name, message.rateMyProfSchoolId),
        ]);

        const campusData = campusResponse?.data ?? null;
        
        const campusSuccess =
          typeof campusResponse?.success === "boolean"
            ? campusResponse.success
            : Boolean(campusData);

        const rateMyProfessorNode = selectBestRmpMatch(rmpEdges, message.name);

        // Send the consolidated response
        sendResponse({
          data: campusData,
          campusSuccess, // 'true' if campus data was found
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