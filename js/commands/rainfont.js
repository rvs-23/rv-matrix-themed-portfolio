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
    appendToTerminal(`<div class='output-error'>${messages.usage}</div>`);
    appendToTerminal(
      `<div>Current: <span class='output-success'>${rainEngine.activeFontSet}</span></div>`,
    );
    for (const name of fontSetNames) {
      const marker = name === rainEngine.activeFontSet ? " ◄" : "";
      appendToTerminal(
        `<div>  ${name} — ${fontSets[name].description}${marker}</div>`,
      );
    }
    return;
  }

  const name = args[0].toLowerCase();

  if (!fontSets[name]) {
    appendToTerminal(
      `<div class='output-error'>${messages.unknown(name)}</div>`,
    );
    appendToTerminal(
      `<div>Available: ${fontSetNames.join(", ")}</div>`,
    );
    return;
  }

  const result = rainEngine.setFontSet(name);
  if (result.success) {
    appendToTerminal(`<div class='output-success'>${result.message}</div>`);
  } else {
    appendToTerminal(`<div class='output-error'>${result.message}</div>`);
  }
}
