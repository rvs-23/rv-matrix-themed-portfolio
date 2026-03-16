/**
 * @file terminalController.js
 * Manages terminal DOM elements, input, output, history, and related functionalities.
 */

import {
  getLevenshteinDistance,
  getLongestCommonSubsequence,
} from "../utils.js";

const MAX_HISTORY = 100;

const state = {
  elements: { output: null, input: null, container: null },
  history: { entries: [], index: 0 },
  terminal: {
    visible: true,
    size: {},
    defaultSize: { width: "50vw", height: "50vh" },
    opacity: 0.8,
  },
  autocomplete: { prefix: "", suggestions: [], index: 0, commands: [] },
  config: { user: { userName: "User" }, welcomeMsg: "Welcome!" },
  commands: {},
  getContext: () => ({}),
};

export function focusInput() {
  if (state.elements.input) {
    state.elements.input.focus();
  }
}

export function initializeTerminalController(
  config,
  commands,
  commandContextFunc,
) {
  state.elements.output = document.getElementById("terminal-output");
  state.elements.input = document.getElementById("command-input");
  state.elements.container = document.getElementById("contentContainer");

  const termConfig = config.config.terminal;
  state.terminal.defaultSize =
    termConfig.defaultSize || state.terminal.defaultSize;
  state.terminal.size = { ...state.terminal.defaultSize };
  state.terminal.opacity =
    termConfig.initialOpacity || state.terminal.opacity;
  state.config.user = config.config.user || state.config.user;

  state.commands = commands;
  state.getContext = commandContextFunc;

  // Initialize available commands for autocomplete
  state.autocomplete.commands = Object.keys(state.commands).sort();

  // Setup initial styles and welcome message
  document.documentElement.style.setProperty(
    "--terminal-opacity",
    String(state.terminal.opacity),
  );
  const initialTheme =
    Array.from(document.body.classList).find((cls) =>
      cls.startsWith("theme-"),
    ) || "theme-green";
  document.body.classList.add(initialTheme);
  if (
    !getComputedStyle(document.documentElement).getPropertyValue(
      "--terminal-base-r",
    )
  ) {
    document.documentElement.style.setProperty("--terminal-base-r", "17");
    document.documentElement.style.setProperty("--terminal-base-g", "24");
    document.documentElement.style.setProperty("--terminal-base-b", "39");
  }
  updatePrimaryColorRGB();

  _applyDomConfigs(config.config);

  const plainNameArt = `<span class="ascii-name">${(state.config.user.name || "USER").toUpperCase()}</span>`;
  const welcomeText = `Type 'help' for commands. Toggle terminal: Ctrl + \\ or nav bar icon.`;
  state.config.welcomeMsg = `${plainNameArt}\n${welcomeText}`;

  if (state.elements.input) {
    state.elements.input.addEventListener("keydown", handleCommandInputKeydown);
    state.elements.input.addEventListener("input", () => {
      if (
        state.elements.input.value !== state.autocomplete.prefix &&
        !state.elements.input.value.startsWith(
          state.autocomplete.prefix.split(" ")[0] || "",
        )
      ) {
        state.autocomplete.prefix = "";
        state.autocomplete.suggestions = [];
        state.autocomplete.index = 0;
      }
    });
  }
  if (state.elements.container) {
    state.elements.container.addEventListener("click", (e) => {
      if (!state.terminal.visible) return;
      if (e.target.tagName !== "A" && e.target.tagName !== "INPUT") {
        if (state.elements.input) state.elements.input.focus();
      }
    });
  }

  displayInitialWelcomeMessage();
  document.body.classList.remove("terminal-hidden");

  reapplyTerminalSize();

  if (state.elements.input) state.elements.input.focus();
}

function _applyDomConfigs(config) {
  if (config.fonts) {
    document.documentElement.style.setProperty(
      "--font-stack-sans-serif",
      config.fonts.sansSerif,
    );
    document.documentElement.style.setProperty(
      "--font-stack-monospace",
      config.fonts.monospace,
    );
  }
}

