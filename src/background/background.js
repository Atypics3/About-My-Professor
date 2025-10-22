// get uID and fetch profile dict from API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.greeting === "hello from content script") {
      //console.log("Message received from content script:", message);
      fetch("https://campusdirectory.ucsc.edu/api/uid/" + message.ID)
        .then((response) => response.json()) // Parse the response body as JSON
        .then((data) => sendResponse({ data })) // Handle the parsed data
        .catch((error) => sendResponse({ farewell: "Error fetching data" })); // Handle any errors
    }
  })();
  // Return true to indicate that you will send a response asynchronously
  return true;
});
