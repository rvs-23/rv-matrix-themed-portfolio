/**
 * @file js/commands/rainfont.js
 * Handles the 'rainfont' command — switch between Matrix font sets.
 */
export default function rainFontCommand(args, context) {
  const { appendToTerminal, rainEngine, config } = context;
  const messages = config.rainfont.messages;
  const fontSets = rainEngine.fontSets || {};
  const fontSetNames = Object.keys(fontSets);

  if (!args || args.length === 0) {
    let output = `<div class='output-error'>${messages.usage}</div>`;
    output += `<div>Current: <span class='output-success'>${rainEngine.activeFontSet}</span></div>`;
    for (const name of fontSetNames) {
      const marker = name === rainEngine.activeFontSet ? " ◄" : "";
      output += `<div>  ${name} — ${fontSets[name].description}${marker}</div>`;
    }
    appendToTerminal(output);
    return;
  }

  const name = args[0].toLowerCase();

  if (!fontSets[name]) {
    appendToTerminal(
      `<div class='output-error'>${messages.unknown(name)}</div>` +
        `<div>Available: ${fontSetNames.join(", ")}</div>`,
    );
    return;
  }

  const result = rainEngine.setFontSet(name);
  const cls = result.success ? "output-success" : "output-error";
  appendToTerminal(`<div class='${cls}'>${result.message}</div>`);
}
