import React from "react";
import { createRoot } from "react-dom/client";
import ProfInfoButton from "../react/components/ProfInfoButton.jsx";

function renderIntoPanels() {
  /*
  // get the prof names from the DOM
  let names = [];
  for (let i = 0; i<25; i++){
    let profNameElement = document.getElementById("rowpanel_" + i);
    //id: "rowpanel_0-24" 
    const re = /Instructor:\n (.*)\n/;
    if (profNameElement) {
        //console.log(profNameElement.outerText)
        //send to background.js to do regex? seems like we don't need to
        let text = profNameElement.outerText
        let res = (text).match(re);
        let name = res[1];
        names.push(name);
        //console.log(name);
        //chrome.runtime.sendMessage({ greeting : text });
    }  
  }
  //console.log(names);
  */

  const panels = document.querySelectorAll(".panel.panel-default.row");
  if (!panels || panels.length === 0) return;

  panels.forEach((panel) => {
    if (panel.querySelector(".about-my-professor-root")) return; // avoid duplicate mounts(will come in handy when we cache the results)

    //mabye get name from panel
    // console.log(panel.innerText) - use this instead
    const re = /Instructor:\n (.*)\n/;
    //send to background.js to do regex? seems like we don't need to
    let text = panel.innerText;
    let res = text.match(re);
    let name = res[1];
    //console.log(name);

    const mount = document.createElement("div");
    mount.className = "about-my-professor-root";
    panel.appendChild(mount);
    const root = createRoot(mount);

    // in a typical react application, you'll render the main entry point within 'root'
    // however, in our case we will render it elsewhere(our own custom 'root')
    // also pass name as a property (variable) to the component
    root.render(
      <React.StrictMode>
        <ProfInfoButton profName={name} />
      </React.StrictMode>,
    );
  });
}

// Initial attempt after a short delay for the iframe
setTimeout(renderIntoPanels, 1500);
