import React from "react";
import { createRoot } from "react-dom/client";
import ProfCard from "../react/components/ProfCard.jsx";

function renderIntoPanels() {
  const panels = document.querySelectorAll(".panel.panel-default.row");
  if (!panels || panels.length === 0) return;

  panels.forEach((panel) => {
    if (panel.querySelector(".about-my-professor-root")) return; // avoid duplicate mounts(will come in handy when we cache the results)
    const mount = document.createElement("div");
    mount.className = "about-my-professor-root";
    panel.appendChild(mount);
    const root = createRoot(mount);
    root.render(
      <React.StrictMode>
        <ProfCard />
      </React.StrictMode>,
    );
  });
}

// Initial attempt after a short delay for the iframe
setTimeout(renderIntoPanels, 1500);
