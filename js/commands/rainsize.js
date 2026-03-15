/**
 * @file js/commands/rainsize.js
 * Handles the 'rainsize' command — adjust rain glyph size.
 */
export default function rainSizeCommand(args, context) {
  const { appendToTerminal, rainEngine } = context;

  if (!args || args.length === 0) {
    const current = rainEngine.activeConfig.font;
    appendToTerminal(
      `<div class='output-error'>Usage: rainsize &lt;px&gt; | reset</div>` +
        `<div>Current: ${current}px (valid range: 8–40)</div>`,
    );
    return;
  }

  const input = args[0].toLowerCase();

  if (input === "reset") {
    const defaultSize = rainEngine.defaultConfig.font;
    rainEngine.updateParameter("font", defaultSize);
    rainEngine.start();
    appendToTerminal(
      `<div class='output-success'>Rain size reset to ${defaultSize}px.</div>`,
    );
    return;
  }

  const size = parseInt(input, 10);
  if (Number.isNaN(size) || size < 8 || size > 40) {
    appendToTerminal(
      `<div class='output-error'>Invalid size. Must be 8–40 (px).</div>`,
    );
    return;
  }

  rainEngine.updateParameter("font", size);
  rainEngine.start();
  appendToTerminal(
    `<div class='output-success'>Rain glyph size set to ${size}px.</div>`,
  );
}
