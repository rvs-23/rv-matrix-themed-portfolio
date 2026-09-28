// @ts-check
/**
 * @file terminalController.js
 * Manages terminal DOM elements, input, output, history, and related functionalities.
 */

import {
  getLevenshteinDistance,
  getLongestCommonSubsequence,
  own,
} from "../utils.js";
import { recordEgg } from "../eggs.js";
import { decodeReveal } from "../effects/decode.js";
import { HIDDEN_COMMANDS } from "../commands/0_index.js";
import { listedManPages } from "../commands/man.js";
import { RAIN_SUBCOMMANDS, GRAVITY_LEVELS } from "../commands/rain.js";

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
  autocomplete: {
    prefix: "",
    suggestions: [],
    index: 0,
    commands: [],
    lastApplied: "",
  },
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
    termConfig.initialOpacity ?? state.terminal.opacity;
  state.config.user = config.config.user || state.config.user;

  state.commands = commands;
  state.getContext = commandContextFunc;

  // Initialize available commands for autocomplete + did-you-mean. Hidden
  // easter eggs are excluded from both — discoverable by lore only.
  state.autocomplete.commands = Object.keys(state.commands)
    .filter((cmd) => !HIDDEN_COMMANDS.has(cmd))
    .sort();

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
        state.autocomplete.lastApplied = "";
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

  // Tapping the rain (outside the terminal) blurs the input — the touch
  // equivalent of Esc/Ctrl+\ for dismissing the mobile keyboard. Listen on
  // document, not the canvas: #matrix-canvas is pointer-events:none, so taps
  // pass straight through it and a canvas listener never fires.
  document.addEventListener("pointerdown", (e) => {
    if (document.activeElement !== state.elements.input) return;
    if (state.elements.container?.contains(e.target)) return;
    state.elements.input?.blur();
  });

  displayInitialWelcomeMessage(true);
  renderCommandChips();
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

/** Echo + record + dispatch a command line. Shared by Enter and runCommand. */
function submitCommand(fullCommandText) {
  if (!fullCommandText) return;
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

  void processCommand(fullCommandText);
}

/** Run a command programmatically — used by click-to-run chips and deep links. */
export function runCommand(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  if (state.elements.input) state.elements.input.value = "";
  state.autocomplete.prefix = "";
  state.autocomplete.suggestions = [];
  state.autocomplete.index = 0;
  state.autocomplete.lastApplied = "";
  submitCommand(trimmed);
  focusInput();
}

/**
 * Lock or unlock command entry — the input and the click-to-run chips — for
 * cinematic sequences (`wake`). Unlocking also refocuses the input.
 * @param {boolean} locked
 */
export function setInputLocked(locked) {
  if (state.elements.input) state.elements.input.disabled = locked;
  document
    .querySelectorAll("#command-chips .command-chip")
    .forEach((chip) => {
      /** @type {HTMLButtonElement} */ (chip).disabled = locked;
    });
  if (!locked) focusInput();
}

/** Render clickable command chips above the input for quick discovery. */
function renderCommandChips() {
  const host = document.getElementById("command-chips");
  if (!host) return;
  const chips = ["whoami", "skills", "contact", "mission", "rain", "help"];
  host.replaceChildren();
  for (const cmd of chips) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "command-chip";
    btn.textContent = cmd;
    btn.setAttribute("aria-label", `Run ${cmd}`);
    btn.addEventListener("click", () => runCommand(cmd));
    host.appendChild(btn);
  }
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
      state.autocomplete.lastApplied = "";
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
    state.autocomplete.lastApplied = "";

    submitCommand(fullCommandText);
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
    state.autocomplete.lastApplied = "";
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
    state.autocomplete.lastApplied = "";
  }
}

