/**
 * @file js/rain/engine.js
 * Matrix digital rain engine with sentient phrases.
 * Fixed & improved (July 2025).
 */

import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);
const randRange = (min, max) => min + randInt(max - min + 1);

class Stream {
  constructor(colIndex, rows, config, glyphs, sentientPhrases = []) {
    this.col = colIndex;
    this.rows = rows;
    this.glyphs = glyphs;
    this.sentientPhrases = sentientPhrases;
    this.sentientChance = 0.069;
    this.reset(config);
  }

  randChar() {
    return this.glyphs.charAt(randInt(this.glyphs.length));
  }

  reset(CFG) {
    this.layer = CFG.layers > 0 ? randInt(CFG.layers) : 0;
    this.opacity = CFG.layerOp?.[this.layer] ?? 1;
    this.del = Math.random() < CFG.delChance;
    this.len = Math.round(
      CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail),
    );
    this.headGlow = randRange(CFG.headGlowMin, CFG.headGlowMax);
    this.head = -randInt(Math.floor(this.len * 0.5));
    this.buf = Array.from({ length: this.rows }, () => this.randChar());
    this.tick = 0;

    // Per-stream speed variation (±25% of base speed)
    const speedVar = 0.25;
    this.speed = CFG.speed * (1 + (Math.random() * speedVar * 2 - speedVar));
    this.lastUpdate = 0;

    if (Math.random() < this.sentientChance && this.sentientPhrases.length) {
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

  step(CFG, timestamp) {
    if (timestamp - this.lastUpdate < this.speed) return false;
    this.lastUpdate = timestamp;

    this.head++;
    if (this.head >= 0 && this.head < this.rows) {
      if (this.isSentient && this.sentientIndex < this.sentientText.length) {
        this.buf[this.head] = this.sentientText[this.sentientIndex++];
      } else {
        this.buf[this.head] = this.randChar();
      }
    }

    if (++this.tick >= CFG.trailMutate) {
      this.tick = 0;
      if (!this.isSentient) {
        for (let r = 0; r < this.rows; r++) {
          if (Math.random() < 0.2 && this.buf[r]) this.buf[r] = this.randChar();
        }
      }
    }

    if (this.head > this.rows + this.len * 0.3) {
      if (Math.random() < 0.02 || this.head > this.rows + this.len) {
        this.reset(CFG);
      }
    }
    return true;
  }

  draw(ctx, CFG) {
    if (!ctx) return;
    const x = this.col * CFG.font;

    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      if (t < 0 || t >= this.len) continue;
      if (this.del && Math.random() < 0.5) continue;

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

        // Improved Head Rendering: Pure white for the leading character
        if (t === 0) {
          colour = "#ffffff";
          alpha = 1;
          blur = CFG.blur;
        } else if (t < this.headGlow && t > 0) {
          colour = CFG.headCol;
          alpha *= 1 - (t / this.headGlow) * 0.5 + 0.2;
          blur = CFG.blur * (1 - t / this.headGlow);
        }
      }

      alpha = Math.min(1, alpha);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = colour;

      // Only apply shadow if blur > 0 to save performance
      if (blur > 0) {
        ctx.shadowColor = colour;
        ctx.shadowBlur = Math.max(0, blur);
      } else {
        ctx.shadowBlur = 0;
      }

      if (this.buf[r]) {
        ctx.fillText(this.buf[r], x, r * CFG.font * CFG.lineH);
      }
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
    const colW = metrics.width || this.activeConfig.font;

    const totalCols = Math.max(1, Math.floor(window.innerWidth / colW));
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

    for (const s of this.streams) {
      s.head = -randInt(rows * 2);
    }
  }

  loop = (timestamp) => {
    const themeColors = getCurrentThemeColors();

    // The global speed now acts as the "max frame rate" for background fading
    if (timestamp - this.lastFrameTime >= 33) {
      // Aim for ~30fps for the fade effect
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

    this.ctx.globalAlpha = 1;
    for (const s of this.streams) {
      const didStep = s.step(this.activeConfig, timestamp);
      if (didStep) {
        s.draw(this.ctx, this.activeConfig);
      }
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  async start() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      this.stop();
      return;
    }

    this.stop();
    this.refreshColors();
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
    return true;
  }

  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset)
      return { success: false, message: `Unknown preset: '${presetName}'.` };

    if (preset.isReset) {
      return this.resetToDefaults();
    }

    if (preset.config) {
      Object.entries(preset.config).forEach(([param, value]) => {
        this.updateParameter(param, value);
      });
      this.activePresetName = presetName;
      this.start();
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