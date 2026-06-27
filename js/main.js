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
import { sentientRainPhrases } from "./config/index.js";

function initTitleBarDots(tc) {
  const dots = document.querySelectorAll(".terminal-dot");
  if (dots.length < 3) return;

  // Red dot: hide terminal
  dots[0].addEventListener("click", (e) => {
    e.stopPropagation();
    tc.toggleTerminalVisibility();
  });

  // Yellow dot: toggle between reduced opacity (30%) and default
  let dimmed = false;
  dots[1].addEventListener("click", (e) => {
    e.stopPropagation();
    dimmed = !dimmed;
    tc.setTerminalOpacity(dimmed ? 0.3 : "reset");
  });

  // Green dot: reset terminal size to defaults
  dots[2].addEventListener("click", (e) => {
    e.stopPropagation();
    const defaults = tc.getDefaultTerminalSize();
    tc.resizeTerminalElement(defaults.width, defaults.height);
  });
}

function hydrateNavLinks(userConfig) {
  if (!userConfig) return;
  const navCvLink = document.getElementById("nav-cv-link");
  const navMediumLink = document.getElementById("nav-medium-link");
  const linkedinLinkEl = document.getElementById("nav-linkedin-link");
  const githubLinkEl = document.getElementById("nav-github-link");
  const emailLinkEl = document.getElementById("nav-email-link");

  if (navCvLink && userConfig.cvLink) navCvLink.href = userConfig.cvLink;
  if (navMediumLink) {
    if (userConfig.medium) {
      navMediumLink.href = `https://medium.com/@${userConfig.medium}`;
      navMediumLink.classList.remove("nav-icon--hidden");
    } else {
      navMediumLink.classList.add("nav-icon--hidden");
    }
  }
  if (linkedinLinkEl && userConfig.linkedin)
    linkedinLinkEl.href = `https://www.linkedin.com/in/${userConfig.linkedin}`;
  if (githubLinkEl && userConfig.github)
    githubLinkEl.href = `https://github.com/${userConfig.github}`;
  if (emailLinkEl && userConfig.email)
    emailLinkEl.href = `mailto:${userConfig.email}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const allData = await loadAllData();
  initializeLoaderScreen(allData.config.loader);

  // Restore persisted theme before rain engine reads colors
  const savedTheme = (() => {
    try { return localStorage.getItem("rv_theme"); } catch { return null; }
  })();
  if (savedTheme && allData.config.help.availableThemes.includes(savedTheme)) {
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    });
    document.body.classList.add(`theme-${savedTheme}`);
  }

  // Rain is non-essential: if rain.json failed to load, disable it and keep
  // the terminal fully usable instead of crashing the whole app on the loader.
  let rainEngine = null;
  try {
    rainEngine = new RainEngine(
      allData.rainConfig,
      allData.config.fonts,
      sentientRainPhrases,
    );
  } catch (err) {
    console.error("Rain engine disabled:", err.message);
  }

  // Restore persisted preset
  const savedPreset = (() => {
    try { return localStorage.getItem("rv_preset"); } catch { return null; }
  })();
  if (
    rainEngine &&
    savedPreset &&
    rainEngine.presets &&
    rainEngine.presets[savedPreset]
  ) {
    rainEngine.applyPreset(savedPreset);
  }

  const commandContext = {
    config: allData.config,
    userConfig: allData.config.user,
    skillsData: allData.skillsData,
    hobbiesData: allData.hobbiesData,
    manPages: allData.manPages,
    appendToTerminal: terminalController.appendToTerminal,
    terminalController: terminalController,
    rainEngine: rainEngine,
    renderTree: renderTree,
    mainContentContainer: document.getElementById("contentContainer"),
    dateCommandTimezoneAliases: Object.keys(allData.config.date.aliases),
    isCrtActive: isCrtModeActive,
    getCurrentTheme: terminalController.getCurrentThemeName,
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

  // Detect recruiter mode via URL path, hash, or query param
  const isRecruiterMode =
    window.location.pathname.replace(/\/$/, "").endsWith("/recruiter") ||
    window.location.hash === "#recruiter" ||
    new URLSearchParams(window.location.search).get("mode") === "recruiter";

  // Reveal sequence — avoids the startup "burst" (incl. on hard refresh, where
  // fonts reload): wait for fonts (so glyphs render) AND a minimum loader time,
  // start the rain so it establishes behind the still-visible loader, then fade
  // the loader out to reveal already-running, mid-stream rain.
  const minLoaderTime = new Promise((resolve) => setTimeout(resolve, 700));
  Promise.all([document.fonts.ready, minLoaderTime])
    .then(() => {
      if (rainEngine) rainEngine.start();
      hideLoadingScreen(() => {
        if (document.getElementById("contentContainer")) {
          document.getElementById("contentContainer").style.opacity = "1";
        }
        terminalController.focusInput();

        if (isRecruiterMode) {
          setTimeout(() => {
            registeredCommands.mission([], commandContext);
          }, 400);
        }

        // Deep link: ?cmd=<name> runs one command on load. Allowlisted to
        // registered, arg-less, [a-z]-only names — so a shared URL can never
        // inject markup or run anything but a known command.
        const deepLinkCmd = (
          new URLSearchParams(window.location.search).get("cmd") || ""
        )
          .toLowerCase()
          .replace(/[^a-z]/g, "");
        if (deepLinkCmd && registeredCommands[deepLinkCmd]) {
          setTimeout(() => terminalController.runCommand(deepLinkCmd), 500);
        }
      });
    })
    .catch((error) => {
      console.error("Error during final initialization step:", error);
    });

  window.addEventListener(
    "resize",
    debounce(() => {
      terminalController.reapplyTerminalSize();
    }, 150),
  );

  hydrateNavLinks(allData.config.user);

  // Mobile-friendly terminal toggle via nav icon
  const navToggleTerm = document.getElementById("nav-toggle-term");
  if (navToggleTerm) {
    navToggleTerm.addEventListener("click", (e) => {
      e.preventDefault();
      terminalController.toggleTerminalVisibility();
    });
  }

  // Title bar dot actions: close, minimize opacity, maximize size
  initTitleBarDots(terminalController);
});