export function appendToTerminal(htmlContent, type = "output-text-wrapper") {
  if (!state.elements.output) return null;
  const lineDiv = document.createElement("div");
  lineDiv.classList.add(type);
  lineDiv.innerHTML = htmlContent;
  state.elements.output.appendChild(lineDiv);
  state.elements.output.scrollTop = state.elements.output.scrollHeight;
  return lineDiv;
}

function handleCommandInputKeydown(e) {
  if (!state.terminal.visible) return;

  if (e.key === "Tab") {
    e.preventDefault();
    if (state.elements.input.disabled) return;
    handleAutocomplete();
    return;
  }

  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
    if (
      state.elements.input.value !== state.autocomplete.prefix.split(" ")[0] &&
      !state.autocomplete.suggestions.includes(state.elements.input.value)
    ) {
      state.autocomplete.prefix = "";
      state.autocomplete.suggestions = [];
      state.autocomplete.index = 0;
    }
  }

  if (e.key === "Enter") {
    e.preventDefault();
    if (state.elements.input.disabled) return;
    const fullCommandText = state.elements.input.value.trim();
    state.elements.input.value = "";

    state.autocomplete.prefix = "";
    state.autocomplete.suggestions = [];
    state.autocomplete.index = 0;

    if (fullCommandText) {
      if (
        state.history.entries.length === 0 ||
        state.history.entries[state.history.entries.length - 1] !== fullCommandText
      ) {
        state.history.entries.push(fullCommandText);
        if (state.history.entries.length > MAX_HISTORY) {
          state.history.entries.shift();
        }
      }
      state.history.index = state.history.entries.length;

      const sanitizedCommandDisplay = fullCommandText
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      appendToTerminal(
        `<div><span class="prompt-arrow">&gt;</span> <span class="output-command">${sanitizedCommandDisplay}</span></div>`,
      );

      processCommand(fullCommandText);
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (state.history.entries.length > 0) {
      state.history.index = Math.max(0, state.history.index - 1);
      state.elements.input.value = state.history.entries[state.history.index] || "";
      setTimeout(
        () =>
          state.elements.input.setSelectionRange(
            state.elements.input.value.length,
            state.elements.input.value.length,
          ),
        0,
      );
    }
    state.autocomplete.prefix = "";
    state.autocomplete.suggestions = [];
    state.autocomplete.index = 0;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (state.history.index < state.history.entries.length - 1) {
      state.history.index++;
      state.elements.input.value = state.history.entries[state.history.index];
    } else {
      state.history.index = state.history.entries.length;
      state.elements.input.value = "";
    }
    setTimeout(
      () =>
        state.elements.input.setSelectionRange(
          state.elements.input.value.length,
          state.elements.input.value.length,
        ),
      0,
    );
    state.autocomplete.prefix = "";
    state.autocomplete.suggestions = [];
    state.autocomplete.index = 0;
  }
}

