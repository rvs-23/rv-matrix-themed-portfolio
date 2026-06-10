/**
 * @file js/commands/term.js
 * Umbrella command for all terminal appearance customization.
 * Subcommands: opacity, fontsize, size
 */

import { escapeHtml } from "../utils.js";

export default function termCommand(args, context) {
  const { appendToTerminal, terminalController, config } = context;

  if (!args || args.length === 0) {
    _showOverview(appendToTerminal, config);
    return;
  }

  const sub = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (sub) {
    case "opacity":  return _opacity(subArgs, appendToTerminal, terminalController, config);
    case "fontsize": return _fontsize(subArgs, appendToTerminal, terminalController, config);
    case "size":     return _size(subArgs, appendToTerminal, terminalController, config);
    default:
      appendToTerminal(
        `<div class='output-error'>Unknown subcommand '${escapeHtml(sub)}'. Type 'term' for usage.</div>`,
      );
  }
}

function _showOverview(appendToTerminal, config) {
  let currentOpacity = "N/A";
  if (typeof getComputedStyle !== "undefined" && document.documentElement) {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue("--terminal-opacity").trim();
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) currentOpacity = (parsed * 100).toFixed(0) + "%";
  }

  const currentFontSize =
    document.documentElement.style.getPropertyValue("--terminal-font-size") ||
    config.terminal.fontSizes.default;

  const container = document.getElementById("contentContainer");
  const currentW = container?.style.width || config.terminal.defaultSize.width;
  const currentH = container?.style.height || config.terminal.defaultSize.height;

  let output =
    `<div class="output-section-title section-title-plain"><i class="fas fa-terminal icon-inline"></i> TERMINAL CONFIG</div>` +
    `<div class="output-section">` +
    `<div><span class="output-line-label">Opacity:</span> ${currentOpacity}</div>` +
    `<div><span class="output-line-label">Font size:</span> ${currentFontSize}</div>` +
    `<div><span class="output-line-label">Size:</span> ${currentW} × ${currentH}</div>` +
    `</div>` +
    `<div class="mt-section output-text-small">` +
    `term opacity &lt;0-100|reset&gt; &middot; term fontsize &lt;size&gt; &middot; term size &lt;W&gt; &lt;H&gt;|reset` +
    `</div>`;
  appendToTerminal(output);
}

/* ── opacity ─────────────────────────────────────────────────────────── */

function _opacity(args, appendToTerminal, terminalController, config) {
  const messages = config.terminal.messages;

  if (args.length === 0) {
    let currentOpacity = "N/A";
    if (typeof getComputedStyle !== "undefined" && document.documentElement) {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue("--terminal-opacity").trim();
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) currentOpacity = (parsed * 100).toFixed(0) + "%";
    }
    appendToTerminal(`<div class='output-error'>Usage: term opacity &lt;0-100|reset&gt;</div>`);
    appendToTerminal(`<div>${messages.opacity_current(currentOpacity)}</div>`);
    return;
  }

  if (terminalController.setTerminalOpacity) {
    terminalController.setTerminalOpacity(args[0].toLowerCase());
  } else {
    appendToTerminal(`<div class='output-error'>${messages.opacity_unavailable}</div>`);
  }
}

/* ── fontsize ─────────────────────────────────────────────────────────── */

function _fontsize(args, appendToTerminal, terminalController, config) {
  const messages = config.terminal.messages;

  if (args.length === 0) {
    appendToTerminal(`<div class='output-error'>Usage: term fontsize &lt;size&gt;</div>`);
    appendToTerminal(`<div>${messages.text_examples}</div>`);
    const currentSize =
      document.documentElement.style.getPropertyValue("--terminal-font-size") ||
      config.terminal.fontSizes.default;
    appendToTerminal(`<div>${messages.text_current(currentSize)}</div>`);
    return;
  }

  if (terminalController.setTerminalFontSize) {
    terminalController.setTerminalFontSize(args[0].toLowerCase());
  } else {
    appendToTerminal(`<div class='output-error'>${messages.text_unavailable}</div>`);
  }
}

/* ── size ─────────────────────────────────────────────────────────────── */

function _size(args, appendToTerminal, terminalController, config) {
  const messages = config.resize.messages;
  const validUnits = new RegExp(config.resize.validUnitsRegex, "i");

  if (args.length === 0) {
    appendToTerminal(`<div class='output-error'>Usage: term size &lt;W&gt; &lt;H&gt; | reset</div>`);
    return;
  }

  if (args.length === 1 && args[0].toLowerCase() === "reset") {
    const defaultSize = terminalController.getDefaultTerminalSize?.();
    if (defaultSize && terminalController.resizeTerminalElement) {
      terminalController.resizeTerminalElement(defaultSize.width, defaultSize.height);
    } else {
      appendToTerminal(`<div class='output-error'>${messages.reset_unavailable}</div>`);
    }
    return;
  }

  if (args.length === 2) {
    const [width, height] = args;
    if (validUnits.test(width) && validUnits.test(height)) {
      if (terminalController.resizeTerminalElement) {
        terminalController.resizeTerminalElement(width, height);
      } else {
        appendToTerminal(`<div class='output-error'>${messages.resize_unavailable}</div>`);
      }
    } else {
      appendToTerminal(`<div class='output-error'>${messages.invalid_units}</div>`);
    }
    return;
  }

  appendToTerminal(`<div class='output-error'>Usage: term size &lt;W&gt; &lt;H&gt; | reset</div>`);
}
