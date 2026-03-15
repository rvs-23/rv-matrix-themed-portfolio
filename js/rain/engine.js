/**
 * @file js/rain/engine.js
 * Matrix digital rain engine — film-accurate rendering with sentient phrases.
 * Based on Carl Newton's digital rain analysis.
 */

import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);
const randRange = (min, max) => min + randInt(max - min + 1);

// Depth plane definitions: near (0), mid (1), far (2)
const DEPTH_PLANES = [
  { fontScale: 1.0, speedMult: 1.0 },
  { fontScale: 0.85, speedMult: 0.85 },
  { fontScale: 0.7, speedMult: 0.7 },
];
const DEPTH_WEIGHTS = [0.3, 0.4, 0.3]; // Distribution across planes

const HIGHLIGHT_CHANCE = 0.2;
const GLYPH_SYNC_INTERVAL = 3;
const STAMMER_INTERVAL = 90;

function pickDepthPlane() {
  const r = Math.random();
  if (r < DEPTH_WEIGHTS[0]) return 0;
  if (r < DEPTH_WEIGHTS[0] + DEPTH_WEIGHTS[1]) return 1;
  return 2;
}

class Stream {
  constructor(colIndex, rows, config, glyphs, sentientPhrases = []) {
    this.col = colIndex;
    this.rows = rows;
    this.glyphs = glyphs;
    this.sentientPhrases = sentientPhrases;
    this.sentientChance = 0.069;
    this.depthPlane = pickDepthPlane();
    this.buf = Array.from({ length: this.rows }, () => this.randChar());
    this.reset(config, true);
  }

  randChar() {
    return this.glyphs.charAt(randInt(this.glyphs.length));
  }

  reset(CFG, isInitial = false) {
    this.isDeletion = Math.random() < (CFG.delChance || 0.15);
    this.hasHighlight = !this.isDeletion && Math.random() < HIGHLIGHT_CHANCE;

    const planeOp = DEPTH_PLANES[this.depthPlane] || DEPTH_PLANES[0];
    const layerOp = CFG.layerOp?.[this.depthPlane] ?? [1, 0.7, 0.5][this.depthPlane];
    this.opacity = layerOp;

    this.len = Math.round(
      CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail),
    );
    this.headGlow = randRange(CFG.headGlowMin, CFG.headGlowMax);
    this.head = -randInt(Math.floor(this.len * 0.5));

    // Persistent grid: don't re-randomize entire buffer on reset
    if (!isInitial) {
      for (let r = 0; r < this.rows; r++) {
        if (Math.random() < 0.3) this.buf[r] = this.randChar();
      }
    }

    // Per-stream speed variation (+-25%), scaled by depth plane
    const speedVar = 0.25;
    this.speed =
      CFG.speed *
      planeOp.speedMult *
      (1 + (Math.random() * speedVar * 2 - speedVar));
    this.lastUpdate = 0;

