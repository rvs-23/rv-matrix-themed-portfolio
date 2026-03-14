/**
 * @file js/commands/theme.js
 * Handles the 'theme' command to change the terminal's visual theme.
 */

export default function themeCommand(args, context) {
  const { appendToTerminal, terminalController, rainEngine } = context;
  const themeNameInput = args[0] ? args[0].toLowerCase() : null;

  // This function correctly changes the theme class on the body
  const themeApplied = terminalController.applyTheme(themeNameInput);

  if (themeApplied) {
    if (rainEngine && typeof rainEngine.refreshColors === "function") {
      rainEngine.refreshColors();
    } else {
      appendToTerminal(
        "<div class='output-warning'>Rain engine not available to apply theme colors.</div>",
        "output-warning-wrapper",
      );
    }
  }
}
