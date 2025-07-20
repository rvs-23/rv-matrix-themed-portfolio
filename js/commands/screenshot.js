/**
 * @file js/commands/screenshot.js
 * Handles the 'screenshot' command with resolution control and dynamic filenames.
 */

export default function screenshotCommand(args, context) {
  const {
    appendToTerminal,
    config,
    userConfig,
    rainEngine,
    isCrtActive,
    getCurrentTheme,
  } = context;
  const screenshotConfig = config.screenshot;
  const messages = screenshotConfig.messages;
  const srcCanvas = document.getElementById("matrix-canvas");

  if (!srcCanvas) {
    return appendToTerminal(
      "<div class='output-error'>Rain canvas not found.</div>",
    );
  }

  // 1. Determine Resolution
  const resolutionArg = args[0]?.toLowerCase() || "fhd";
  const resolution = screenshotConfig.resolutions[resolutionArg];

  if (!resolution) {
    return appendToTerminal(
      `<div class='output-error'>${messages.invalid_resolution(args[0])}</div>`,
    );
  }

  const { w: TARGET_W, h: TARGET_H } = resolution;

  // 2. Build Dynamic Filename
  const theme = getCurrentTheme();
  const preset = rainEngine.activePresetName || "default";
  const crt = isCrtActive() ? "crt" : "nocrt";
  const firstName = userConfig.name?.split(" ")[0];
  const userInitials =
    firstName && firstName.length >= 2
      ? `${firstName[0]}${firstName.slice(-1)}`.toLowerCase()
      : (firstName?.[0] || "u").toLowerCase();
  const time = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, ""); // YYYYMMDDHHMMSS format

  const fileName = `matrix_rain_wallpaper_${userInitials}_${preset}_${theme}_${crt}_${time}.png`;

  // 3. Create and Download Image
  const offCanvas = document.createElement("canvas");
  offCanvas.width = TARGET_W;
  offCanvas.height = TARGET_H;
  const offCtx = offCanvas.getContext("2d");
  offCtx.drawImage(srcCanvas, 0, 0, TARGET_W, TARGET_H);

  offCanvas.toBlob((blob) => {
    if (!blob) {
      return appendToTerminal(
        "<div class='output-error'>Screenshot failed.</div>",
      );
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 4000);

    appendToTerminal(
      `<div class='output-success'>${messages.success(fileName, resolutionArg.toUpperCase())}</div>`,
    );
  }, "image/png");
}