    if (
      !this.isDeletion &&
      Math.random() < this.sentientChance &&
      this.sentientPhrases.length
    ) {
      this.isSentient = true;
      this.sentientText =
        this.sentientPhrases[randInt(this.sentientPhrases.length)];
      this.sentientIndex = 0;
      this.len = Math.max(this.len, this.sentientText.length + 5);
    } else {
      this.isSentient = false;
      this.sentientText = null;
      this.sentientIndex = 0;
    }
  }

  step(CFG, timestamp, isStammerFrame) {
    if (timestamp - this.lastUpdate < this.speed) return false;
    this.lastUpdate = timestamp;

    // Stammer: highlighted streams skip one advancement
    if (isStammerFrame && this.hasHighlight) {
      return true;
    }

    this.head++;

    if (this.head >= 0 && this.head < this.rows) {
      if (this.isDeletion) {
        this.buf[this.head] = null;
      } else if (
        this.isSentient &&
        this.sentientIndex < this.sentientText.length
      ) {
        this.buf[this.head] = this.sentientText[this.sentientIndex++];
      } else {
        this.buf[this.head] = this.randChar();
      }
    }

    if (this.head > this.rows + this.len * 0.3) {
      if (Math.random() < 0.02 || this.head > this.rows + this.len) {
        this.reset(CFG);
      }
    }
    return true;
  }

  mutateGlyphs() {
    if (this.isSentient || this.isDeletion) return;
    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      if (t >= 0 && t < this.len && this.buf[r] && Math.random() < 0.15) {
        this.buf[r] = this.randChar();
      }
    }
  }

  draw(ctx, CFG, colWidth) {
    if (!ctx || this.isDeletion) return;
    const x = this.col * colWidth;

    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      if (t < 0 || t >= this.len) continue;
      if (!this.buf[r]) continue;

      let alpha;
      let colour;
      let blur = 0;

      if (this.isSentient) {
        colour = CFG.headCol;
        alpha = Math.pow(0.97, t) * this.opacity;
        blur = CFG.blur * alpha * 1.5;
        if (t === 0) {
          colour = "#ffffff";
          alpha = 1;
          blur = CFG.blur * 2;
        }
      } else {
        alpha = Math.pow(CFG.decayBase, t) * this.opacity;
        colour = CFG.baseCol;

        if (t === 0 && this.hasHighlight) {
          colour = "#ffffff";
          alpha = 1;
          blur = CFG.blur;
        } else if (t === 0) {
          alpha = Math.min(1, alpha * 1.5);
        } else if (this.hasHighlight && t < this.headGlow && t > 0) {
          colour = CFG.headCol;
          alpha *= 1 - (t / this.headGlow) * 0.5 + 0.2;
          blur = CFG.blur * (1 - t / this.headGlow);
        }
      }

      alpha = Math.min(1, alpha);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = colour;

      if (blur > 0) {
        ctx.shadowColor = colour;
        ctx.shadowBlur = Math.max(0, blur);
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillText(this.buf[r], x, r * CFG.font * CFG.lineH);
    }
  }
}

export default class RainEngine {
  constructor(rainConfig, fontConfig, sentientPhrases = []) {
    this.canvas = document.getElementById("matrix-canvas");
    this.ctx = this.canvas?.getContext("2d");
    this.defaultConfig = rainConfig.defaultConfig;
    this.glyphs = rainConfig.glyphs || "01";
    this.presets = rainConfig.presets || {};
    this.validationRules = rainConfig.validationRules || {};
    this.defaultConfig.fontFamily = fontConfig.matrix;
    this.activeConfig = { ...this.defaultConfig };
    this.activePresetName = "default";
    this.streams = [];
    this.animationId = null;
    this.lastFrameTime = 0;
    this.sentientPhrases = sentientPhrases;
    this.dpr = window.devicePixelRatio || 1;
    this.colWidth = 0;
    this.globalTick = 0;
    this.stammerCounter = 0;

    this._resizeTimeout = null;
    this._handleResize = this._handleResize.bind(this);
    window.addEventListener("resize", this._handleResize, { passive: true });
  }

  destroy() {
    window.removeEventListener("resize", this._handleResize);
    this.stop();
  }

