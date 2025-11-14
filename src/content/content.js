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

async function getProfessorData(uID, name) {
  return chrome.runtime.sendMessage({
    action: "fetchProfessorData",
    ID: uID,
    name,
  });
}

function renderIntoPanels() {
  const panels = document.querySelectorAll(".panel.panel-default.row");
  if (!panels || panels.length === 0) return;

  panels.forEach(async (panel) => {
    if (panel.querySelector(".about-my-professor-root")) return; // avoid duplicate mounts(will come in handy when we cache the results)

    //get name from panel
    let name = getProfName(panel);
    // console.log(panel.innerText) - use this instead
    // finds "Instructor", optional "s", and whitespaces - E.H
    const re = /Instructor[s]?:\s*([\w,.'-]+)/i;

    // if the regex doesn't find a match - E.H
    if (name == null) {
      let text = panel.innerText;
      let res = text.match(re);

      if (res && res[1]) {
        name = res[1];
      } else {
        console.log("Couldn't parse prof name for panel", panel);
        return;
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
      try {
        profileDict = await getProfessorData(uID, name);
      } catch (error) {
        console.error("Error fetching professor data", error);
        profileDict = null;
      }
      if (profileDict?.data?.success === false) {
        profileDict.data = null;
      }
    }
    //console.log("dict: ", profileDict?.data);

    let profData = null;
    let rateMyProfessorData = null;
    if (profileDict != null) {
      profData = profileDict.data;
      rateMyProfessorData = profileDict.rateMyProfessor;
    }

    const mount = document.createElement("div");
    mount.className = "about-my-professor-root";
    panel.appendChild(mount);
    const root = createRoot(mount);

    // in a typical react application, you'll render the main entry point within 'root'
    // however, in our case we will render it elsewhere(our own custom 'root')
    // also pass profile dictionary (from the API) as a property (variable) to the component
    if (uID != "jdoe") {
      root.render(
        <React.StrictMode>
          <ProfInfoButton
            apiData={profData}
            rateMyProfessor={rateMyProfessorData}
          />
        </React.StrictMode>,
      );
    }
  });
}

// Initial attempt after a short delay for the iframe
setTimeout(renderIntoPanels, 1500);
