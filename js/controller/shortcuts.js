/**
 * @file shortcuts.js
 * Manages global keyboard shortcuts like Konami code and terminal toggle.
 */
import { toggleTerminalVisibility } from "./terminalController.js"; // Assuming this is the correct path

let konamiCodeSequence = [];
let konamiCodeIndex = 0;
let crtModeActive = false;
let commandInputElement;
let onCrtToggleFeedback = (isActive) => {};

export function initializeShortcuts(config, onCrtToggleCb) {
  // Ensure config and config.terminalConfig exist before accessing properties
  konamiCodeSequence = config?.config?.terminal?.konamiCodeSequence || [];
  commandInputElement = document.getElementById("command-input");
  onCrtToggleFeedback = onCrtToggleCb;
  document.addEventListener("keydown", globalKeydownHandler);
}

function toggleCrtMode(activate) {
  crtModeActive = typeof activate === "boolean" ? activate : !crtModeActive;
  document.body.classList.toggle("crt-mode", crtModeActive);
  if (typeof onCrtToggleFeedback === "function") {
    onCrtToggleFeedback(crtModeActive);
  }
}

function globalKeydownHandler(e) {
  const key = e.key; // Use e.key for modern browsers, already done
  const keyLower = key.toLowerCase(); // For Konami sequence comparison

  // FIX 4: Process Konami code sequence BEFORE checking for input focus,
  // but be mindful of default actions for keys like 'a', 'b' if input is focused.

  if (konamiCodeSequence.length > 0) {
    if (keyLower === konamiCodeSequence[konamiCodeIndex].toLowerCase()) {
      konamiCodeIndex++;
      if (konamiCodeIndex === konamiCodeSequence.length) {
        toggleCrtMode();
        konamiCodeIndex = 0; // Reset
        // Prevent default only if Konami completes AND input is NOT focused,
        // or if we always want to prevent 'a'/'b' from being typed at the end of sequence.
        // For an easter egg, preventing default action upon completion is usually desired.
        e.preventDefault();
      }
    } else if (
      keyLower === konamiCodeSequence[0].toLowerCase() &&
      konamiCodeIndex > 0
    ) {
      // If they press the first key of the sequence again while in the middle of it
      konamiCodeIndex = 1;
    } else {
      konamiCodeIndex = 0; // Reset if wrong key
    }
  }

  // Terminal Toggle Shortcut (Ctrl + \) - should take precedence or be handled carefully
  if (e.ctrlKey && (key === "\\" || key === "|")) {
    e.preventDefault();
    toggleTerminalVisibility();
    return; // Stop further processing if this shortcut is handled
  }

  // If input has focus or it's a link, allow normal typing and actions (like Enter on a link)
  // This check should come AFTER Konami and specific shortcuts like Ctrl+\
  // so they are not blocked.
  if (
    document.activeElement === commandInputElement ||
    document.activeElement.tagName === "A"
  ) {
    if (key === "Escape" && document.activeElement === commandInputElement) {
      commandInputElement.blur(); // Allow Esc to blur input
    }
    // Do not 'return' here if Konami sequence might be in progress and needs to complete.
    // The e.preventDefault() inside Konami completion handles preventing typing 'a' or 'b'.
    // If a non-Konami key is pressed while input is focused, it should just type.
    return;
  }

  // If we reach here, focus is not on input or a link,
  // and it wasn't Ctrl+\.
  // If any other global shortcuts were to be added, they'd go here.
  // The Konami logic above will have already run.
}

export function isCrtModeActive() {
  return crtModeActive;
}