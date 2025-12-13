chrome.devtools.panels.create(
  "Console Organizer", // Tab name
  "", // Icon (optional)
  "panel/panel.html", // UI
  function (panel) {
    console.log("Console Organizer panel created")
  }
)
