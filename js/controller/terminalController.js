/**
 * @file terminalController.js
 * Manages terminal DOM elements, input, output, history, and related functionalities.
 */

let terminalOutputEl, commandInputEl, mainContentContainerEl;
let currentTerminalSize = {};
let commandHistory = [];
let historyIndex = 0;
let terminalVisible = true;
let defaultTerminalSizeConfig = { width: "50vw", height: "50vh" }; // Fallback
let initialTermOpacityConfig = 0.8; // Fallback
let userDetailsConfig = { userName: "User" }; // Fallback
let fullWelcomeMsg = "Welcome!"; // Fallback

// To be initialized by main.js
let registeredCommands = {};
let getCommandContextFunction = () => ({});

// --- Autocomplete State Variables ---
let availableCommandsForAutocomplete = [];
let lastAutocompletePrefix = ""; // Stores the input prefix for current suggestions
let autocompleteSuggestions = []; // Stores current list of matching suggestions
let autocompleteIndex = 0; // Index for cycling through suggestions

export function focusInput() {
  if (commandInputEl) {
    commandInputEl.focus();
  }
}

export function initializeTerminalController(
  config,
  commands,
  commandContextFunc,
) {
  terminalOutputEl = document.getElementById("terminal-output");
  commandInputEl = document.getElementById("command-input");
  mainContentContainerEl = document.getElementById("contentContainer");

  const termConfig = config.config.terminal;
  defaultTerminalSizeConfig =
    termConfig.defaultSize || defaultTerminalSizeConfig;
  currentTerminalSize = { ...defaultTerminalSizeConfig }; // Initialize with default
  initialTermOpacityConfig =
    termConfig.initialOpacity || initialTermOpacityConfig;
  userDetailsConfig = config.config.user || userDetailsConfig;

  registeredCommands = commands; // Crucial for autocomplete
  getCommandContextFunction = commandContextFunc;

  // Initialize available commands for autocomplete
  availableCommandsForAutocomplete = Object.keys(registeredCommands).sort();

  // Setup initial styles and welcome message
  document.documentElement.style.setProperty(
    "--terminal-opacity",
    String(initialTermOpacityConfig),
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
  updatePrimaryColorRGB(); // Set initial --primary-color-rgb

  // Apply DOM-related configs from the main config module
  // This line was already correct
  _applyDomConfigs(config.config);

  const plainNameArt = `<span class="ascii-name">${(userDetailsConfig.name || "USER").toUpperCase()}</span>`;
  const welcomeText = `Welcome to ${userDetailsConfig.name || "User"}'s Terminal.\nType 'help' to see available commands.\n(Ctrl + \\ to toggle terminal visibility)\n---------------------------------------------------`;
  fullWelcomeMsg = `${plainNameArt}\n${welcomeText}`;

  if (commandInputEl) {
    commandInputEl.addEventListener("keydown", handleCommandInputKeydown);
    // Add event listener to reset autocomplete if input changes via non-keydown events (e.g. paste)
    commandInputEl.addEventListener("input", () => {
      if (
        commandInputEl.value !== lastAutocompletePrefix &&
        !commandInputEl.value.startsWith(
          lastAutocompletePrefix.split(" ")[0] || "",
        )
      ) {
        lastAutocompletePrefix = "";
        autocompleteSuggestions = [];
        autocompleteIndex = 0;
      }
    });
  }
  if (mainContentContainerEl) {
    mainContentContainerEl.addEventListener("click", (e) => {
      if (!terminalVisible) return;
      if (e.target.tagName !== "A" && e.target.tagName !== "INPUT") {
        if (commandInputEl) commandInputEl.focus();
      }
    });
  }

  displayInitialWelcomeMessage();
  document.body.classList.remove("terminal-hidden"); // Ensure terminal is visible initially

  reapplyTerminalSize();
  
  if (commandInputEl) commandInputEl.focus();
}

// Helper function to apply configurations to the DOM
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
  if (!terminalOutputEl) return null;
  const lineDiv = document.createElement("div");
  lineDiv.classList.add(type); // Use a general wrapper class
  lineDiv.innerHTML = htmlContent; // Content is already HTML
  terminalOutputEl.appendChild(lineDiv);
  terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
  return lineDiv;
}

