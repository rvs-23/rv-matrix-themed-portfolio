/**
 * @file js/commands/termtext.js
 * Handles the 'termtext' command to set the terminal font size.
 */

export default function termTextCommand(args, context) {
  const { appendToTerminal, terminalController } = context;

  if (!args || args.length === 0) {
    appendToTerminal(
      "<div class='output-error'>Usage: termtext &lt;size&gt;</div>",
      "output-error-wrapper",
    );
    appendToTerminal(
      "<div>Examples: termtext 13px, termtext small, termtext default, termtext large</div>",
      "output-text-wrapper",
    );
    const currentSize =
      typeof getComputedStyle !== "undefined" && document.documentElement
        ? getComputedStyle(document.documentElement).getPropertyValue(
            "--terminal-font-size",
          )
        : "default (12.5px)";
    appendToTerminal(
      `<div>Current terminal font size: ${currentSize || "default (12.5px)"}</div>`,
      "output-text-wrapper",
    );
    return;
  }

  const inputSize = args[0].toLowerCase();
  // The setTerminalFontSize function in terminalController now handles the logic and appendToTerminal calls
  if (terminalController.setTerminalFontSize) {
    terminalController.setTerminalFontSize(inputSize);
  } else {
    appendToTerminal(
      "<div class='output-error'>Terminal font size control not available.</div>",
      "output-error-wrapper",
    );
  }
}
