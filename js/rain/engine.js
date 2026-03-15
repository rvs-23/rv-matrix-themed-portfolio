/**
 * @file js/rain/engine.js
 * Matrix digital rain engine with sentient phrases.
 *
 * Film-inspired behaviors (Carl Newton's digital rain analysis):
 *  - Globally synchronized glyph mutations (all changes on the same frame)
 *  - Selective head highlighting (~1 in 5 streams get extra glow)
 *  - Head stammer (highlighted heads periodically pause in unison)
 *  - Depth conveyed via opacity layers only (uniform font size)
 *  - Head character flickers (throttled); trail characters are near-static
 *  - Continuous illumination gradient over first ~30% of trail
 *  - All visible trail chars redrawn every frame (no blink artifacts)
 */

import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);
const randRange = (min, max) => min + randInt(max - min + 1);

/* ── Carl Newton constants ────────────────────────────────────────────── */

/** ~1 in 5 streams get extra head glow (per the film). */
const HIGHLIGHT_CHANCE = 0.2;

/** All mutable glyphs change on the same frame, every N frames.
 *  Higher = less frequent mutation = more static trail (closer to film). */
const GLYPH_SYNC_INTERVAL = 6;

/** Every N frames, highlighted heads skip one advancement step. */
const STAMMER_INTERVAL = 90;

/** Head character changes every N globalTick frames (~20 changes/sec at 60fps).
 *  Throttled to be visible but not chaotic noise. */
const HEAD_FLICKER_INTERVAL = 3;

