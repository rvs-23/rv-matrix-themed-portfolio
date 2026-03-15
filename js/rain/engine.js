/**
 * @file js/rain/engine.js
 * Matrix digital rain engine with sentient phrases.
 *
 * Implements film-accurate behaviors from Carl Newton's digital rain analysis:
 *  - Stationary glyphs with illumination waves passing downward
 *  - Globally synchronized glyph mutations (all changes on the same frame)
 *  - Selective head highlighting (~1 in 5 streams get bright white heads)
 *  - Deletion streams that erase characters, creating organic density cycles
 *  - Head stammer (highlighted heads periodically pause in unison)
 *  - Depth via opacity layers only (no font-size variation)
 *
 * Glyph set: 30 half-width katakana + 日 + 0-9 + Z + 11 symbols (54 chars).
 */

import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);
const randRange = (min, max) => min + randInt(max - min + 1);

/* ── Carl Newton constants ────────────────────────────────────────────── */

/** ~1 in 5 streams get a bright white highlighted head (per the film). */
const HIGHLIGHT_CHANCE = 0.2;

/**
 * All mutable glyphs change on the same frame. In the film this happens
 * every 3 frames; we use the engine's globalTick counter to synchronize.
 */
const GLYPH_SYNC_INTERVAL = 3;

/**
 * Every ~90 frames, all highlighted heads "stammer" — they skip one
 * advancement step while non-highlighted streams continue normally.
 * This creates the subtle rhythmic desynchronization visible in the film.
 */
const STAMMER_INTERVAL = 90;

/* ── Stream ───────────────────────────────────────────────────────────── */

class Stream {
  /**
   * Each Stream represents one column of the rain. Characters in `buf`
   * are stationary — only the illumination cursor (`head`) moves downward.
   * New glyphs are placed at the head position as it advances.
   */
  constructor(colIndex, rows, config, glyphs, sentientPhrases = []) {
    this.col = colIndex;
    this.rows = rows;
    this.glyphs = glyphs;
    this.sentientPhrases = sentientPhrases;
    this.sentientChance = 0.069;

    // Pre-fill the column with random glyphs (persistent grid)
    this.buf = Array.from({ length: this.rows }, () => this.randChar());
    this.reset(config);
  }

  randChar() {
    return this.glyphs.charAt(randInt(this.glyphs.length));
  }

  /**
   * Re-initialize stream state for a new pass down the column.
   * The character buffer is NOT fully re-randomized — glyphs persist
   * from previous passes (film-accurate: glyphs stay in place).
   */
  reset(CFG) {
    // Depth via opacity: use the configured layer system
    this.layer = CFG.layers > 0 ? randInt(CFG.layers) : 0;
    this.opacity = CFG.layerOp?.[this.layer] ?? 1;

    // Deletion stream: erases characters instead of placing new ones.
    // Creates organic breathing as columns go dark then refill.
    this.isDeletion = Math.random() < CFG.delChance;

    // Selective highlighting: only ~20% get bright white head glow
    this.hasHighlight = !this.isDeletion && Math.random() < HIGHLIGHT_CHANCE;

    this.len = Math.round(
      CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail),
    );
    this.headGlow = randRange(CFG.headGlowMin, CFG.headGlowMax);

    // Start above the visible area for a staggered entrance
    this.head = -randInt(Math.floor(this.len * 0.5));

    // Per-stream speed variation (+-25% of base speed)
    const speedVar = 0.25;
    this.speed = CFG.speed * (1 + (Math.random() * speedVar * 2 - speedVar));
    this.lastUpdate = 0;

    // Sentient phrase: occasionally a stream spells out a hidden message
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

  /**
   * Advance the illumination cursor one row downward.
   * @param {boolean} isStammerFrame - If true, highlighted heads skip this step
   * @returns {boolean} Whether the stream was due for an update this frame
   */
  step(CFG, timestamp, isStammerFrame) {
    if (timestamp - this.lastUpdate < this.speed) return false;
    this.lastUpdate = timestamp;

    // Stammer: highlighted streams skip one advancement frame
    if (isStammerFrame && this.hasHighlight) {
      return true; // Still "stepped" (for draw), but head doesn't advance
    }

    this.head++;

    // Place or erase the glyph at the new head position
    if (this.head >= 0 && this.head < this.rows) {
      if (this.isDeletion) {
        // Deletion stream: erase the cell (creates dark gap)
        this.buf[this.head] = null;
      } else if (
        this.isSentient &&
        this.sentientIndex < this.sentientText.length
      ) {
        this.buf[this.head] = this.sentientText[this.sentientIndex++];
      } else {
        // Normal stream: new glyph appears at head (film: "glyphs appear beneath")
        this.buf[this.head] = this.randChar();
      }
    }

    // Reset when the trail has fully passed off-screen
    if (this.head > this.rows + this.len * 0.3) {
      if (Math.random() < 0.02 || this.head > this.rows + this.len) {
        this.reset(CFG);
      }
    }
    return true;
  }

