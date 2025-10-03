function showGlobalSpinner() {
  let existing = document.getElementById("globalOverlay");
  if (existing) return;
  const div = document.createElement("div");
  div.id = "globalOverlay";
  div.className = "global-overlay";
  div.innerHTML = '<div class="spinner-large"></div>';
  document.body.appendChild(div);
}

function hideGlobalSpinner() {
  const el = document.getElementById("globalOverlay");
  if (el) el.remove();
}

window.showGlobalSpinner = showGlobalSpinner;
window.hideGlobalSpinner = hideGlobalSpinner;