function handleAutocomplete() {
  const currentFullInput = state.elements.input.value;
  const parts = currentFullInput.split(" ");
  const currentTypingPart =
    parts.length > 1 && !currentFullInput.endsWith(" ")
      ? parts.pop()
      : parts.length === 1
        ? parts[0]
        : "";

  if (
    currentFullInput !== state.autocomplete.prefix ||
    (currentFullInput.endsWith(" ") &&
      state.autocomplete.prefix !== currentFullInput)
  ) {
    state.autocomplete.index = 0;
    state.autocomplete.prefix = currentFullInput;

    const commandNamePart = currentFullInput.split(" ")[0].toLowerCase();
    if (
      currentFullInput.endsWith(" ") &&
      state.autocomplete.commands.includes(commandNamePart)
    ) {
      const context = state.getContext();
      state.autocomplete.suggestions = getArgumentSuggestions(
        commandNamePart,
        context,
        currentFullInput,
      );
    } else if (!currentFullInput.includes(" ")) {
      state.autocomplete.suggestions = state.autocomplete.commands.filter((cmd) =>
        cmd.startsWith(currentFullInput.toLowerCase()),
      );
    } else {
      state.autocomplete.suggestions = [];
    }
  }

  if (state.autocomplete.suggestions.length > 0) {
    let suggestion;
    if (currentFullInput.endsWith(" ") && !currentTypingPart) {
      suggestion =
        currentFullInput +
        state.autocomplete.suggestions[
          state.autocomplete.index % state.autocomplete.suggestions.length
        ];
    } else if (!currentFullInput.includes(" ")) {
      suggestion =
        state.autocomplete.suggestions[
          state.autocomplete.index % state.autocomplete.suggestions.length
        ];
    } else {
      const baseCommand = currentFullInput.substring(
        0,
        currentFullInput.lastIndexOf(" ") + 1,
      );
      const potentialArg =
        state.autocomplete.suggestions[
          state.autocomplete.index % state.autocomplete.suggestions.length
        ];
      if (potentialArg.startsWith(currentTypingPart)) {
        suggestion = baseCommand + potentialArg;
      } else {
        state.autocomplete.index++;
        if (state.autocomplete.index >= state.autocomplete.suggestions.length)
          state.autocomplete.index = 0;
        const nextPotentialArg =
          state.autocomplete.suggestions[
            state.autocomplete.index % state.autocomplete.suggestions.length
          ];
        if (nextPotentialArg.startsWith(currentTypingPart)) {
          suggestion = baseCommand + nextPotentialArg;
        } else {
          state.autocomplete.suggestions = [];
          return;
        }
      }
    }

    if (suggestion) {
      state.elements.input.value = suggestion;
      state.autocomplete.index++;
    }
  } else {
    state.autocomplete.index = 0;
    state.autocomplete.prefix = currentFullInput;
  }
}

function getArgumentSuggestions(commandName, context, currentInput) {
  const inputParts = currentInput.trim().split(" ");
  switch (commandName) {
    case "theme":
      return (context.config?.help?.availableThemes || []).sort();
    case "rainfont": {
      const fontSets = context.rainEngine?.fontSets
        ? Object.keys(context.rainEngine.fontSets)
        : [];
      return fontSets.sort();
    }
    case "rainpreset": {
      const presets = context.rainEngine?.presets
        ? Object.keys(context.rainEngine.presets)
        : [];
      return presets.sort();
    }
    case "man": {
      const manPageKeys = context.manPages ? Object.keys(context.manPages) : [];
      return manPageKeys.sort();
    }

    case "raininteract":
      return ["off", "thunder", "column"];
    case "resize":
      if (inputParts.length === 2 && inputParts[1] === "term") return ["reset"];
      if (inputParts.length === 1) return ["term"];
      return [];
    case "download":
      if (inputParts.length === 1) return ["cv"];
      return [];
    case "date": {
      const timezoneAliases = context.dateCommandTimezoneAliases || [
        "utc",
        "est",
        "pst",
        "ist",
        "jst",
        "gmt",
      ];
      return timezoneAliases.sort();
    }
    default:
      return [];
  }
}