  /**
   * Globally synchronized glyph mutation. Called on all streams simultaneously
   * every GLYPH_SYNC_INTERVAL frames. Only mutates visible trail characters;
   * sentient and deletion streams are exempt.
   */
  mutateGlyphs() {
    if (this.isSentient || this.isDeletion) return;
    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      // Only mutate characters currently within the visible trail
      if (t >= 0 && t < this.len && this.buf[r] && Math.random() < 0.15) {
        this.buf[r] = this.randChar();
      }
    }
  }

  /**
   * Render this stream's visible trail onto the canvas.
   * Deletion streams produce no visible output (they only erase grid cells).
   */
  draw(ctx, CFG, colWidth) {
    if (!ctx || this.isDeletion) return;
    const x = this.col * colWidth;

    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r; // Distance behind the head (0 = head itself)
      if (t < 0 || t >= this.len) continue;
      if (!this.buf[r]) continue; // Skip deleted/empty cells

      let alpha;
      let colour;
      let blur = 0;

      if (this.isSentient) {
        // Sentient streams glow in the head color with slow decay
        colour = CFG.headCol;
        alpha = Math.pow(0.97, t) * this.opacity;
        blur = CFG.blur * alpha * 1.5;
        if (t === 0) {
          colour = "#ffffff";
          alpha = 1;
          blur = CFG.blur * 2;
        }
      } else {
        // Standard trail: exponential fade behind the head
        alpha = Math.pow(CFG.decayBase, t) * this.opacity;
        colour = CFG.baseCol;

        if (t === 0 && this.hasHighlight) {
          // Highlighted head: pure white with glow (film: ~1 in 5 streams)
          colour = "#ffffff";
          alpha = 1;
          blur = CFG.blur;
        } else if (t === 0) {
          // Non-highlighted head: slightly brighter green, no glow
          alpha = Math.min(1, alpha * 1.5);
        } else if (this.hasHighlight && t < this.headGlow && t > 0) {
          // Glow gradient behind a highlighted head
          colour = CFG.headCol;
          alpha *= 1 - (t / this.headGlow) * 0.5 + 0.2;
          blur = CFG.blur * (1 - t / this.headGlow);
        }
      }

      alpha = Math.min(1, alpha);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = colour;

      // Only apply shadow blur when needed (performance optimization)
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

/* ── RainEngine ───────────────────────────────────────────────────────── */

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

    /** Measured column width from ctx.measureText — used consistently in draw */
    this.colWidth = 0;

    /** Frame counter for globally synchronized glyph mutations */
    this.globalTick = 0;

    /** Counter for the stammer effect (highlighted heads pause periodically) */
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

    // Size canvas to window, accounting for device pixel ratio
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Single font size for all streams (depth via opacity, not font scaling)
    this.ctx.font = `${this.activeConfig.font}px ${this.activeConfig.fontFamily}`;
    this.ctx.textBaseline = "top";

    // Use measured glyph width for consistent column spacing
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

    // Filter columns by density — not every column gets a stream
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

    // Scatter initial head positions so streams don't all start together
    for (const s of this.streams) {
      s.head = -randInt(rows * 2);
    }
  }

  loop = (timestamp) => {
    const themeColors = getCurrentThemeColors();
    this.globalTick++;

    // Background fade at ~30fps — draws semi-transparent background to create trails
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

    // Globally synchronized glyph mutations (Carl Newton: all changes on same frame)
    if (this.globalTick % GLYPH_SYNC_INTERVAL === 0) {
      for (const s of this.streams) {
        s.mutateGlyphs();
      }
    }

    // Stammer: periodically all highlighted heads pause for one frame
    this.stammerCounter++;
    const isStammerFrame = this.stammerCounter >= STAMMER_INTERVAL;
    if (isStammerFrame) {
      this.stammerCounter = 0;
    }

    // Step and draw all streams in a single pass (uniform font size)
    this.ctx.font = `${this.activeConfig.font}px ${this.activeConfig.fontFamily}`;
    this.ctx.globalAlpha = 1;
    for (const s of this.streams) {
      const didStep = s.step(this.activeConfig, timestamp, isStammerFrame);
      if (didStep) {
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

  /**
   * Apply a named preset. Only rebuilds streams if structural parameters
   * (font, density, lineH) change; otherwise streams adopt new values
   * on their next natural reset cycle (preserves visual continuity).
   */
  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset)
      return { success: false, message: `Unknown preset: '${presetName}'.` };

    if (preset.isReset) {
      return this.resetToDefaults();
    }

    if (preset.config) {
      // Check if structural params changed (these require a full stream rebuild)
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
        // Non-structural change: streams adopt new speed/trail/glow on next reset
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
