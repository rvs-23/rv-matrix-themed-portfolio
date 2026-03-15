/**
 * @file js/rain/engine.js
 * Matrix digital rain engine with persistent glyph grid.
 *
 * Rendering model: A persistent grid of characters covers the entire screen.
 * Streams are brightness cursors — they illuminate cells as they pass downward.
 * Cells decay toward a dim floor brightness, never fully black (except where
 * deletion streams erase). This eliminates the "streams on black" look and
 * creates the dense, luminous glyph field seen in the film.
 *
 * Film-inspired behaviors (Carl Newton's digital rain analysis):
 *  - Globally synchronized glyph mutations (all changes on the same frame)
 *  - Selective head highlighting (~1 in 5 streams get extra glow)
 *  - Head stammer (highlighted heads periodically pause in unison)
 *  - Depth conveyed via opacity layers only (uniform font size)
 *  - Head character flickers (throttled); grid characters are near-static
 *  - Brightness-based color mapping (white → glow → green → dim)
 */

import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);
const randRange = (min, max) => min + randInt(max - min + 1);

/* ── Constants ────────────────────────────────────────────────────────── */

/** ~1 in 5 streams get extra head glow (per the film). */
const HIGHLIGHT_CHANCE = 0.2;

/** All mutable glyphs change on the same frame, every N frames.
 *  Higher = less frequent mutation = more static (closer to film). */
const GLYPH_SYNC_INTERVAL = 6;

/** Every N frames, highlighted heads skip one advancement step. */
const STAMMER_INTERVAL = 90;

/** Head character changes every N frames (~20 changes/sec at 60fps). */
const HEAD_FLICKER_INTERVAL = 3;

/** Brightness decay runs at this interval (~30fps). */
const DECAY_INTERVAL_MS = 33;

/** Per-cell mutation chance on sync frames (3% = near-static). */
const MUTATION_CHANCE = 0.03;

