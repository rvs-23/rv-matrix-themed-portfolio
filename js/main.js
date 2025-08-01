/**
 * @file main.js
 * Main entry point for the Matrix Terminal Portfolio application.
 */

import { loadAllData } from "./controller/dataLoader.js";
import {
  initializeLoaderScreen,
  hideLoadingScreen,
} from "./controller/loaderScreen.js";

import RainEngine from "./rain/engine.js";

import * as terminalController from "./controller/terminalController.js";
import {
  initializeShortcuts,
  isCrtModeActive,
} from "./controller/shortcuts.js";

import { getAllCommands } from "./commands/0_index.js";
import { debounce, renderTree } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ++ 1. Pass the correct config object to the loader
  const allData = await loadAllData();
  initializeLoaderScreen(allData.config.loader);

  const rainEngine = new RainEngine(allData.rainConfig, allData.config.fonts);

  // This is the primary fix for your commands not working.
  const commandContext = {
    config: allData.config, // Pass the entire config object
    userConfig: allData.config.user, // Keep this for convenience
    skillsData: allData.skillsData,
    hobbiesData: allData.hobbiesData,
    manPages: allData.manPages,
    appendToTerminal: terminalController.appendToTerminal,
    terminalController: terminalController,
    rainEngine: rainEngine,
    renderTree: renderTree,
    mainContentContainer: document.getElementById("contentContainer"),
    allMatrixChars: allData.config.loader.matrixChars, // Correct path
    isCrtActive: isCrtModeActive,
    getCurrentTheme: terminalController.getCurrentThemeName,
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
      `<div class="output-success">Analog Channel Override: CRT Mode ${
        isCrtActive ? "Engaged" : "Disengaged"
      }.</div>`,
    );
  });

  Promise.all([
    new Promise((resolve) => hideLoadingScreen(resolve)),
    document.fonts.ready,
  ])
    .then(() => {
      if (document.getElementById("contentContainer")) {
        document.getElementById("contentContainer").style.opacity = "1";
      }
      rainEngine.start();
      // Use the new, safe function to focus the input
      terminalController.focusInput();
    })
    .catch((error) => {
      console.error("Error during final initialization step:", error);
    });

  window.addEventListener(
    "resize",
    debounce(() => {
      rainEngine.setup();
      terminalController.reapplyTerminalSize();
    }, 150),
  );

  // Update navigation links from the new user config path
  const navCvLink = document.getElementById("nav-cv-link");
  const navMediumLink = document.getElementById("nav-medium-link");
  const linkedinLinkEl = document.getElementById("nav-linkedin-link");
  const githubLinkEl = document.getElementById("nav-github-link");
  const emailLinkEl = document.getElementById("nav-email-link");

  const userCfg = allData.config.user;
  if (userCfg) {
    if (navCvLink && userCfg.cvLink) navCvLink.href = userCfg.cvLink;
    if (navMediumLink) {
      if (userCfg.medium) {
        navMediumLink.href = `https://medium.com/@${userCfg.medium}`;
        navMediumLink.style.display = "";
      } else {
        navMediumLink.style.display = "none";
      }
    }
    if (linkedinLinkEl && userCfg.linkedin)
      linkedinLinkEl.href = `https://www.linkedin.com/in/${userCfg.linkedin}`;
    if (githubLinkEl && userCfg.github)
      githubLinkEl.href = `https://github.com/${userCfg.github}`;
    if (emailLinkEl && userCfg.email)
      emailLinkEl.href = `mailto:${userCfg.email}`;
  }
});
