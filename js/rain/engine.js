import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);

class Stream {
  constructor(colIndex, rows, config, glyphs) {
    this.col = colIndex;
    this.rows = rows;
    this.glyphs = glyphs;
    this.reset(config);
  }

  randChar() {
    return this.glyphs[randInt(this.glyphs.length)];
  }

  // ++ All methods now accept the active config (CFG) as a parameter
  reset(CFG) {
    this.layer = CFG.layers > 0 ? randInt(CFG.layers) : 0;
    this.opacity = CFG.layerOp?.[this.layer] ?? 1;
    this.del = Math.random() < CFG.delChance;
    this.len = CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail);
    this.headGlow =
      CFG.headGlowMin + randInt(CFG.headGlowMax - CFG.headGlowMin + 1);
    this.head = -randInt(Math.floor(this.len * 0.5));
    this.buf = Array.from({ length: this.rows }, () => this.randChar());
    this.tick = 0;
  }

  step(CFG) {
    this.head++;
    if (this.head >= 0 && this.head < this.rows)
      this.buf[this.head] = this.randChar();

    if (++this.tick >= CFG.trailMutate) {
      this.tick = 0;
      for (let r = 0; r < this.rows; r++)
        if (Math.random() < 0.15 && this.buf[r]) this.buf[r] = this.randChar();
    }

    if (this.head > this.rows + this.len * 0.3) {
      if (Math.random() < 0.02 || this.head > this.rows + this.len) {
        this.reset(CFG);
      }
    }
  }

  draw(ctx, CFG) {
    if (!ctx) return;
    const x = this.col * CFG.font;

    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      if (t < 0 || t >= this.len) continue;
      if (this.del && Math.random() < 0.5) continue;

      let alpha = Math.pow(CFG.decayBase, t) * this.opacity;
      let colour = CFG.baseCol;
      let blur = 0;

      if (t < this.headGlow && t >= 0) {
        colour = CFG.headCol;
        alpha *= 1 - (t / this.headGlow) * 0.5 + 0.2;
        alpha = Math.min(1, alpha);
        blur = CFG.blur * (1 - t / this.headGlow);
      }

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = colour;
      ctx.shadowBlur = Math.max(0, blur);

      if (x >= 0 && r * CFG.font * CFG.lineH >= 0 && this.buf[r]) {
        ctx.fillText(this.buf[r], x, r * CFG.font * CFG.lineH);
      }
    }
  }
}

export default class RainEngine {
  constructor(rainConfig, fontConfig) {
    this.canvas = document.getElementById("matrix-canvas");
    this.ctx = this.canvas?.getContext("2d");
    this.defaultConfig = rainConfig.defaultConfig;
    this.glyphs = rainConfig.glyphs || "01";
    this.presets = rainConfig.presets || {};
    this.validationRules = rainConfig.validationRules || {};
    this.defaultConfig.fontFamily = fontConfig.matrix;
    this.activeConfig = { ...this.defaultConfig };
    this.activePresetName = 'default';
    this.streams = [];
    this.animationId = null;
    this.lastFrameTime = 0;
  }

  // Replace the existing setup() method in js/rain/engine.js

  setup() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.font = `${this.activeConfig.font}px ${this.activeConfig.fontFamily}`;
    this.ctx.textBaseline = "top";

    // Instead of assuming the width, we measure a sample character ('M' is good).
    const metrics = this.ctx.measureText("M");
    const colW = metrics.width > 0 ? metrics.width : this.activeConfig.font; // Use measured width, with a fallback

    const totalCols = Math.max(1, Math.floor(this.canvas.width / colW));
    const rows = Math.max(
      1,
      Math.floor(
        this.canvas.height / (this.activeConfig.font * this.activeConfig.lineH),
      ),
    );
    const targetActiveCols = Math.max(
      1,
      Math.floor(totalCols * this.activeConfig.density),
    );
    const activeColIndices = [...Array(totalCols).keys()]
      .sort(() => 0.5 - Math.random())
      .slice(0, targetActiveCols);

    this.streams = activeColIndices.map(
      (index) => new Stream(index, rows, this.activeConfig, this.glyphs),
    );

    for (const s of this.streams) {
      s.head = -randInt(rows * 2);
    }
  }

  loop(timestamp) {
    if (timestamp - this.lastFrameTime >= this.activeConfig.speed) {
      this.lastFrameTime = timestamp;

      const themeColors = getCurrentThemeColors();
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = this.activeConfig.fade;
      this.ctx.fillStyle = themeColors.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.globalAlpha = 1;
      this.ctx.shadowColor = this.activeConfig.headCol;

      for (const s of this.streams) {
        // ++ Pass the active config to the stream methods
        s.step(this.activeConfig);
        s.draw(this.ctx, this.activeConfig);
      }
    }
    this.animationId = requestAnimationFrame(this.loop.bind(this));
  }

  start() {
    this.stop();
    this.refreshColors();
    this.setup();
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
    this.activePresetName = 'default';
    this.start();
    return true;
  }

  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset)
      return { success: false, message: `Unknown preset: '${presetName}'.` };

    if (preset.isReset) {
      return this.resetToDefaults(); // Changed to call the method above
    }

    if (preset.config) {
      Object.entries(preset.config).forEach(([param, value]) => {
        this.updateParameter(param, value, preset.config);
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

    if (
      isNaN(parsedValue) ||
      (rule.min && parsedValue < rule.min) ||
      (rule.max && parsedValue > rule.max)
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