function handleAutocomplete() {
  const currentFullInput = state.elements.input.value;

  // A prior Tab writes a completion straight into input.value, which doesn't
  // fire the 'input' listener (only real typing does), so lastApplied still
  // matches here. Treat this as "keep cycling" instead of recomputing —
  // otherwise the applied text gets reinterpreted as a brand-new prefix and
  // the match list collapses to just itself, locking autocomplete on one word.
  if (
    currentFullInput === state.autocomplete.lastApplied &&
    state.autocomplete.suggestions.length > 0
  ) {
    const baseCommand = currentFullInput.includes(" ")
      ? currentFullInput.substring(0, currentFullInput.lastIndexOf(" ") + 1)
      : "";
    const suggestion =
      baseCommand +
      state.autocomplete.suggestions[
        state.autocomplete.index % state.autocomplete.suggestions.length
      ];
    state.elements.input.value = suggestion;
    state.autocomplete.lastApplied = suggestion;
    state.autocomplete.index++;
    return;
  }

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
    state.autocomplete.lastApplied = "";

    const commandNamePart = currentFullInput.split(" ")[0].toLowerCase();
    if (
      currentFullInput.includes(" ") &&
      state.autocomplete.commands.includes(commandNamePart)
    ) {
      // Argument completion — also mid-word ("rain preset c" + Tab), not only
      // after a trailing space. Pre-filtering by the partly-typed word keeps
      // Tab-cycling on actual matches instead of the whole argument list.
      const context = state.getContext();
      let suggestions = getArgumentSuggestions(
        commandNamePart,
        context,
        currentFullInput,
      );
      if (currentTypingPart) {
        const typed = currentTypingPart.toLowerCase();
        suggestions = suggestions.filter((s) => s.startsWith(typed));
      }
      state.autocomplete.suggestions = suggestions;
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
    const pick =
      state.autocomplete.suggestions[
        state.autocomplete.index % state.autocomplete.suggestions.length
      ];
    if (!currentFullInput.includes(" ")) {
      suggestion = pick;
    } else {
      // Argument position: suggestions are already filtered to the typed part,
      // so completing is always "everything up to the last space" + the pick.
      const baseCommand = currentFullInput.substring(
        0,
        currentFullInput.lastIndexOf(" ") + 1,
      );
      suggestion = baseCommand + pick;
    }

    if (suggestion) {
      state.elements.input.value = suggestion;
      state.autocomplete.lastApplied = suggestion;
      state.autocomplete.index++;
    }
  } else {
    state.autocomplete.index = 0;
    state.autocomplete.prefix = currentFullInput;
    state.autocomplete.lastApplied = "";
  }
}

