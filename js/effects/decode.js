/**
 * @file js/effects/decode.js
 * Decode text reveal — characters start as random glyphs and resolve
 * left-to-right in a wave, like a movie decryption sequence.
 */

const GLYPHS = "アァカサタナハマヤャラワガザダバパ0123456789ABCDEF";

/**
 * Animate text decoding into a DOM element.
 * @param {HTMLElement} element — target element (textContent will be overwritten)
 * @param {string} text — final decoded string
 * @param {object} [opts]
 * @param {number} [opts.duration=1000] — total animation time in ms
 * @param {number} [opts.stagger=0.65] — 0-1, how much left-to-right wave spread
 * @returns {Promise<void>} resolves when animation completes
 */
export function decodeReveal(element, text, opts = {}) {
  const { duration = 1000, stagger = 0.65 } = opts;
  const chars = [...text];
  const len = chars.length;
  const totalFrames = 22;
  const frameMs = duration / totalFrames;
  let frame = 0;

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      let output = "";
      const progress = frame / totalFrames;

      for (let i = 0; i < len; i++) {
        if (chars[i] === " ") {
          output += " ";
          continue;
        }

        const charDelay = (i / len) * stagger;
        const charProgress =
          charDelay >= 1 ? progress : Math.max(0, (progress - charDelay) / (1 - charDelay));

        if (charProgress >= 1) {
          output += chars[i];
        } else if (charProgress > 0.5 && Math.random() < charProgress) {
          output += chars[i];
        } else {
          output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }

      element.textContent = output;
      frame++;

      if (frame >= totalFrames) {
        clearInterval(interval);
        element.textContent = text;
        resolve();
      }
    }, frameMs);
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
