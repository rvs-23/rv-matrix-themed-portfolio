/**
 * @file loaderScreen.js
 * Manages the loading screen animation and logic.
 */

let matrixLoaderCharsEl, decryptStatusEl, loadingScreenEl;
let loaderCharInterval, statusCyclingInterval;
let currentLoadingMsgIndex = 0;
let allMatrixChars = "";
let loadingMessages = [];

export function initializeLoaderScreen(loaderConfig) {
  // ++ Parameter name changed for clarity
  loadingScreenEl = document.getElementById("loading-screen");
  matrixLoaderCharsEl = document.getElementById("matrix-loader-chars");
  decryptStatusEl = document.getElementById("decrypt-status");

  // It now reads 'matrixChars' from the passed 'loaderConfig' object.
  allMatrixChars = loaderConfig.matrixChars || "01"; // Fallback chars
  loadingMessages = loaderConfig.messages || ["LOADING..."]; // Fallback messages

  if (loadingScreenEl && !loadingScreenEl.classList.contains("hidden")) {
    loaderCharInterval = setInterval(animateLoaderMatrixChars, 120);
    animateLoaderMatrixChars();
    updateLoadingStatusMessage();
    statusCyclingInterval = setInterval(updateLoadingStatusMessage, 800);
  }
}

function animateLoaderMatrixChars() {
  if (!matrixLoaderCharsEl) return;
  let text = "";
  const lines = 4;
  const charsPerLine = 28;
  for (let i = 0; i < lines * charsPerLine; i++) {
    text += allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
    if ((i + 1) % charsPerLine === 0 && i < lines * charsPerLine - 1)
      text += "\n";
  }
  matrixLoaderCharsEl.textContent = text;
}

function updateLoadingStatusMessage() {
  if (!decryptStatusEl) return;
  if (currentLoadingMsgIndex < loadingMessages.length) {
    decryptStatusEl.textContent = loadingMessages[currentLoadingMsgIndex];
    currentLoadingMsgIndex++;
  } else {
    decryptStatusEl.textContent =
      loadingMessages[loadingMessages.length - 1] || "SYSTEM ONLINE.";
    if (statusCyclingInterval) clearInterval(statusCyclingInterval);
  }
}

export function hideLoadingScreen(callback) {
  if (loadingScreenEl) {
    if (loaderCharInterval) clearInterval(loaderCharInterval);
    if (statusCyclingInterval) clearInterval(statusCyclingInterval);
    if (decryptStatusEl)
      decryptStatusEl.textContent =
        loadingMessages[loadingMessages.length - 1] || "SYSTEM ONLINE.";

    setTimeout(() => {
      loadingScreenEl.classList.add("hidden");
      if (callback) callback();
    }, 600);
  } else {
    if (callback) callback();
  }
}