async function processCommand(fullCommandText) {
  const parts = [];
  let inQuotes = false;
  let currentPart = "";
  for (let i = 0; i < fullCommandText.length; i++) {
    const char = fullCommandText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === " " && !inQuotes) {
      if (currentPart) parts.push(currentPart);
      currentPart = "";
    } else {
      currentPart += char;
    }
  }
  if (currentPart) parts.push(currentPart);

  const commandName = parts[0] ? parts[0].toLowerCase() : "";
  const args = parts.slice(1);

  const commandFunc = state.commands[commandName];
  const commandContext = state.getContext();

  if (typeof commandFunc === "function") {
    try {
      const result = commandFunc(args, commandContext);
      if (result && typeof result.then === "function") {
        await result;
      }
    } catch (err) {
      console.error("Error executing command:", commandName, err);
      appendToTerminal(
        `<div class="output-error">Command Error: ${err.message || "Unknown error"}</div>`,
      );
    }
  } else if (commandName) {
    const safeName = commandName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    appendToTerminal(
      `<div class="output-error">Command not found: ${safeName}</div>`,
    );

    // Suggest closest match: prefix > normalized Levenshtein, LCS tiebreaker
    let bestMatch = null;
    let bestScore = Infinity;
    let bestLcs = -1;
    let bestDist = Infinity;
    let closestRawMatch = null;
    let closestRawDist = Infinity;
    for (const cmd of state.autocomplete.commands) {
      const dist = getLevenshteinDistance(commandName, cmd);
      const lcs = getLongestCommonSubsequence(commandName, cmd);
      let score;
      if (cmd.startsWith(commandName) && commandName.length >= 2) {
        score = (cmd.length - commandName.length) / cmd.length * 0.3;
      } else if (commandName.startsWith(cmd)) {
        score = 0.25;
      } else {
        const maxLen = Math.max(commandName.length, cmd.length);
        score = maxLen > 0 ? dist / maxLen : 1;
      }
      // Primary: score. Tiebreak: higher LCS, then lower raw distance.
      const better =
        score < bestScore - 0.05 ||
        (score <= bestScore + 0.05 &&
          (lcs > bestLcs || (lcs === bestLcs && dist < bestDist)));
      if (better) {
        bestScore = Math.min(score, bestScore);
        bestMatch = cmd;
        bestLcs = lcs;
        bestDist = dist;
      }
      if (dist < closestRawDist) {
        closestRawDist = dist;
        closestRawMatch = cmd;
      }
    }
    // Short-string leniency: for inputs <=4 chars, accept raw distance <=2
    if (commandName.length <= 4 && closestRawDist <= 2 && closestRawMatch) {
      bestMatch = closestRawMatch;
      bestScore = 0;
    }
    if (bestMatch && bestScore <= 0.5) {
      appendToTerminal(
        `<div>Did you mean '<span class="output-success">${bestMatch}</span>'? Type 'help' for all commands.</div>`,
      );
    } else {
      appendToTerminal(
        `<div>Type 'help' for a list of available commands.</div>`,
      );
    }
  }
}

function displayInitialWelcomeMessage() {
  if (state.elements.output && state.config.welcomeMsg) {
    appendToTerminal(
      state.config.welcomeMsg.replace(/\n/g, "<br/>"),
      "output-welcome-wrapper",
    );
  }
}

export function clearTerminalOutput() {
  if (state.elements.output) {
    state.elements.output.innerHTML = "";
    displayInitialWelcomeMessage();
  }
}

export function resizeTerminalElement(width, height) {
  if (state.elements.container) {
    state.elements.container.style.width = width;
    state.elements.container.style.height = height;

    state.terminal.size = { width, height };

    appendToTerminal(
      `<div class='output-success'>Terminal resized to ${width} width, ${height} height.</div>`,
    );
  } else {
    appendToTerminal(
      "<div class='output-error'>Terminal container element not found for resize.</div>",
    );
  }
}

export function reapplyTerminalSize() {
  if (
    state.elements.container &&
    state.terminal.size.width &&
    state.terminal.size.height
  ) {
    state.elements.container.style.width = state.terminal.size.width;
    state.elements.container.style.height = state.terminal.size.height;
  }
}

export function getDefaultTerminalSize() {
  return { ...state.terminal.defaultSize };
}

