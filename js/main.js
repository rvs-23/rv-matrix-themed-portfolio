/**
 * @file main.js
 * Main entry point for the Matrix Terminal Portfolio application.
 */

import { loadAllData } from "./controller/dataLoader.js";
import {
  initializeLoaderScreen,
  hideLoadingScreen,
} from "./controller/loaderScreen.js";

// Import the module directly
import * as rainConfigModule from "./rain/config.js";
import * as rainEngine from "./rain/engine.js";
import * as terminalController from "./controller/terminalController.js";
import { initializeShortcuts } from "./controller/shortcuts.js";

// Ensure this path is correct for your commands index file:
import { getAllCommands, renderTree } from "./commands/0_index.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Load all configurations and asset data first
  const allData = await loadAllData();

  const effectiveTerminalConfig = allData.terminalConfig || {
    allMatrixCharsGlobal: "01",
    loadingMessages: ["LOADING..."],
  };
  initializeLoaderScreen(effectiveTerminalConfig);

  // 2. Initialize Rain Configuration (dependent on rainConfig from allData)
  const effectiveRainConfig = allData.rainConfig || {
    defaultConfig: {
      speed: 125,
      font: 15,
      baseCol: "#0F0",
      headCol: "#FFF",
      fontFamily: "monospace",
      layers: 1,
      layerOp: [1],
      density: 0.7,
      minTrail: 10,
      maxTrail: 30,
      headGlowMin: 1,
      headGlowMax: 5,
      blur: 0,
      trailMutate: 150,
      fade: 0.1,
      decayBase: 0.9,
      delChance: 0,
    },
    glyphs: "01",
    presets: {},
  };

  rainConfigModule.initializeRainConfig(effectiveRainConfig);

  // 3. Prepare command context
  const commandContext = {
    userConfig: allData.userConfig,
    terminalConfig: allData.terminalConfig,
    skillsData: allData.skillsData,
    hobbiesData: allData.hobbiesData,
    manPages: allData.manPages,
    appendToTerminal: terminalController.appendToTerminal,
    terminalController: terminalController,
    rainEngine: rainEngine,
    rainOptions: {
      getActiveRainConfig: rainConfigModule.getActiveRainConfig,
      getDefaultRainConfig: rainConfigModule.getDefaultRainConfig,
      getRainPresets: rainConfigModule.getRainPresets,
      updateRainConfigParameter: rainConfigModule.updateRainConfigParameter,
      resetRainConfigToActiveDefaults:
        rainConfigModule.resetRainConfigToActiveDefaults,
      setActiveRainColorsDirectly: rainConfigModule.setActiveRainColors,
    },
    renderTree: renderTree,
    mainContentContainer: document.getElementById("contentContainer"),
    allMatrixChars: allData.terminalConfig.allMatrixCharsGlobal,
    getFullWelcomeMessage: terminalController.getFullWelcomeMessage,
  };

  const registeredCommands = getAllCommands();
  terminalController.initializeTerminalController(
    allData,
    registeredCommands,
    () => commandContext,
  );

  initializeShortcuts(allData, (isCrtActive) => {
    terminalController.appendToTerminal(
      `<div class="output-success">Analog Channel Override: CRT Mode ${isCrtActive ? "Engaged" : "Disengaged"}.</div>`,
    );
  });

  // This replaces the original hideLoadingScreen call.
  // It waits for both the loading screen to be hidden AND for the fonts to be ready.
  Promise.all([
    new Promise((resolve) => hideLoadingScreen(resolve)), // Your existing function, wrapped in a Promise
    document.fonts.ready, // A browser promise that resolves when fonts are loaded
  ])
    .then(() => {
      // This code now runs only after both conditions are met.
      if (document.getElementById("contentContainer")) {
        document.getElementById("contentContainer").style.opacity = "1";
      }
      // Start the rain with the correct fonts already loaded and available.
      rainEngine.startRainAnimation();

      // For best user experience, focus the input only when everything is visible.
      if (terminalController.commandInputEl) {
        terminalController.commandInputEl.focus();
      }
    })
    .catch((error) => {
      console.error("Error during final initialization step:", error);
    });

  /*  debounce resize to prevent setupRain storm */
  const debounce = (fn, delay = 150) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), delay);
    };
  };
  window.addEventListener(
    "resize",
    debounce(() => {
      rainEngine.setupRain();
    }, 150),
  );

  // Update navigation links
  const navCvLink = document.getElementById("nav-cv-link");
  const navMediumLink = document.getElementById("nav-medium-link");
  const linkedinLinkEl = document.getElementById("nav-linkedin-link");
  const githubLinkEl = document.getElementById("nav-github-link");
  const emailLinkEl = document.getElementById("nav-email-link");

  if (allData.userConfig) {
    if (navCvLink && allData.userConfig.cvLink)
      navCvLink.href = allData.userConfig.cvLink;
    if (navMediumLink) {
      if (allData.userConfig.mediumUser) {
        navMediumLink.href = `https://medium.com/@${allData.userConfig.mediumUser}`;
        navMediumLink.style.display = "";
      } else {
        navMediumLink.style.display = "none";
      }
    }
    if (linkedinLinkEl && allData.userConfig.linkedinUser)
      linkedinLinkEl.href = `https://www.linkedin.com/in/${allData.userConfig.linkedinUser}`;

    if (githubLinkEl && allData.userConfig.githubUser)
      githubLinkEl.href = `https://github.com/${allData.userConfig.githubUser}`;

    if (emailLinkEl && allData.userConfig.emailAddress)
      emailLinkEl.href = `mailto:${allData.userConfig.emailAddress}`;
  }
});