/* ── Stream ───────────────────────────────────────────────────────────── */

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
    // Depth via opacity: use the configured layer system
    this.layer = CFG.layers > 0 ? randInt(CFG.layers) : 0;
    this.opacity = CFG.layerOp?.[this.layer] ?? 1;

    // Deletion flag: randomly skip drawing some glyphs (creates sparse gaps)
    this.del = Math.random() < CFG.delChance;

    // Selective highlighting: only ~20% get extra head glow
    this.hasHighlight = !this.del && Math.random() < HIGHLIGHT_CHANCE;

    this.len = Math.round(
      CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail),
    );
    this.headGlow = randRange(CFG.headGlowMin, CFG.headGlowMax);

    // Short restart delay: at most ~12% of screen height before stream
    // becomes visible again. Keeps columns well-covered at the top
    // (~85-90% of columns have visible rain at any moment).
    // Initial scatter for startup is handled separately in setup().
    this.head = -randInt(Math.max(1, Math.floor(this.rows * 0.12)));

    // Fresh character buffer for each pass
    this.buf = Array.from({ length: this.rows }, () => this.randChar());

    // Current head flicker character (throttled, not every frame)
    this.headChar = this.randChar();

    // Per-stream speed variation (+-35% of base speed for organic distribution)
    const speedVar = 0.35;
    this.speed = CFG.speed * (1 + (Math.random() * speedVar * 2 - speedVar));
    this.lastUpdate = 0;

    // Sentient phrase: occasionally a stream spells out a hidden message
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

  /**
   * Advance the illumination cursor one row downward.
   * Only handles position/state — drawing is done separately every frame.
   * @param {boolean} isStammerFrame - If true, highlighted heads skip this step
   */
  step(CFG, timestamp, isStammerFrame) {
    if (timestamp - this.lastUpdate < this.speed) return false;
    this.lastUpdate = timestamp;

    // Stammer: highlighted streams skip one advancement frame
    if (isStammerFrame && this.hasHighlight) {
      return true;
    }

    this.head++;

    // Place a new glyph at the head position
    if (this.head >= 0 && this.head < this.rows) {
      if (this.isSentient && this.sentientIndex < this.sentientText.length) {
        this.buf[this.head] = this.sentientText[this.sentientIndex++];
      } else {
        this.buf[this.head] = this.randChar();
      }
    }

    // Reset only when the entire trail has fully left the screen
    if (this.head - this.len >= this.rows) {
      this.reset(CFG);
    }
    return true;
  }

  /**
   * Globally synchronized glyph mutation. Called on all streams at once
   * every GLYPH_SYNC_INTERVAL frames. Trail characters are near-static
   * (3% chance per glyph) — the head is the only thing that changes rapidly.
   */
  mutateGlyphs() {
    if (this.isSentient) return;
    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      if (t >= 0 && t < this.len && this.buf[r] && Math.random() < 0.03) {
        this.buf[r] = this.randChar();
      }
    }
  }

  /**
   * Draw all visible trail characters. Called every frame (not gated by step)
   * so the background fade doesn't cause brightness oscillation (blink).
   * @param {number} tick - Global frame counter for throttling head flicker
   */
  draw(ctx, CFG, tick) {
    if (!ctx) return;
    const x = this.col * (CFG.colW || CFG.font);
    // Glow region: first ~30% of trail uses brighter glow color,
    // creating the continuous illumination gradient seen in the film.
    const glowRegion = Math.max(3, Math.floor(this.len * 0.3));

    for (let r = 0; r < this.rows; r++) {
      const t = this.head - r;
      if (t < 0 || t >= this.len) continue;

      // Deletion streams randomly skip drawing some glyphs (sparse gaps)
      if (this.del && Math.random() < 0.5) continue;

      // Base trail: exponential fade behind the head
      let alpha = Math.pow(CFG.decayBase, t) * this.opacity;
      let colour = CFG.baseCol;
      let blur = 0;

      if (this.isSentient) {
        // Ghostly: sentient phrases are subtle whispers, not announcements
        colour = CFG.baseCol;
        alpha = Math.pow(0.95, t) * this.opacity * 0.6;
        if (t === 0) {
          colour = CFG.headCol;
          alpha = 0.7;
          blur = CFG.blur * 0.5;
        }
      } else if (t === 0) {
        // Head: white, full brightness
        colour = "#ffffff";
        alpha = 1;
        blur = this.hasHighlight ? CFG.blur : 0;
      } else if (t < glowRegion) {
        // Continuous glow gradient: headCol fading smoothly into baseCol.
        // All streams get this — it's what makes the rain look "neon"
        // rather than flat green. Only highlighted streams get shadowBlur
        // to keep non-highlighted characters crisp and individually readable.
        const glowFade = t / glowRegion; // 0 at head → 1 at boundary
        colour = CFG.headCol;
        alpha = Math.max(alpha, (0.9 - glowFade * 0.5) * this.opacity);
        if (this.hasHighlight && t < this.headGlow) {
          blur = CFG.blur * (1 - t / this.headGlow);
        }
      } else if (this.hasHighlight && t < this.headGlow) {
        // Extended glow for highlighted heads beyond the glow region
        colour = CFG.headCol;
        alpha *= 1 - (t / this.headGlow) * 0.5 + 0.2;
        blur = CFG.blur * (1 - t / this.headGlow);
      }

      alpha = Math.min(1, alpha);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = colour;

      // Only apply shadow blur when needed (performance)
      if (blur > 0) {
        ctx.shadowColor = colour;
        ctx.shadowBlur = Math.max(0, blur);
      } else {
        ctx.shadowBlur = 0;
      }

      // Head flickers: new random char every HEAD_FLICKER_INTERVAL frames
      // (~20 changes/sec). Trail characters stay static. This matches the
      // film where the cursor visibly changes but isn't pure noise.
      let ch;
      if (t === 0 && !this.isSentient) {
        if (tick % HEAD_FLICKER_INTERVAL === 0) {
          this.headChar = this.randChar();
        }
        ch = this.headChar;
      } else {
        ch = this.buf[r];
      }

      if (ch) {
        ctx.fillText(ch, x, r * CFG.font * CFG.lineH);
      }
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

    /** Frame counter for globally synchronized glyph mutations */
    this.globalTick = 0;

    /** Counter for the stammer effect */
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

    // Column width: measure the widest glyph in the set, enforce font-size minimum
    let maxGlyphWidth = 0;
    for (let i = 0; i < Math.min(this.glyphs.length, 30); i++) {
      const w = this.ctx.measureText(this.glyphs[i]).width;
      if (w > maxGlyphWidth) maxGlyphWidth = w;
    }
    // Use at least font size (CJK glyphs are ~square), add 10% gap for clean spacing
    const colW = Math.max(maxGlyphWidth, this.activeConfig.font) * 1.1;

    this.activeConfig.colW = colW;
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

    // Scatter initial head positions across full cycle range
    // so streams are evenly distributed across the screen from the start
    for (const s of this.streams) {
      s.head = -randInt(rows) + randInt(rows + s.len);
      s.lastUpdate = performance.now();
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

    // Step advances head position; draw redraws ALL visible trail chars.
    // Drawing every frame (not gated by step) ensures the background fade
    // doesn't cause brightness oscillation on characters between steps.
    this.ctx.globalAlpha = 1;
    for (const s of this.streams) {
      s.step(this.activeConfig, timestamp, isStammerFrame);
      s.draw(this.ctx, this.activeConfig, this.globalTick);
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