function handleCommandInputKeydown(e) {
  if (!terminalVisible) return;

  if (e.key === "Tab") {
    e.preventDefault();
    if (commandInputEl.disabled) return;
    handleAutocomplete();
    return; // Prevent further processing for Tab
  }

  // Reset autocomplete state if any key other than Tab is pressed (or Enter, ArrowUp, ArrowDown if they don't use suggestions)
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
    // Keep suggestions if navigating history while suggestions are active from a previous tab
    if (
      commandInputEl.value !== lastAutocompletePrefix.split(" ")[0] &&
      !autocompleteSuggestions.includes(commandInputEl.value)
    ) {
      lastAutocompletePrefix = "";
      autocompleteSuggestions = [];
      autocompleteIndex = 0;
    }
  }

  if (e.key === "Enter") {
    e.preventDefault();
    if (commandInputEl.disabled) return;
    const fullCommandText = commandInputEl.value.trim();
    commandInputEl.value = ""; // Clear input immediately

    // Reset autocomplete state on Enter
    lastAutocompletePrefix = "";
    autocompleteSuggestions = [];
    autocompleteIndex = 0;

    if (fullCommandText) {
      if (
        commandHistory.length === 0 ||
        commandHistory[commandHistory.length - 1] !== fullCommandText
      ) {
        commandHistory.push(fullCommandText);
      }
      historyIndex = commandHistory.length;

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
    if (commandHistory.length > 0) {
      historyIndex = Math.max(0, historyIndex - 1);
      commandInputEl.value = commandHistory[historyIndex] || "";
      setTimeout(
        () =>
          commandInputEl.setSelectionRange(
            commandInputEl.value.length,
            commandInputEl.value.length,
          ),
        0,
      );
    }
    // Reset autocomplete if navigating history
    lastAutocompletePrefix = "";
    autocompleteSuggestions = [];
    autocompleteIndex = 0;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      commandInputEl.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      commandInputEl.value = "";
    }
    setTimeout(
      () =>
        commandInputEl.setSelectionRange(
          commandInputEl.value.length,
          commandInputEl.value.length,
        ),
      0,
    );
    // Reset autocomplete if navigating history
    lastAutocompletePrefix = "";
    autocompleteSuggestions = [];
    autocompleteIndex = 0;
  }
  // Other keys will be handled by the 'input' event listener for resetting autocomplete if necessary
}

function handleAutocomplete() {
  const currentFullInput = commandInputEl.value;
  const parts = currentFullInput.split(" ");
  const currentTypingPart =
    parts.length > 1 && !currentFullInput.endsWith(" ")
      ? parts.pop()
      : parts.length === 1
        ? parts[0]
        : "";

  // If the input is different from the last prefix used for suggestions,
  // or if we are trying to get new argument suggestions
  if (
    currentFullInput !== lastAutocompletePrefix ||
    (currentFullInput.endsWith(" ") &&
      lastAutocompletePrefix !== currentFullInput)
  ) {
    autocompleteIndex = 0; // Reset index for new suggestions
    lastAutocompletePrefix = currentFullInput; // Update the prefix

    const commandNamePart = currentFullInput.split(" ")[0].toLowerCase();
    if (
      currentFullInput.endsWith(" ") &&
      availableCommandsForAutocomplete.includes(commandNamePart)
    ) {
      // Trying to get argument suggestions for a completed command
      const context = getCommandContextFunction();
      autocompleteSuggestions = getArgumentSuggestions(
        commandNamePart,
        context,
        currentFullInput,
      );
    } else if (!currentFullInput.includes(" ")) {
      // Trying to get command name suggestions
      autocompleteSuggestions = availableCommandsForAutocomplete.filter((cmd) =>
        cmd.startsWith(currentFullInput.toLowerCase()),
      );
    } else {
      autocompleteSuggestions = []; // No suggestions for other cases (e.g. typing second arg)
    }
  }

  if (autocompleteSuggestions.length > 0) {
    let suggestion;
    if (currentFullInput.endsWith(" ") && !currentTypingPart) {
      // Suggesting first argument
      suggestion =
        currentFullInput +
        autocompleteSuggestions[
          autocompleteIndex % autocompleteSuggestions.length
        ];
    } else if (!currentFullInput.includes(" ")) {
      // Suggesting command
      suggestion =
        autocompleteSuggestions[
          autocompleteIndex % autocompleteSuggestions.length
        ];
    } else {
      // Suggesting argument completion (if currentTypingPart is part of an argument)
      const baseCommand = currentFullInput.substring(
        0,
        currentFullInput.lastIndexOf(" ") + 1,
      );
      const potentialArg =
        autocompleteSuggestions[
          autocompleteIndex % autocompleteSuggestions.length
        ];
      if (potentialArg.startsWith(currentTypingPart)) {
        suggestion = baseCommand + potentialArg;
      } else {
        // If current suggestions don't match the typing part, cycle to next valid one or reset
        autocompleteIndex++;
        if (autocompleteIndex >= autocompleteSuggestions.length)
          autocompleteIndex = 0;
        const nextPotentialArg =
          autocompleteSuggestions[
            autocompleteIndex % autocompleteSuggestions.length
          ];
        if (nextPotentialArg.startsWith(currentTypingPart)) {
          suggestion = baseCommand + nextPotentialArg;
        } else {
          // Could not find a matching suggestion for the current typed part, maybe clear or beep
          autocompleteSuggestions = []; // Clear suggestions
          return;
        }
      }
    }

    if (suggestion) {
      commandInputEl.value = suggestion;
      autocompleteIndex++; // Move to next suggestion for subsequent Tab
    }
  } else {
    autocompleteIndex = 0; // No suggestions, reset index
    lastAutocompletePrefix = currentFullInput; // Still update prefix to prevent re-querying immediately
  }
}

