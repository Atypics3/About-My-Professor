# About My Professor – Chrome Extension

This Chrome Extension enhances the UCSC course enrollment site by injecting **professor information cards** under each course panel.  
It fetches professor data from UCSC’s public directory API using each professor’s UID.

---

## Features

- Detects course panels on UCSC enrollment pages.
- Extracts abbreviated professor names and maps them to UIDs.
- Calls UCSC’s public API to fetch professor information.
- Injects a React component (info card) directly under each professor’s name.
- Caches API results locally to reduce repeated requests.()

---

## Tech Stack

- **Manifest v3** – Chrome extension base
- **React + Webpack** – UI framework and bundler
- **Content Scripts** – scan and inject React roots
- **Background Service Worker** – API fetch + caching
- **CSS** – styling
- **chrome.storage.local** – cache layer
- **prof-map.json** – local mapping of abbreviated names → UID

---

## Project Structure

- to be made later lol

## Steps to run the Extension

1. Navigate to the directory of your choice and run the following commands:
   - `git clone https://github.com/IvanKuria/About-My-Professor`
   - `npm i`
   - `npm run build`

2. Navigate to `chrome://extensions/` in the search bar
3. Make sure to turn on `Developer Mode` in the top right corner
4. Click on `Load Unpacked` in the top left corner
5. When prompted, navigate to the direcory where you cloned the repo and select the `Dist` folder.
6. Navigate to `https://my.ucsc.edu/psc/csprd/EMPLOYEE/SA/c/NUI_FRAMEWORK.PT_AGSTARTPAGE_NUI.GBL?CONTEXTIDPARAMS=TEMPLATE_ID%3aPTPPNAVCOL&scname=ADMN_ENROLLMENT&PTPPB_GROUPLET_ID=SCX_ENROLLMENT&CRefName=ADMN_NAVCOLL_4&PanelCollapsible=Y&AJAXTransfer=Y`
7. Perform any search you want and you should see 'Hello World' in red appear under each prof panel :)

## Other Resources

I recommend checking out the following to get familiar working with chrome extensions

- [Chrome Extension Architecture](https://youtu.be/TRwYaZPJ0h8?si=d9pQA1qZT-87j-Ap)
- [FreeCodeCamp Intro](https://youtu.be/0n809nd4Zu4?si=6lfGnFvhqnSIX1A1)
- [Chrome Extension + React](https://youtu.be/GGi7Brsf7js?si=xrqKeF2iaKOHw4Mz)

## Notes

1. When commiting to the remote repo, **make sure to run** `npm run clean` to make sure your code is formatted accurately. This is done so everyone follows the same formatting style. If not, you'll fail the formatting check :(