/* ── Stream (brightness cursor) ──────────────────────────────────────── */

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
    // Depth via opacity layers
    this.layer = CFG.layers > 0 ? randInt(CFG.layers) : 0;
    this.opacity = CFG.layerOp?.[this.layer] ?? 1;

    // Deletion flag: stream erases cells instead of illuminating them
    this.del = Math.random() < CFG.delChance;

    // Selective highlighting: only ~20% get extra head glow
    this.hasHighlight = !this.del && Math.random() < HIGHLIGHT_CHANCE;

    this.len = Math.round(
      CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail),
    );
    this.headGlow = randRange(CFG.headGlowMin, CFG.headGlowMax);

    // Short restart delay (~12% of screen height) keeps columns well-covered
    this.head = -randInt(Math.max(1, Math.floor(this.rows * 0.12)));

    // Throttled head flicker character
    this.headChar = this.randChar();

    // Per-stream speed variation (+-35% for organic distribution)
    const speedVar = 0.35;
    this.speed = CFG.speed * (1 + (Math.random() * speedVar * 2 - speedVar));
    this.lastUpdate = 0;

    // Sentient phrases: occasionally a stream spells out a hidden message
    if (Math.random() < this.sentientChance && this.sentientPhrases.length) {
      this.isSentient = true;
      this.sentientText =
        this.sentientPhrases[randInt(this.sentientPhrases.length)];
      this.sentientIndex = 0;
      this.len = Math.max(this.len, this.sentientText.length + 5);
      this.hasHighlight = false; // Sentient streams are ghostly
    } else {
      this.isSentient = false;
      this.sentientText = null;
      this.sentientIndex = 0;
    }
  }

  /**
   * Advance the brightness cursor one row downward.
   * Sets character and brightness in the grid at the new head position.
   */
  step(CFG, grid, timestamp, isStammerFrame) {
    if (timestamp - this.lastUpdate < this.speed) return false;
    this.lastUpdate = timestamp;

    // Stammer: highlighted streams skip one advancement frame
    if (isStammerFrame && this.hasHighlight) return true;

    this.head++;

    if (this.head >= 0 && this.head < this.rows) {
      const cell = grid[this.col][this.head];

      if (this.del) {
        // Deletion streams erase ~50% of cells they pass through
        if (Math.random() < 0.5) {
          cell.brightness = 0;
        }
      } else {
        // Set character at head position
        if (this.isSentient && this.sentientIndex < this.sentientText.length) {
          cell.char = this.sentientText[this.sentientIndex++];
        } else {
          this.headChar = this.randChar();
          cell.char = this.headChar;
        }
        // Peak brightness from layer opacity (sentient = ghostly 60%)
        cell.brightness = this.isSentient
          ? this.opacity * 0.6
          : this.opacity;
      }
    }

    // Reset when head has traveled len rows past screen bottom
    if (this.head - this.len >= this.rows) {
      this.reset(CFG);
    }
    return true;
  }

  /**
   * Illuminate the head and a halo of cells behind it every frame.
   * The halo creates a visible cascade of diminishing brightness behind
   * the leading edge — the "neon glow trail" effect from the film.
   * Also handles throttled head character flicker.
   */
  updateHead(grid, tick) {
    if (this.head < 0 || this.head >= this.rows || this.del) return;

    const peak = this.isSentient ? this.opacity * 0.6 : this.opacity;

    // Illuminate halo: headGlow cells behind the head with diminishing brightness.
    // Linear falloff gives a visible, gradual cascade — the bright head
    // smoothly transitions into the trail rather than dropping off sharply.
    for (let i = 0; i <= this.headGlow; i++) {
      const r = this.head - i;
      if (r < 0 || r >= this.rows) continue;
      const brightness = peak * (1 - i / (this.headGlow + 1));
      grid[this.col][r].brightness = Math.max(
        grid[this.col][r].brightness,
        brightness,
      );
    }

    // Throttled head character flicker
    if (!this.isSentient) {
      if (tick % HEAD_FLICKER_INTERVAL === 0) {
        this.headChar = this.randChar();
      }
      grid[this.col][this.head].char = this.headChar;
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
    this.fontSets = rainConfig.fontSets || {};

    // Default to classic (original 1999 Matrix) font set
    const defaultFontSet = this.fontSets.classic;
    if (defaultFontSet) {
      this.glyphs = defaultFontSet.glyphs;
      this.activeConfig.fontFamily = defaultFontSet.fontFamily;
      this.defaultConfig.fontFamily = defaultFontSet.fontFamily;
    }
    this.activeFontSet = "classic";
    this.streams = [];
    this.grid = [];
    this.totalCols = 0;
    this.gridRows = 0;
    this.animationId = null;
    this.lastDecayTime = 0;
    this.sentientPhrases = sentientPhrases;
    this.dpr = window.devicePixelRatio || 1;

    /** Frame counter for globally synchronized glyph mutations. */
    this.globalTick = 0;

    /** Counter for the stammer effect. */
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

  /** Generate a random glyph from the configured set. */
  randChar() {
    return this.glyphs.charAt(randInt(this.glyphs.length));
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
    // Use at least font size (CJK glyphs are ~square), add 10% gap
    const colW = Math.max(maxGlyphWidth, this.activeConfig.font) * 1.1;

    this.activeConfig.colW = colW;
    this.totalCols = Math.max(1, Math.floor(window.innerWidth / colW));
    this.gridRows = Math.max(
      1,
      Math.floor(
        window.innerHeight /
          (this.activeConfig.font * this.activeConfig.lineH),
      ),
    );

    // Persistent glyph grid: characters exist at every position.
    // Brightness starts at 0 (black) — streams illuminate cells as they pass.
    this.grid = Array.from({ length: this.totalCols }, () =>
      Array.from({ length: this.gridRows }, () => ({
        char: this.randChar(),
        brightness: 0,
      })),
    );

    // Create streams (brightness cursors) for active columns
    const allColIndices = [...Array(this.totalCols).keys()];
    const activeColIndices = allColIndices.filter(
      () => Math.random() < this.activeConfig.density,
    );

    this.streams = activeColIndices.map(
      (index) =>
        new Stream(
          index,
          this.gridRows,
          this.activeConfig,
          this.glyphs,
          this.sentientPhrases,
        ),
    );

    // Scatter initial head positions and pre-illuminate trails
    // so the rain is evenly distributed from the first frame
    const decayBase = this.activeConfig.decayBase;
    for (const s of this.streams) {
      s.head = -randInt(this.gridRows) + randInt(this.gridRows + s.len);
      s.lastUpdate = performance.now();

      // Pre-illuminate the trail behind the initial head position
      if (!s.del) {
        const peak = s.isSentient ? s.opacity * 0.6 : s.opacity;
        for (let i = 0; i <= s.len; i++) {
          const r = s.head - i;
          if (r < 0 || r >= this.gridRows) continue;
          const brightness = Math.pow(decayBase, i) * peak;
          if (brightness > this.grid[s.col][r].brightness) {
            this.grid[s.col][r].brightness = brightness;
          }
        }
      }
    }
  }

  /** Decay all grid cell brightnesses toward zero. */
  decayGrid() {
    const decay = this.activeConfig.decayBase;
    for (let c = 0; c < this.totalCols; c++) {
      const col = this.grid[c];
      for (let r = 0; r < this.gridRows; r++) {
        const cell = col[r];
        if (cell.brightness > 0.005) {
          cell.brightness *= decay;
          // Snap to zero below threshold to avoid lingering ghosts
          if (cell.brightness < 0.005) cell.brightness = 0;
        }
      }
    }
  }

  /** Globally synchronized glyph mutation across the entire grid. */
  mutateGrid() {
    for (let c = 0; c < this.totalCols; c++) {
      const col = this.grid[c];
      for (let r = 0; r < this.gridRows; r++) {
        if (Math.random() < MUTATION_CHANCE) {
          col[r].char = this.randChar();
        }
      }
    }
  }

  /**
   * Render the entire grid. Maps cell brightness to color:
   *  [0.85, 1.0] → white          (head)
   *  [0.2, 0.85) → headCol/glow   (neon glow region)
   *  (0.01, 0.2) → baseCol        (trail body)
   *  ≤ 0.01       → skip          (black / not drawn)
   *
   * Second pass: ALL non-deletion heads get shadowBlur glow overlay.
   * Highlighted heads get stronger blur; others get a subtle halo.
   */
  renderGrid(themeColors) {
    const ctx = this.ctx;
    const CFG = this.activeConfig;
    const colW = CFG.colW || CFG.font;
    const lineH = CFG.font * CFG.lineH;

    // Clear canvas to background color (no semi-transparent overlay needed)
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = themeColors.background;
    ctx.fillRect(
      0,
      0,
      this.canvas.width / this.dpr,
      this.canvas.height / this.dpr,
    );

    // Pass 1: draw all grid cells with brightness-mapped colors
    for (let c = 0; c < this.totalCols; c++) {
      const x = c * colW;
      const col = this.grid[c];

      for (let r = 0; r < this.gridRows; r++) {
        const cell = col[r];
        if (!cell.char || cell.brightness < 0.005) continue;

        const b = cell.brightness;
        let color, alpha;

        if (b >= 0.85) {
          // Head: white at full brightness
          color = "#ffffff";
          alpha = 1.0;
        } else if (b >= 0.2) {
          // Glow region: neon headCol. Wide range (0.2–0.85) keeps
          // more of the trail in the vibrant glow color.
          color = CFG.headCol;
          // Maps 0.2→0.7, 0.85→1.0 (never drops below 0.7 for punch)
          alpha = 0.7 + ((b - 0.2) / 0.65) * 0.3;
        } else if (b > 0.01) {
          // Trail body: primary green
          color = CFG.baseCol;
          alpha = Math.min(1.0, b * 4.0);
        } else {
          continue; // Fully black — skip drawing
        }

        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = color;
        ctx.fillText(cell.char, x, r * lineH);
      }
    }

    // Pass 2: ALL non-deletion heads get shadowBlur glow overlay.
    // Every head gets a subtle halo; highlighted heads get stronger bloom.
    // This creates the pervasive luminous feel across the whole screen.
    for (const s of this.streams) {
      if (s.del || s.head < 0 || s.head >= this.gridRows) continue;

      const cell = this.grid[s.col][s.head];
      if (!cell.char) continue;

      const x = s.col * colW;
      const y = s.head * lineH;

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = CFG.headCol;
      ctx.shadowBlur = s.hasHighlight ? CFG.blur : CFG.blur * 0.4;
      ctx.fillText(cell.char, x, y);
    }

    ctx.shadowBlur = 0;
  }

  loop = (timestamp) => {
    const themeColors = getCurrentThemeColors();
    this.globalTick++;

    // Decay brightness at ~30fps
    if (timestamp - this.lastDecayTime >= DECAY_INTERVAL_MS) {
      this.lastDecayTime = timestamp;
      this.decayGrid();
    }

    // Globally synchronized glyph mutations
    if (this.globalTick % GLYPH_SYNC_INTERVAL === 0) {
      this.mutateGrid();
    }

    // Stammer: periodically all highlighted heads pause for one frame
    this.stammerCounter++;
    const isStammerFrame = this.stammerCounter >= STAMMER_INTERVAL;
    if (isStammerFrame) {
      this.stammerCounter = 0;
    }

    // Step streams (advance cursors, set brightness in grid)
    // Then update heads (counteract decay, apply flicker)
    for (const s of this.streams) {
      s.step(this.activeConfig, this.grid, timestamp, isStammerFrame);
      s.updateHead(this.grid, this.globalTick);
    }

    // Render entire grid
    this.renderGrid(themeColors);

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
    this.lastDecayTime = now - DECAY_INTERVAL_MS;
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

  /**
   * Switch the glyph set and font used by the rain.
   * @param {string} name - Font set key: "classic", "resurrections", or "combined"
   * @returns {{ success: boolean, message: string }}
   */
  setFontSet(name) {
    const fontSet = this.fontSets[name];
    if (!fontSet) {
      return {
        success: false,
        message: `Unknown font set: '${name}'.`,
      };
    }

    this.glyphs = fontSet.glyphs;
    this.activeConfig.fontFamily = fontSet.fontFamily;
    this.activeFontSet = name;
    this.start();

    return {
      success: true,
      message: `Font set '${name}' applied. ${fontSet.description}`,
    };
  }
}
