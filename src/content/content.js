// This runs inside the UCSC iframe

setTimeout(() => {
  // all it does is it detects specific class for the div we want to target(this case the panel of prof names)
  // then it prints the length(should be 25)
  const panels = document.querySelectorAll(".panel.panel-default.row");
  console.log("found panels:", panels.length);

  // inserts 'hello world' under each panel
  panels.forEach((panel) => {
    const div = document.createElement("div");
    div.textContent = "Hello World";
    div.style.color = "red";
    div.style.fontWeight = "bold";
    panel.appendChild(div);
  });
}, 1500);

// i'm using a timeout here but ideally we'd want to use a MutationObserver() -> checks for changes in the dom because the iframe is rendered dynamically
