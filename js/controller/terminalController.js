/**
 * @file terminalController.js
 * Manages terminal DOM elements, input, output, history, and related functionalities.
 */

let terminalOutputEl, commandInputEl, mainContentContainerEl;
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

export function initializeTerminalController(
  config,
  commands,
  commandContextFunc,
) {
  terminalOutputEl = document.getElementById("terminal-output");
  commandInputEl = document.getElementById("command-input");
  mainContentContainerEl = document.getElementById("contentContainer");

  defaultTerminalSizeConfig =
    config.terminalConfig.defaultTerminalSize || defaultTerminalSizeConfig;
  initialTermOpacityConfig =
    config.terminalConfig.initialTerminalOpacity || initialTermOpacityConfig;
  userDetailsConfig = config.userConfig || userDetailsConfig;
  registeredCommands = commands;
  getCommandContextFunction = commandContextFunc;

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

  const plainNameArt = `<span class="ascii-name">${(userDetailsConfig.userName || "USER").toUpperCase()}</span>`;
  const welcomeText = `Welcome to ${userDetailsConfig.userName || "User"}'s Terminal.\nType 'help' to see available commands.\n(Ctrl + \\ to toggle terminal visibility)\n---------------------------------------------------`;
  fullWelcomeMsg = `${plainNameArt}\n${welcomeText}`;

  if (commandInputEl) {
    commandInputEl.addEventListener("keydown", handleCommandInputKeydown);
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
  if (commandInputEl) commandInputEl.focus();
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

  if (e.key === "Enter") {
    e.preventDefault();
    if (commandInputEl.disabled) return;
    const fullCommandText = commandInputEl.value.trim();
    commandInputEl.value = ""; // Clear input immediately

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
  } else if (e.key === "Tab") {
    e.preventDefault(); // Basic tab prevention, implement autocomplete if needed
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
    appendToTerminal(
      `<div class='output-success'>Terminal resized to ${width} width, ${height} height.</div>`,
    );
  } else {
    appendToTerminal(
      "<div class='output-error'>Terminal container element not found for resize.</div>",
    );
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
  let newSize = "";
  const inputSize = sizeInput.toLowerCase();
  if (inputSize === "small") newSize = "10.5px";
  else if (inputSize === "default")
    newSize = "12.5px"; // Assuming a default from your CSS
  else if (inputSize === "large") newSize = "15px";
  else if (/^\d+(\.\d+)?(px|em|rem)$/i.test(inputSize)) {
    const sizeValue = parseFloat(inputSize);
    if (inputSize.endsWith("px") && (sizeValue < 7 || sizeValue > 28)) {
      appendToTerminal(
        "<div class='output-error'>Pixel size out of reasonable range (7px-28px).</div>",
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
  // Define your valid themes here.
  const validSpecificThemes = [
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
    "synthwavegrid",
    "voidblue",
  ];

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
    ); // Removed 'dark' from here
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
    // The old 'dark' theme logic that reverted to green is now removed.
    // If a theme is not in validSpecificThemes, it's considered not found.
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
