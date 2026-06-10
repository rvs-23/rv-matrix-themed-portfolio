/**
 * @file js/commands/reset.js
 * Resets all user preferences to factory defaults and clears session storage.
 */

export default function resetCommand(_args, context) {
  const { appendToTerminal, terminalController, rainEngine } = context;

  // Clear all persisted preferences
  try {
    localStorage.removeItem("rv_theme");
    localStorage.removeItem("rv_preset");
  } catch { /* storage unavailable */ }

  // Reset theme to green
  terminalController.applyTheme("green");
  if (rainEngine) rainEngine.refreshColors();

  // Reset rain preset to default (also restores the default rain font set)
  if (rainEngine && rainEngine.applyPreset) {
    rainEngine.applyPreset("default");
  }

  // Reset terminal appearance (opacity, font size, window size) to defaults
  terminalController.resetTerminalAppearance();

  appendToTerminal(
    "<div class='output-success'>All preferences reset to defaults.</div>",
  );
}