export function toggleTerminalVisibility() {
  state.terminal.visible = !state.terminal.visible;

  state.elements.container.classList.remove("is-appearing", "is-hiding");

  if (!state.terminal.visible) {
    // ---- HIDING ----
    state.elements.container.classList.add("is-hiding");
    document.body.classList.add("terminal-hidden");

    state.elements.container.addEventListener(
      "animationend",
      function handleHideAnimationEnd() {
        state.elements.container.classList.add("hidden");
        state.elements.container.classList.remove("is-hiding");
        state.elements.container.removeEventListener(
          "animationend",
          handleHideAnimationEnd,
        );
      },
      { once: true },
    );

    if (state.elements.output) {
      appendToTerminal(
        `<div>Terminal hidden. Restore: Ctrl + \\ or nav icon.</div>`,
      );
    }
  } else {
    // ---- SHOWING ----
    state.elements.container.classList.remove("hidden");
    state.elements.container.style.display = "flex";

    state.elements.container.classList.add("is-appearing");
    document.body.classList.remove("terminal-hidden");

    state.elements.container.addEventListener(
      "animationend",
      function handleShowAnimationEnd() {
        state.elements.container.classList.remove("is-appearing");
        state.elements.container.removeEventListener(
          "animationend",
          handleShowAnimationEnd,
        );
      },
      { once: true },
    );

    setTimeout(() => {
      if (state.elements.input) state.elements.input.focus();
    }, 50);

    const lastMessageElement = state.elements.output
      ? state.elements.output.lastChild
      : null;
    const lastMessageText = lastMessageElement
      ? lastMessageElement.textContent
      : "";
    if (
      !lastMessageText ||
      (!lastMessageText.includes("Terminal interface hidden") &&
        !lastMessageText.includes("Terminal interface restored"))
    ) {
      if (state.elements.output) {
        appendToTerminal(
          `<div>Terminal restored. Hide: Ctrl + \\ or nav icon.</div>`,
        );
      }
    }
  }
}

export function setTerminalOpacity(opacityValue) {
  let newOpacity;
  if (opacityValue === "reset") {
    newOpacity = state.terminal.opacity;
  } else {
    let parsedInput = parseFloat(opacityValue);
    if (isNaN(parsedInput)) {
      appendToTerminal(
        "<div class='output-error'>Invalid opacity value. Must be a number (e.g., 75 or 0.75) or 'reset'.</div>",
      );
      return;
    }
    if (parsedInput > 1 && parsedInput <= 100) {
      newOpacity = parsedInput / 100;
    } else if (parsedInput >= 0 && parsedInput <= 1) {
      newOpacity = parsedInput;
    } else {
      appendToTerminal(
        "<div class='output-error'>Opacity value out of range. Must be 0-100 or 0.0-1.0.</div>",
      );
      return;
    }
  }
  newOpacity = Math.max(0, Math.min(1, newOpacity));
  document.documentElement.style.setProperty(
    "--terminal-opacity",
    String(newOpacity),
  );
  appendToTerminal(
    `<div class='output-success'>Terminal opacity set to ${(newOpacity * 100).toFixed(0)}%.</div>`,
  );
}

export function setTerminalFontSize(sizeInput) {
  const context = state.getContext();
  const fontSizesConfig = context.config.terminal.fontSizes;

  let newSize = "";
  const inputSize = sizeInput.toLowerCase();

  if (fontSizesConfig[inputSize]) {
    newSize = fontSizesConfig[inputSize];
  } else if (/^\d+(\.\d+)?(px|em|rem)$/i.test(inputSize)) {
    const sizeValue = parseFloat(inputSize);
    if (
      inputSize.endsWith("px") &&
      (sizeValue < fontSizesConfig.minPx || sizeValue > fontSizesConfig.maxPx)
    ) {
      appendToTerminal(
        `<div class='output-error'>Pixel size out of reasonable range (${fontSizesConfig.minPx}px-${fontSizesConfig.maxPx}px).</div>`,
      );
      return;
    }
    newSize = inputSize;
  } else {
    appendToTerminal(
      "<div class='output-error'>Invalid size. Use 'small', 'default', 'large', or a value like '10px', '1.2em'.</div>",
    );
    return;
  }
  document.documentElement.style.setProperty("--terminal-font-size", newSize);
  appendToTerminal(
    `<div class='output-success'>Terminal font size set to ${newSize}.</div>`,
  );
}

