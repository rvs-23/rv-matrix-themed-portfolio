/**
 * @file js/commands/rainpreset.js
 * Handles the 'rainpreset' command.
 */
export default function rainPresetCommand(args, context) {
  const { appendToTerminal, rainEngine, config } = context;
  const messages = config.rainpreset.messages;
  const presets = rainEngine.presets || {};

  if (!args || args.length === 0) {
    appendToTerminal(`<div class='output-error'>${messages.usage}</div>`);
    const presetKeys = Object.keys(presets);
    if (presetKeys.length > 0) {
      appendToTerminal(
        `<div>${messages.available_presets(presetKeys.join(", "))}</div>`,
      );
    } else {
      appendToTerminal(`<div>${messages.no_presets}</div>`);
    }
    return;
  }

  const presetName = args[0].toLowerCase();

  // ++ 1. Look up the preset data first
  const presetData = presets[presetName];

  // ++ 2. Check if the preset exists before doing anything else
  if (!presetData) {
    return appendToTerminal(
      `<div class='output-error'>${messages.unknown_preset(presetName)}</div>`,
    );
  }

  // ++ 3. If it's not a reset, print the "Applying..." message with the description
  if (!presetData.isReset) {
    appendToTerminal(
      `<div>${messages.applying(presetName, presetData.description || "")}</div>`,
    );
  }

  // 4. Now, apply the preset and print the final result
  const result = rainEngine.applyPreset(presetName);

  if (result.success) {
    appendToTerminal(`<div class='output-success'>${result.message}</div>`);
  } else {
    appendToTerminal(`<div class='output-error'>${result.message}</div>`);
  }
}
