/**
 * @file engine.js (for rain)
 * Contains the core Matrix rain animation logic.
 */

import {
  getActiveRainConfig,
  getRainGlyphs,
  setActiveRainColors,
} from "./config.js";
import { getCurrentThemeColors } from "../controller/terminalController.js";

const matrixRainCanvas = document.getElementById("matrix-canvas");
const matrixRainCtx = matrixRainCanvas
  ? matrixRainCanvas.getContext("2d")
  : null;

let TOTAL_COLS,
  ACTIVE_COL_INDICES = [],
  streams = [],
  ROWS,
  colW;
let rainAnimationRequestID;

const randInt = (n) => Math.floor(Math.random() * n);
const randChar = () => {
  const glyphs = getRainGlyphs();
  if (!glyphs || glyphs.length === 0) return "X";
  return glyphs[randInt(glyphs.length)];
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class Stream {
  constructor(colIndex) {
    this.col = colIndex;
    this.reset();
  }

  reset() {
    const CFG = getActiveRainConfig();
    this.layer = CFG.layers > 0 ? randInt(CFG.layers) : 0;
    this.opacity =
      CFG.layerOp && CFG.layerOp[this.layer] !== undefined
        ? CFG.layerOp[this.layer]
        : 1;
    this.del = Math.random() < CFG.delChance;
    this.len = CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail);
    this.headGlow =
      CFG.headGlowMin + randInt(CFG.headGlowMax - CFG.headGlowMin + 1);
    this.head = -randInt(Math.floor(this.len * 0.5));
    this.buf = Array.from({ length: ROWS > 0 ? ROWS : 20 }, randChar);
    this.tick = 0;
    // this.currentSpeed = CFG.speed // Not currently used, but kept for potential future use
  }

  step() {
    // const CFG = getActiveRainConfig(); // CFG not used directly in step in this version
    this.head++;
    if (this.head >= 0 && this.head < ROWS) this.buf[this.head] = randChar();

    const activeCfg = getActiveRainConfig(); // Get potentially updated config for trailMutate
    if (++this.tick >= activeCfg.trailMutate) {
      this.tick = 0;
      for (let r = 0; r < ROWS; r++)
        if (Math.random() < 0.15 && this.buf[r]) this.buf[r] = randChar();
    }

    if (this.head > ROWS + this.len * 0.3) {
      if (Math.random() < 0.02 || this.head > ROWS + this.len) {
        this.reset();
      }
    }
  }

  draw() {
    if (!matrixRainCtx) return;
    const CFG = getActiveRainConfig(); // Get latest config for drawing (colors etc.)
    const x = this.col * colW;

    for (let r = 0; r < ROWS; r++) {
      const t = this.head - r;
      if (t < 0 || t >= this.len) continue;
      if (this.del && Math.random() < 0.5) continue;

      let alpha = Math.pow(CFG.decayBase, t) * this.opacity;
      let colour = CFG.baseCol,
        blur = 0;

      if (t < this.headGlow && t >= 0) {
        colour = CFG.headCol;
        alpha *= 1 - (t / this.headGlow) * 0.5 + 0.2;
        alpha = Math.min(1, alpha);
        blur = CFG.blur * (1 - t / this.headGlow);
      }

      matrixRainCtx.globalAlpha = Math.max(0, alpha);
      matrixRainCtx.fillStyle = colour;
      matrixRainCtx.shadowBlur = Math.max(0, blur);

      if (x >= 0 && r * CFG.font * CFG.lineH >= 0 && this.buf[r]) {
        matrixRainCtx.fillText(this.buf[r], x, r * CFG.font * CFG.lineH);
      }
    }
  }
}

