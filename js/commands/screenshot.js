/**
 * @file js/commands/screenshot.js
 * Handles the 'screenshot' command.
 *
 * Captures a *full‑HD* (1920 × 1080) PNG of the Matrix‑rain canvas only,
 * leaves the animation loop running, and force‑downloads the file.
 */

export default function screenshotCommand(args, context) {
  const { appendToTerminal } = context;
  const srcCanvas = document.getElementById("matrix-canvas");

  if (!srcCanvas) {
    appendToTerminal(
      "<div class='output-error'>Rain canvas not found.</div>",
      "output-error-wrapper",
    );
    return;
  }

  // Prepare an off‑screen canvas at the target resolution to avoid any
  // write‑lock on the on‑screen canvas (which would jank the animation).
  const TARGET_W = 1920;
  const TARGET_H = 1080;
  const offCanvas = document.createElement("canvas");
  offCanvas.width = TARGET_W;
  offCanvas.height = TARGET_H;
  const offCtx = offCanvas.getContext("2d");

  // Draw the live rain canvas onto the off‑screen surface, scaling if necessary.
  // The src canvas keeps rendering in parallel. */
  offCtx.drawImage(srcCanvas, 0, 0, TARGET_W, TARGET_H);

  offCanvas.toBlob((blob) => {
    if (!blob) {
      appendToTerminal(
        "<div class='output-error'>Screenshot failed.</div>",
        "output-error-wrapper",
      );
      return;
    }
    // Build a safe filename: rain_screenshot_2025‑07‑19T18‑29‑55.png
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `rain_screenshot_${ts}.png`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // House‑keeping: revoke URL & remove anchor after the download fires.
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 4000);

    appendToTerminal(
      `<div class='output-success'>Screenshot saved as ${fileName}</div>`,
      "output-success-wrapper",
    );
  }, "image/png");
}