function getArgumentSuggestions(commandName, context, currentInput) {
  const inputParts = currentInput.trim().split(" ");
  switch (commandName) {
    case "theme":
      return [
        "amber",
        "cyan",
        "green",
        "purple",
        "twilight",
        "crimson",
        "forest",
        "goldenglitch",
        "retroarcade",
        "reloaded",
        "voidblue",
      ].sort();
    case "rainpreset": {
      const presets =
        context.rainOptions && context.rainOptions.getRainPresets
          ? Object.keys(context.rainOptions.getRainPresets())
          : [];
      return presets.sort();
    }
    case "man": {
      const manPageKeys = context.manPages ? Object.keys(context.manPages) : [];
      return manPageKeys.sort();
    }

    case "resize":
      if (inputParts.length === 2 && inputParts[1] === "term") return ["reset"]; // Suggest 'reset' after 'resize term'
      if (inputParts.length === 1) return ["term"]; // Suggest 'term' after 'resize'
      return [];
    case "download":
      if (inputParts.length === 1) return ["cv"];
      return [];
    case "date": {
      // Assuming context.dateCommandTimezoneAliases is populated if available
      // For this example, using a placeholder. In a real scenario, this data should be accessible.
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

  const commandFunc = registeredCommands[commandName];
  const commandContext = getCommandContextFunction();

  if (typeof commandFunc === "function") {
    try {
      // Pass context to the command function
      const result = commandFunc(args, commandContext);
      if (result && typeof result.then === "function") {
        await result; // Handle async commands
      }
    } catch (err) {
      console.error("Error executing command:", commandName, err);
      appendToTerminal(
        `<div class="output-error">Command Error: ${err.message || "Unknown error"}</div>`,
      );
    }
  } else if (commandName) {
    appendToTerminal(
      `<div class="output-error">Command not found: ${commandName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`,
    );
    appendToTerminal(
      `<div>Type 'help' for a list of available commands.</div>`,
    );
  }
}

export function displayInitialWelcomeMessage() {
  if (terminalOutputEl && fullWelcomeMsg) {
    appendToTerminal(
      fullWelcomeMsg.replace(/\n/g, "<br/>"),
      "output-welcome-wrapper",
    );
  }
}

export function clearTerminalOutput() {
  if (terminalOutputEl) {
    terminalOutputEl.innerHTML = "";
    displayInitialWelcomeMessage();
  }
}

export function resizeTerminalElement(width, height) {
  if (mainContentContainerEl) {
    mainContentContainerEl.style.width = width;
    mainContentContainerEl.style.height = height;

    currentTerminalSize = { width, height };

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
    mainContentContainerEl &&
    currentTerminalSize.width &&
    currentTerminalSize.height
  ) {
    mainContentContainerEl.style.width = currentTerminalSize.width;
    mainContentContainerEl.style.height = currentTerminalSize.height;
  }
}

export function getDefaultTerminalSize() {
  return { ...defaultTerminalSizeConfig };
}

export function toggleTerminalVisibility() {
  terminalVisible = !terminalVisible;

  // Clear any existing animation/state classes to prevent conflicts
  mainContentContainerEl.classList.remove("is-appearing", "is-hiding");

  if (!terminalVisible) {
    // ---- HIDING ----
    mainContentContainerEl.classList.add("is-hiding");
    document.body.classList.add("terminal-hidden"); // For nav bar, etc.

    // Listen for the end of the fade-out animation
    mainContentContainerEl.addEventListener(
      "animationend",
      function handleHideAnimationEnd() {
        mainContentContainerEl.classList.add("hidden"); // Truly hide it (display: none)
        mainContentContainerEl.classList.remove("is-hiding"); // Clean up animation class
        mainContentContainerEl.removeEventListener(
          "animationend",
          handleHideAnimationEnd,
        ); // Clean up listener
      },
      { once: true },
    ); // Ensure listener runs only once

    if (terminalOutputEl) {
      appendToTerminal(
        `<div>Terminal interface hidden. Ctrl + \\ to restore.</div>`,
      );
    }
  } else {
    // ---- SHOWING ----
    // Prepare for appearance: remove 'hidden' and ensure correct display type
    mainContentContainerEl.classList.remove("hidden");
    mainContentContainerEl.style.display = "flex"; // Or your default for .content-container

    mainContentContainerEl.classList.add("is-appearing");
    document.body.classList.remove("terminal-hidden");

    // Clean up 'is-appearing' after animation completes
    mainContentContainerEl.addEventListener(
      "animationend",
      function handleShowAnimationEnd() {
        mainContentContainerEl.classList.remove("is-appearing");
        mainContentContainerEl.removeEventListener(
          "animationend",
          handleShowAnimationEnd,
        );
      },
      { once: true },
    );

    setTimeout(() => {
      if (commandInputEl) commandInputEl.focus();
    }, 50); // Small delay for focus after animation starts

    const lastMessageElement = terminalOutputEl
      ? terminalOutputEl.lastChild
      : null;
    const lastMessageText = lastMessageElement
      ? lastMessageElement.textContent
      : "";
    if (
      !lastMessageText ||
      (!lastMessageText.includes("Terminal interface hidden") &&
        !lastMessageText.includes("Terminal interface restored"))
    ) {
      if (terminalOutputEl) {
        appendToTerminal(
          `<div>Terminal interface restored. Ctrl + \\ to hide.</div>`,
        );
      }
    }
  }
}

export function setTerminalOpacity(opacityValue) {
  let newOpacity;
  if (opacityValue === "reset") {
    newOpacity = initialTermOpacityConfig;
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
  newOpacity = Math.max(0, Math.min(1, newOpacity)); // Clamp
  document.documentElement.style.setProperty(
    "--terminal-opacity",
    String(newOpacity),
  );
  appendToTerminal(
    `<div class='output-success'>Terminal opacity set to ${(newOpacity * 100).toFixed(0)}%.</div>`,
  );
}

export function getInitialTerminalOpacity() {
  return initialTermOpacityConfig;
}

export function setTerminalFontSize(sizeInput) {
  // ++ Get config from context
  const context = getCommandContextFunction();
  const fontSizesConfig = context.config.terminal.fontSizes;

  let newSize = "";
  const inputSize = sizeInput.toLowerCase();

  // ++ Use config for size mapping
  if (fontSizesConfig[inputSize]) {
    newSize = fontSizesConfig[inputSize];
  } else if (/^\d+(\.\d+)?(px|em|rem)$/i.test(inputSize)) {
    const sizeValue = parseFloat(inputSize);
    // ++ Use config for validation
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
  // Fallback if styles are not available (e.g., during initial script load before body is fully parsed)
  return {
    primary: "#0F0",
    secondary: "#00FFFF",
    glow: "#9FFF9F",
    background: "#000",
  };
}

export function updatePrimaryColorRGB() {
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
  const context = getCommandContextFunction();
  const validSpecificThemes = context.config.help.availableThemes;

  const showThemeUsage = () => {
    const currentThemeClass =
      Array.from(document.body.classList).find((cls) =>
        cls.startsWith("theme-"),
      ) || "theme-green"; // Default to green
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
    return false; // Indicate theme was not applied
  }

  // The themeNameInput is already lowercased by the command processor
  if (validSpecificThemes.includes(themeNameInput)) {
    // Remove any existing theme-xxxx class
    document.body.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        document.body.classList.remove(className);
      }
    });
    // Add the new theme class
    const targetThemeClass = `theme-${themeNameInput}`;
    document.body.classList.add(targetThemeClass);
    updatePrimaryColorRGB(); // Update --primary-color-rgb for styles dependent on it
    appendToTerminal(
      `<div class='output-success'>Theme set to ${targetThemeClass.replace("theme-", "")}.</div>`,
    );
    return true; // Theme applied successfully
  } else {
    appendToTerminal(
      `<div class='output-error'>Error: Theme "${themeNameInput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" not found.</div>`,
    );
    showThemeUsage();
    return false; // Theme not found
  }
}

export function getFullWelcomeMessage() {
  return fullWelcomeMsg;
}

export function getCurrentThemeName() {
  const themeClass = Array.from(document.body.classList).find((cls) =>
    cls.startsWith("theme-"),
  );
  return themeClass ? themeClass.replace("theme-", "") : "default";
}
