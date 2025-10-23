import React from "react";
import { createRoot } from "react-dom/client";
import ProfInfoButton from "../react/components/ProfInfoButton.jsx";
import data from "../data/prof_uids.json";

function getProfName(panel) {
  const profDivs = panel.querySelectorAll("div.col-xs-6.col-sm-3");

  for (const div of profDivs) {
    const text = div.textContent.trim();
    if (text.includes("Instructor:")) {
      const name = text.replace("Instructor:", "").trim();
      //console.log(name);
      return name;
    }
  }
  return null; // if name isn't found for whatever reason
}

async function getProfileDict(uID) {
  return chrome.runtime.sendMessage({ ID: uID });
}

function renderIntoPanels() {
  const panels = document.querySelectorAll(".panel.panel-default.row");
  if (!panels || panels.length === 0) return;

  panels.forEach(async (panel) => {
    if (panel.querySelector(".about-my-professor-root")) return; // avoid duplicate mounts(will come in handy when we cache the results)

    //get name from panel
    let name = getProfName(panel);
    if (name == null) {
      // console.log(panel.innerText) - use this instead
      const re = /Instructor:\n (.*)\n/;
      let text = panel.innerText;
      let res = text.match(re);

      // if the regex doesn't find a match
      if (res && res[1]) {
        name = res[1];
      } else {
        console.log("Couldn't parse prof name for panel", panel);
      }
      //console.log("name from regex ",name);
    }

    //get uID from json
    let uID = "jdoe";
    //console.log(data);
    //get uID by indexing the json data as a dictionary
    if (data[name]) {
      uID = data[name];
    } else {
      console.log(
        "couldn't match name to uID in the json, gave output",
        data[name],
        "for name: ",
        name,
      );
    }
    //console.log(uID);

    //get fullName from API
    let profileDict = null;
    if (uID != "jdoe") {
      profileDict = await getProfileDict(uID);
      if (profileDict.data.success == false) {
        profileDict = null;
      }
    }
    //console.log("dict: ", profileDict.data);
    let profData = null;
    if (profileDict != null) {
      profData = profileDict.data;
    }

    const mount = document.createElement("div");
    mount.className = "about-my-professor-root";
    panel.appendChild(mount);
    const root = createRoot(mount);

    // in a typical react application, you'll render the main entry point within 'root'
    // however, in our case we will render it elsewhere(our own custom 'root')
    // also pass profile dictionary (from the API) as a property (variable) to the component
    root.render(
      <React.StrictMode>
        <ProfInfoButton apiData={profData} />
      </React.StrictMode>,
    );
  });
}

// Initial attempt after a short delay for the iframe
setTimeout(renderIntoPanels, 1500);
