/**
 * @file js/commands/rainpreset.js
 * Handles the 'rainpreset' command.
 */
export default function rainPresetCommand(args, context) {
  const { appendToTerminal, rainEngine, config } = context;
  const messages = config.rainpreset.messages;
  const presets = rainEngine.presets || {};

  if (!args || args.length === 0) {
    const presetKeys = Object.keys(presets);
    if (presetKeys.length === 0) {
      appendToTerminal(`<div>${messages.no_presets}</div>`);
      return;
    }
    let output = `<div class='output-error'>${messages.usage}</div>`;
    output += `<div>Current: <span class='output-success'>${rainEngine.activePresetName}</span></div>`;
    for (const key of presetKeys) {
      const marker = key === rainEngine.activePresetName ? " ◄" : "";
      output += `<div>  ${key} — ${presets[key].description || ""}${marker}</div>`;
    }
    appendToTerminal(output);
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

  const result = rainEngine.applyPreset(presetName);
  const cls = result.success ? "output-success" : "output-error";
  appendToTerminal(`<div class='${cls}'>${result.message}</div>`);
}
