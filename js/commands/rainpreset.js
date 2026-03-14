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

  const presetData = presets[presetName];

  if (!presetData) {
    return appendToTerminal(
      `<div class='output-error'>${messages.unknown_preset(presetName)}</div>`,
    );
  }

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
