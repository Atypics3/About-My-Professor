// get uID and fetch profile dict from API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    fetch("https://campusdirectory.ucsc.edu/api/uid/" + message.ID)
      .then((response) => response.json()) // Parse the response body as JSON
      .then((data) => sendResponse({ data })) // Handle the parsed data
      .catch((error) => sendResponse("Error fetching data")); // Handle any errors
  })();
  // Return true to indicate that you will send a response asynchronously
  return true;
});