export function setupRain() {
  if (!matrixRainCanvas || !matrixRainCtx) {
    console.error("Rain Engine: Canvas not available for setup.");
    return;
  }
  const CFG = getActiveRainConfig();
  matrixRainCanvas.width = window.innerWidth;
  matrixRainCanvas.height = window.innerHeight;
  matrixRainCtx.font = `${CFG.font}px ${CFG.fontFamily}`;
  matrixRainCtx.textBaseline = "top";

  colW = CFG.font;
  TOTAL_COLS = Math.max(1, Math.floor(innerWidth / colW));
  ROWS = Math.max(1, Math.floor(innerHeight / (CFG.font * CFG.lineH)));

  const targetActiveCols = Math.max(1, Math.floor(TOTAL_COLS * CFG.density));
  ACTIVE_COL_INDICES = shuffle([...Array(TOTAL_COLS).keys()]).slice(
    0,
    targetActiveCols,
  );

  streams = ACTIVE_COL_INDICES.map((index) => new Stream(index));

  // The streams are created with a synchronized starting position from their
  // reset() method. To fix the initial "batch" drop, we loop through them
  // once and give each a widely randomized starting head position.
  // This ensures they enter the screen at different times from frame 1.
  for (const s of streams) {
    s.head = -randInt(ROWS * 2); // Using ROWS * 2 provides a large, random, off-screen starting range.
  }

  matrixRainCtx.shadowColor = CFG.headCol; // Initial shadow color
}

function rainTick() {
  if (!matrixRainCtx || !matrixRainCanvas) return;
  const CFG = getActiveRainConfig();
  const themeColors = getCurrentThemeColors();

  matrixRainCtx.shadowBlur = 0;
  matrixRainCtx.globalAlpha = CFG.fade;
  matrixRainCtx.fillStyle = themeColors.background;
  matrixRainCtx.fillRect(0, 0, matrixRainCanvas.width, matrixRainCanvas.height);

  matrixRainCtx.globalAlpha = 1;
  matrixRainCtx.shadowColor = CFG.headCol; // Use headCol from (potentially theme-updated) CFG

  for (const s of streams) {
    s.step();
    s.draw();
  }
  rainAnimationRequestID = setTimeout(rainTick, CFG.speed);
}

// This is the primary function to start or fully restart the rain with a new setup
export function startRainAnimation() {
  if (rainAnimationRequestID) {
    clearTimeout(rainAnimationRequestID);
  }
  updateRainColorsFromTheme(); // Sync colors with current theme first
  setupRain(); // Perform full setup (canvas size, stream creation)
  rainTick(); // Start the animation loop
  console.log("Matrix rain animation started (full setup).");
}

export function stopRainAnimation() {
  if (rainAnimationRequestID) {
    clearTimeout(rainAnimationRequestID);
    rainAnimationRequestID = null;
  }
  console.log("Matrix rain animation stopped.");
}

// This function is for full restart (e.g., after a preset changes structural properties)
export function restartRainAnimation() {
  stopRainAnimation();
  startRainAnimation(); // This does a full setup
}

// This function is called to sync rain colors with the current theme
export function updateRainColorsFromTheme() {
  const themeColors = getCurrentThemeColors();
  // console.log("updateRainColorsFromTheme - Fetched theme colors:", themeColors);
  setActiveRainColors(themeColors.primary, themeColors.glow); // Update active config in rain/config.js

  if (matrixRainCtx) {
    const currentCfg = getActiveRainConfig(); // Get the updated config
    matrixRainCtx.shadowColor = currentCfg.headCol; // Update canvas context's shadow color
  }
  // console.log("Rain colors synced with theme.");
}

// This function refreshes rain visuals (primarily for theme color changes) without resetting streams
export function refreshRainVisuals() {
  if (!matrixRainCtx || !matrixRainCanvas) return;
  updateRainColorsFromTheme(); // Ensure active config colors are updated from the current theme

  // Clear any existing animation frame/timeout to avoid multiple loops
  if (rainAnimationRequestID) {
    clearTimeout(rainAnimationRequestID);
  }
  // Restart the animation tick. It will pick up new colors from getActiveRainConfig()
  // in Stream.draw() without re-running setupRain() (which resets stream positions).
  rainTick();
  // console.log("Matrix rain visuals refreshed.");
}
