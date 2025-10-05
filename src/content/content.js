// This runs inside the UCSC iframe
import React from "react";
import { createRoot } from "react-dom/client";
import ProfCard from "../react/components/ProfCard.jsx";

function renderIntoPanels() {
  const panels = document.querySelectorAll(".panel.panel-default.row");
  if (!panels || panels.length === 0) return;

  panels.forEach((panel) => {
    // avoid duplicate mounts
    if (panel.querySelector(':scope > .about-my-professor-root')) return;
    const mount = document.createElement("div");
    mount.className = "about-my-professor-root";
    panel.appendChild(mount);
    const root = createRoot(mount);
    root.render(<ProfCard />);
  });
}

// Initial attempt after a short delay for dynamic iframes
setTimeout(renderIntoPanels, 1500);