// Exported for the contract smoke test — pure function of (command, context, input).
export function getArgumentSuggestions(commandName, context, currentInput) {
  const inputParts = currentInput.trim().split(/\s+/);
  // Words the user has finished typing: a trailing space commits the last word,
  // otherwise it's still being typed. Fixes "rain preset " + Tab suggesting
  // subcommands (the old trim-then-split dropped the trailing space, so a
  // committed 2-word input was indistinguishable from a mid-word one).
  const completedParts = currentInput.endsWith(" ")
    ? inputParts.length
    : inputParts.length - 1;
  // Copies before sorting: these lists are shared config arrays.
  switch (commandName) {
    case "theme":
      // Single-argument commands: nothing to complete after the first arg.
      if (completedParts >= 2) return [];
      return [...(context.config?.help?.availableThemes || [])].sort();
    case "rain": {
      if (completedParts <= 1) {
        return [...RAIN_SUBCOMMANDS];
      }
      const rainSub = inputParts[1]?.toLowerCase();
      if (rainSub === "preset") {
        const presets = context.rainEngine?.presets ? Object.keys(context.rainEngine.presets) : [];
        return presets.sort();
      }
      if (rainSub === "font") {
        const fontSets = context.rainEngine?.fontSets ? Object.keys(context.rainEngine.fontSets) : [];
        return fontSets.sort();
      }
      if (rainSub === "size") return ["reset"];
      if (rainSub === "gravity") return ["off", ...Object.keys(GRAVITY_LEVELS)];
      if (rainSub === "glyphspeed") return ["reset", "1", "3", "6", "10", "15", "20"];
      if (rainSub === "torch") return ["on", "off"];
      return [];
    }
    case "term": {
      if (completedParts <= 1) {
        return ["opacity", "fontsize", "size"];
      }
      const termSub = inputParts[1]?.toLowerCase();
      if (termSub === "opacity") return ["reset"];
      if (termSub === "fontsize") return ["small", "default", "large"];
      if (termSub === "size") return ["reset"];
      return [];
    }
    case "man":
      if (completedParts >= 2) return [];
      return listedManPages(context.manPages);
    case "download":
      if (completedParts <= 1) return ["cv"];
      return [];
    case "date": {
      if (completedParts >= 2) return [];
      const timezoneAliases = context.dateCommandTimezoneAliases || [
        "utc",
        "est",
        "pst",
        "ist",
        "jst",
        "gmt",
      ];
      return [...timezoneAliases].sort();
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

  const commandFunc = Object.hasOwn(state.commands, commandName)
    ? state.commands[commandName]
    : undefined;
  const commandContext = state.getContext();

  if (typeof commandFunc === "function") {
    try {
      const result = commandFunc(args, commandContext);
      if (result && typeof result.then === "function") {
        await result;
      }
      recordEgg(commandName); // no-op unless it's a tracked easter egg
    } catch (err) {
      console.error("Error executing command:", commandName, err);
      appendToTerminal(
        `<div class="output-error">Command Error: ${err.message || "Unknown error"}</div>`,
      );
    }
  } else if (commandName) {
    // Multi-word input that isn't a command reads like a question → route it
    // through `ask` (local keyword matching) instead of a flat "not found".
    // Same containment as the normal dispatch path: a throw here would
    // otherwise reject processCommand's promise unhandled.
    if (parts.length > 1 && typeof state.commands.ask === "function") {
      try {
        state.commands.ask(parts, commandContext);
      } catch (err) {
        console.error("Error executing command: ask", err);
        appendToTerminal(
          `<div class="output-error">Command Error: ${err.message || "Unknown error"}</div>`,
        );
      }
      return;
    }

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

// Holds the deferred decode-on-load tagline animation until the loader fades.
let pendingWelcomeDecode = null;

function displayInitialWelcomeMessage(animate = false) {
  if (!state.elements.output || !state.config.welcomeMsg) return;

  // welcomeMsg is "<name banner>\n<tagline>". Show the banner instantly; the
  // tagline can decode-reveal on first load only (not on every `clear`).
  const [nameHtml, ...taglineParts] = state.config.welcomeMsg.split("\n");
  const tagline = taglineParts.join(" ");
  const wrapper = appendToTerminal(
    `${nameHtml}<br/><span class="welcome-tagline"></span>`,
    "output-welcome-wrapper",
  );
  const taglineEl = /** @type {HTMLElement|null} */ (
    wrapper?.querySelector(".welcome-tagline")
  );
  if (!taglineEl) return;

  const reduce = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (animate && !reduce) {
    // Stash the decode rather than running it now: init happens behind the
    // still-visible loader, so playing it here would finish unseen. main.js
    // calls playWelcomeDecode() once the loader fades and the terminal shows.
    pendingWelcomeDecode = () =>
      decodeReveal(taglineEl, tagline, { duration: 900 });
  } else {
    taglineEl.textContent = tagline;
  }
}

/** Play the deferred decode-on-load tagline (once, after the loader hides). */
export function playWelcomeDecode() {
  if (!pendingWelcomeDecode) return;
  const run = pendingWelcomeDecode;
  pendingWelcomeDecode = null;
  run(); // fire-and-forget: decoration, never blocks input
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

/**
 * Restore terminal appearance (opacity, font size, window size) to startup
 * defaults — silently, with no per-setting output. Used by the `reset` command,
 * which otherwise left these CSS overrides in place despite claiming a full reset.
 */
export function resetTerminalAppearance() {
  document.documentElement.style.setProperty(
    "--terminal-opacity",
    String(state.terminal.opacity),
  );
  // Drop the inline override so font size reverts to the CSS :root default.
  document.documentElement.style.removeProperty("--terminal-font-size");
  state.terminal.size = { ...state.terminal.defaultSize };
  if (state.elements.container) {
    state.elements.container.style.width = state.terminal.defaultSize.width;
    state.elements.container.style.height = state.terminal.defaultSize.height;
  }
}

const TERMINAL_HIDDEN_MSG = "Terminal hidden. Restore: Ctrl + \\ or nav icon.";
const TERMINAL_RESTORED_MSG = "Terminal restored. Hide: Ctrl + \\ or nav icon.";

// The in-flight show/hide animationend handler. Every toggle drops it first,
// so a hide handler can't outlive a fast re-show and fire on the show
// animation's animationend (which stranded a "visible" terminal as .hidden).
let pendingToggleEnd = null;

/** Run `finish` when the container's own toggle animation ends. */
function onToggleAnimationEnd(container, finish) {
  if (pendingToggleEnd) {
    container.removeEventListener("animationend", pendingToggleEnd);
    pendingToggleEnd = null;
  }
  // Reduced motion sets `animation: none`, so animationend never fires —
  // apply the end state now instead of leaking a listener that never runs.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }
  pendingToggleEnd = (e) => {
    if (e.target !== container) return; // bubbled from a child animation
    container.removeEventListener("animationend", pendingToggleEnd);
    pendingToggleEnd = null;
    finish();
  };
  container.addEventListener("animationend", pendingToggleEnd);
}

export function toggleTerminalVisibility() {
  state.terminal.visible = !state.terminal.visible;

  const container = state.elements.container;
  container.classList.remove("is-appearing", "is-hiding");

  if (!state.terminal.visible) {
    // ---- HIDING ----
    // Drop focus so the mobile on-screen keyboard dismisses with the terminal.
    state.elements.input?.blur();
    container.classList.add("is-hiding");
    document.body.classList.add("terminal-hidden");

    onToggleAnimationEnd(container, () => {
      container.classList.add("hidden");
      container.classList.remove("is-hiding");
    });

    if (state.elements.output) {
      appendToTerminal(`<div>${TERMINAL_HIDDEN_MSG}</div>`);
    }
  } else {
    // ---- SHOWING ----
    container.classList.remove("hidden");
    container.style.display = "flex";

    container.classList.add("is-appearing");
    document.body.classList.remove("terminal-hidden");

    onToggleAnimationEnd(container, () => {
      container.classList.remove("is-appearing");
    });

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
      (!lastMessageText.includes(TERMINAL_HIDDEN_MSG) &&
        !lastMessageText.includes(TERMINAL_RESTORED_MSG))
    ) {
      if (state.elements.output) {
        appendToTerminal(`<div>${TERMINAL_RESTORED_MSG}</div>`);
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

/**
 * Resolve a `term fontsize` argument to a CSS size — pure, so the contract
 * test can feed it hostile keys. Named sizes are own-property lookups.
 * @param {string} sizeInput
 * @param {Record<string, any>} fontSizesConfig
 * @returns {{ size: string } | { error: string }}
 */
export function resolveTerminalFontSize(sizeInput, fontSizesConfig) {
  const inputSize = sizeInput.toLowerCase();
  const named = own(fontSizesConfig, inputSize);

  if (typeof named === "string") {
    return { size: named };
  }
  if (/^\d+(\.\d+)?(px|em|rem)$/i.test(inputSize)) {
    const sizeValue = parseFloat(inputSize);
    if (
      inputSize.endsWith("px") &&
      (sizeValue < fontSizesConfig.minPx || sizeValue > fontSizesConfig.maxPx)
    ) {
      return {
        error: `Pixel size out of reasonable range (${fontSizesConfig.minPx}px-${fontSizesConfig.maxPx}px).`,
      };
    }
    return { size: inputSize };
  }
  return {
    error:
      "Invalid size. Use 'small', 'default', 'large', or a value like '10px', '1.2em'.",
  };
}

export function setTerminalFontSize(sizeInput) {
  const context = state.getContext();
  const result = resolveTerminalFontSize(
    sizeInput,
    context.config.terminal.fontSizes,
  );

  if ("error" in result) {
    appendToTerminal(`<div class='output-error'>${result.error}</div>`);
    return;
  }
  document.documentElement.style.setProperty("--terminal-font-size", result.size);
  appendToTerminal(
    `<div class='output-success'>Terminal font size set to ${result.size}.</div>`,
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

/**
 * @param {string} themeNameInput
 * @param {{ quiet?: boolean }} [opts] - `quiet` skips the success line.
 */
export function applyTheme(themeNameInput, { quiet = false } = {}) {
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
      `<div>Available themes: ${[...validSpecificThemes].sort().join(", ")}.</div>`,
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
    if (!quiet) {
      appendToTerminal(
        `<div class='output-success'>Theme set to ${targetThemeClass.replace("theme-", "")}.</div>`,
      );
    }
    return true;
  } else {
    appendToTerminal(
      `<div class='output-error'>Error: Theme "${themeNameInput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" not found.</div>`,
    );
    showThemeUsage();
    return false;
  }
}

export function getCurrentThemeName() {
  const themeClass = Array.from(document.body.classList).find((cls) =>
    cls.startsWith("theme-"),
  );
  return themeClass ? themeClass.replace("theme-", "") : "default";
}
