/**
 * @file js/commands/theme.js
 * Handles the 'theme' command to change the terminal's visual theme.
 */

export default function themeCommand(args, context) {
  const { appendToTerminal, terminalController, rainEngine } = context;
  const themeNameInput = args[0] ? args[0].toLowerCase() : null;

  // applyTheme function in terminalController now handles the logic and appendToTerminal calls
  // It returns true if theme applied, false otherwise (e.g. invalid theme, or no theme provided)
  const themeApplied = terminalController.applyTheme(themeNameInput);

  if (themeApplied) {
    // If theme was successfully applied, restart rain animation to pick up new theme colors
    if (rainEngine && typeof rainEngine.restartRainAnimation === "function") {
      rainEngine.refreshRainVisuals();
    } else {
      // This case should ideally not happen if context is set up correctly
      appendToTerminal(
        "<div class='output-warning'>Rain engine not available to apply theme colors.</div>",
        "output-warning-wrapper",
      );
    }
  }
}