export function getCurrentThemeColors() {
  if (typeof getComputedStyle !== "undefined" && document.body) {
    const styles = getComputedStyle(document.body);
    return {
      primary: styles.getPropertyValue("--primary-color").trim() || "#0F0",
      secondary:
        styles.getPropertyValue("--secondary-color").trim() || "#00FFFF",
      glow:
        styles.getPropertyValue("--matrix-rain-glow-color").trim() || "#9FFF9F",
      background:
        styles.getPropertyValue("--background-color").trim() || "#000",
    };
  }
  return {
    primary: "#0F0",
    secondary: "#00FFFF",
    glow: "#9FFF9F",
    background: "#000",
  };
}

function updatePrimaryColorRGB() {
  if (typeof getComputedStyle === "undefined" || !document.body) return;

  let primaryColorValue = getComputedStyle(document.body)
    .getPropertyValue("--primary-color")
    .trim();
  let r, g, b;
  let parsedSuccessfully = false;

  if (primaryColorValue.startsWith("#")) {
    const hex = primaryColorValue.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      parsedSuccessfully = !isNaN(r) && !isNaN(g) && !isNaN(b);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      parsedSuccessfully = !isNaN(r) && !isNaN(g) && !isNaN(b);
    }
  }

  if (!parsedSuccessfully) {
    const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i.exec(
      primaryColorValue,
    );
    if (rgbMatch) {
      r = parseInt(rgbMatch[1]);
      g = parseInt(rgbMatch[2]);
      b = parseInt(rgbMatch[3]);
      parsedSuccessfully = true;
    }
  }

  if (parsedSuccessfully) {
    document.documentElement.style.setProperty(
      "--primary-color-rgb",
      `${r}, ${g}, ${b}`,
    );
  } else {
    console.warn(
      `Could not parse --primary-color ('${primaryColorValue}') to RGB. Defaulting --primary-color-rgb to green.`,
    );
    document.documentElement.style.setProperty(
      "--primary-color-rgb",
      `0, 255, 0`,
    );
  }
}

export function applyTheme(themeNameInput) {
  const context = state.getContext();
  const validSpecificThemes = context.config.help.availableThemes;

  const showThemeUsage = () => {
    const currentThemeClass =
      Array.from(document.body.classList).find((cls) =>
        cls.startsWith("theme-"),
      ) || "theme-green";
    appendToTerminal(
      "<div class='output-error'>Usage: theme &lt;name&gt;</div>",
    );
    appendToTerminal(
      `<div>Available themes: ${validSpecificThemes.sort().join(", ")}.</div>`,
    );
    appendToTerminal(
      `<div>Current theme: ${currentThemeClass.replace("theme-", "")}</div>`,
    );
  };

  if (!themeNameInput) {
    showThemeUsage();
    return false;
  }

  if (validSpecificThemes.includes(themeNameInput)) {
    document.body.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        document.body.classList.remove(className);
      }
    });
    const targetThemeClass = `theme-${themeNameInput}`;
    document.body.classList.add(targetThemeClass);
    updatePrimaryColorRGB();
    appendToTerminal(
      `<div class='output-success'>Theme set to ${targetThemeClass.replace("theme-", "")}.</div>`,
    );
    return true;
  } else {
    appendToTerminal(
      `<div class='output-error'>Error: Theme "${themeNameInput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" not found.</div>`,
    );
    showThemeUsage();
    return false;
  }
}

export function getFullWelcomeMessage() {
  return state.config.welcomeMsg;
}

export function getCurrentThemeName() {
  const themeClass = Array.from(document.body.classList).find((cls) =>
    cls.startsWith("theme-"),
  );
  return themeClass ? themeClass.replace("theme-", "") : "default";
}