  _handleResize() {
    clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => this.start(), 200);
  }

  async setup() {
    if (!this.canvas || !this.ctx) return;

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready.catch(() => {});
    }

    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.ctx.font = `${this.activeConfig.font}px ${this.activeConfig.fontFamily}`;
    this.ctx.textBaseline = "top";

    const metrics = this.ctx.measureText("M");
    this.colWidth = metrics.width || this.activeConfig.font;

    const totalCols = Math.max(
      1,
      Math.floor(window.innerWidth / this.colWidth),
    );
    const rows = Math.max(
      1,
      Math.floor(
        window.innerHeight /
          (this.activeConfig.font * this.activeConfig.lineH),
      ),
    );

    const allColIndices = [...Array(totalCols).keys()];
    const activeColIndices = allColIndices.filter(
      () => Math.random() < this.activeConfig.density,
    );

    this.streams = activeColIndices.map(
      (index) =>
        new Stream(
          index,
          rows,
          this.activeConfig,
          this.glyphs,
          this.sentientPhrases,
        ),
    );

    // Scatter initial head positions
    for (const s of this.streams) {
      s.head = -randInt(rows * 2);
    }
  }

  loop = (timestamp) => {
    const themeColors = getCurrentThemeColors();
    this.globalTick++;

    // Background fade at ~30fps
    if (timestamp - this.lastFrameTime >= 33) {
      this.lastFrameTime = timestamp;
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = this.activeConfig.fade;
      this.ctx.fillStyle = themeColors.background;
      this.ctx.fillRect(
        0,
        0,
        this.canvas.width / this.dpr,
        this.canvas.height / this.dpr,
      );
    }

    // Globally synchronized glyph mutations
    if (this.globalTick % GLYPH_SYNC_INTERVAL === 0) {
      for (const s of this.streams) {
        s.mutateGlyphs();
      }
    }

    // Stammer check
    this.stammerCounter++;
    const isStammerFrame = this.stammerCounter >= STAMMER_INTERVAL;
    if (isStammerFrame) {
      this.stammerCounter = 0;
    }

    // Step all streams
    for (const s of this.streams) {
      s.step(this.activeConfig, timestamp, isStammerFrame);
    }

    // Draw back-to-front: far (2) -> mid (1) -> near (0)
    this.ctx.globalAlpha = 1;
    for (let plane = DEPTH_PLANES.length - 1; plane >= 0; plane--) {
      const fontSize =
        this.activeConfig.font * DEPTH_PLANES[plane].fontScale;
      this.ctx.font = `${fontSize}px ${this.activeConfig.fontFamily}`;

      for (const s of this.streams) {
        if (s.depthPlane !== plane) continue;
        s.draw(this.ctx, this.activeConfig, this.colWidth);
      }
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  async start() {
    this.stop();
    this.refreshColors();
    this.globalTick = 0;
    this.stammerCounter = 0;
    await this.setup();
    const now = performance.now();
    this.lastFrameTime = now - this.activeConfig.speed;
    this.loop(now);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resetToDefaults() {
    this.activeConfig = { ...this.defaultConfig };
    this.activePresetName = "default";
    this.start();
    return { success: true, message: "Rain reset to defaults." };
  }

  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset)
      return { success: false, message: `Unknown preset: '${presetName}'.` };

    if (preset.isReset) {
      return this.resetToDefaults();
    }

    if (preset.config) {
      const needsRebuild =
        preset.config.font !== undefined ||
        preset.config.density !== undefined ||
        preset.config.lineH !== undefined;

      Object.entries(preset.config).forEach(([param, value]) => {
        this.updateParameter(param, value);
      });
      this.activePresetName = presetName;

      if (needsRebuild) {
        this.start();
      } else {
        this.refreshColors();
      }

      return {
        success: true,
        message: `Preset '${presetName}' applied successfully.`,
      };
    }
    return {
      success: false,
      message: `Preset '${presetName}' is misconfigured.`,
    };
  }

  updateParameter(param, value) {
    const rule = this.validationRules[param];
    if (!rule) return false;

    let parsedValue = value;
    if (rule.type === "int") parsedValue = parseInt(value, 10);
    if (rule.type === "float") parsedValue = parseFloat(value);
    if (rule.type === "bool") parsedValue = value === true || value === "true";

    if (
      Number.isNaN(parsedValue) ||
      (rule.min !== undefined && parsedValue < rule.min) ||
      (rule.max !== undefined && parsedValue > rule.max)
    ) {
      console.warn(`Invalid value for ${param}: ${value}`);
      return false;
    }
    this.activeConfig[param] = parsedValue;
    return true;
  }

  refreshColors() {
    const themeColors = getCurrentThemeColors();
    this.activeConfig.baseCol = themeColors.primary;
    this.activeConfig.headCol = themeColors.glow;
  }
}
