/**
 * @file js/rain/engine.js
 * Matrix digital rain engine with persistent glyph grid.
 *
 * Rendering model: A persistent grid of characters covers the entire screen.
 * Streams are brightness cursors — they illuminate cells as they pass downward.
 * Cells decay toward `dimFloor`; when `dimFloor` is 0 (the current default and
 * most presets) they reach true black, when it's > 0 they retain a faint
 * persistent glyph field. Some presets (e.g. whisper, pulse) use a small floor
 * for the dense, luminous look seen in the film.
 *
 * Film-inspired behaviors (Carl Newton's digital rain analysis):
 *  - Globally synchronized glyph mutations (all changes on the same frame)
 *  - Selective head highlighting (~1 in 5 streams get extra glow)
 *  - Head stammer (highlighted heads periodically pause in unison)
 *  - Depth conveyed via opacity layers only (uniform font size)
 *  - Head character flickers (throttled); grid characters are near-static
 *  - Brightness-based color mapping (white → glow → green → dim)
 *  - Continuous speed wobble (sine wave with irrational frequency)
 *  - Full-screen bloom pass (offscreen downscale → blur → additive composite)
 *  - Multiple raindrops per column (concurrent streams with natural spacing)
 *  - Temporal dithering (tiny alpha noise prevents gradient banding)
 *  - Glyph cross-fade on mutation (old + new at 50% opacity each)
 */

import { getCurrentThemeColors } from "../controller/terminalController.js";

const randInt = (n) => Math.floor(Math.random() * n);
const randRange = (min, max) => min + randInt(max - min + 1);

/* ── Constants ────────────────────────────────────────────────────────── */

/** Brightness decay runs at this interval (~30fps). */
const DECAY_INTERVAL_MS = 33;

/** Size of the brightness→colour lookup table (one entry per ~1.5% of range). */
const LUT_SIZE = 64;
const LUT_LAST = LUT_SIZE - 1;

/**
 * Parse a CSS colour string (#rgb, #rrggbb, or rgb()/rgba()) to {r,g,b}.
 * Falls back to the supplied colour if it can't be parsed. Used only when the
 * palette LUT is (re)built, never on the per-frame render path.
 */
function parseColorRGB(str, fallback) {
  if (typeof str === "string") {
    const s = str.trim();
    if (s[0] === "#") {
      const hex = s.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
      }
    } else {
      const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
      if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    }
  }
  return fallback;
}

/** Format 0..255 channels as a "#rrggbb" string. */
function rgbToHex(r, g, b) {
  const h = (n) => {
    const v = n < 0 ? 0 : n > 255 ? 255 : Math.round(n);
    return v < 16 ? "0" + v.toString(16) : v.toString(16);
  };
  return "#" + h(r) + h(g) + h(b);
}

/**
 * Build a 64-entry brightness→colour lookup table by linearly interpolating an
 * ordered list of palette stops. Colours below the first stop and above the
 * last clamp to those endpoints (so the head stays a flat cursor colour). Runs
 * only on palette change — the render loop just indexes the result.
 * @param {{at:number, c:{r:number,g:number,b:number}}[]} stops ascending `at`
 * @returns {string[]} LUT_SIZE "#rrggbb" strings
 */
function buildLUT(stops) {
  const lut = new Array(LUT_SIZE);
  const last = stops.length - 1;
  for (let i = 0; i < LUT_SIZE; i++) {
    const pos = i / LUT_LAST; // 0..1 across the table
    // Advance to the segment [stops[s], stops[s+1]] that contains `pos`.
    let s = 0;
    while (s < last && pos > stops[s + 1].at) s++;
    const a = stops[s];
    const bStop = stops[s + 1] ?? a;
    const span = bStop.at - a.at;
    const t = span > 0 ? (pos - a.at) / span : 0;
    const tc = t < 0 ? 0 : t > 1 ? 1 : t;
    lut[i] = rgbToHex(
      a.c.r + (bStop.c.r - a.c.r) * tc,
      a.c.g + (bStop.c.g - a.c.g) * tc,
      a.c.b + (bStop.c.b - a.c.b) * tc,
    );
  }
  return lut;
}

/* ── Stream (brightness cursor) ──────────────────────────────────────── */

class Stream {
  constructor(colIndex, rows, config, glyphs, sentientPhrases = []) {
    this.col = colIndex;
    this.rows = rows;
    this.glyphs = glyphs;
    this.sentientPhrases = sentientPhrases;
    this.isExtra = false;
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

    // Selective highlighting: configurable chance for extra head glow
    this.hasHighlight =
      !this.del && Math.random() < (CFG.highlightChance ?? 0.2);

    this.len = Math.round(
      CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail),
    );
    this.headGlow = randRange(CFG.headGlowMin, CFG.headGlowMax);

    // Short restart delay (~12% of screen height) keeps columns well-covered
    // Extra streams get additional delay for spacing discipline
    const delayBase = randInt(Math.max(1, Math.floor(this.rows * 0.12)));
    const extraDelay = this.isExtra ? (CFG.minStreamGap ?? 12) : 0;
    this.head = -(delayBase + extraDelay);

    // Throttled head flicker character
    this.headFlickerInterval = CFG.headFlickerInterval ?? 3;
    this.headChar = this.randChar();

    // Per-stream speed variation (+-50% base for organic distribution)
    const speedVar = 0.5;
    this.baseSpeed =
      CFG.speed * (1 + (Math.random() * speedVar * 2 - speedVar));
    // Random phase for continuous sine-wave wobble (non-repeating organic drift)
    this.speedPhase = Math.random() * Math.PI * 2;
    this.lastUpdate = 0;


    // Sentient phrases: occasionally a stream spells out a hidden message
    if (Math.random() < (CFG.sentientChance ?? 0.069) && this.sentientPhrases.length) {
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
    // Continuous speed wobble: +-20% oscillation on top of +-50% base
    // Uses irrational frequency (sqrt(2)) for non-repeating organic drift
    const wobble =
      1 +
      0.2 * Math.sin(Math.SQRT2 * timestamp * 0.001 + this.speedPhase);

    // Gravity acceleration: speed decreases (faster) as head approaches bottom
    const gravity = CFG.gravityAccel ?? 0;
    const gravityMult = gravity > 0 && this.head > 0 && this.rows > 0
      ? 1 / (1 + gravity * (this.head / this.rows))
      : 1;

    if (timestamp - this.lastUpdate < this.baseSpeed * wobble * gravityMult) return false;
    this.lastUpdate = timestamp;

    // Stammer: highlighted streams skip one advancement frame
    if (isStammerFrame && this.hasHighlight) return true;

    const prevHead = this.head;
    this.head++;

    // Detect the frame the head exits the bottom of the screen
    this.justLanded = prevHead < this.rows && this.head >= this.rows;

    if (this.head >= 0 && this.head < this.rows) {
      const cell = grid[this.col][this.head];

      if (this.del) {
        // Deletion streams erase ~50% of cells they pass through
        if (Math.random() < 0.5) {
          cell.brightness = 0;
          cell.sentient = false;
        }
      } else {
        // Set character at head position
        if (this.isSentient && this.sentientIndex < this.sentientText.length) {
          cell.char = this.sentientText[this.sentientIndex++];
          cell.sentient = true; // protect this glyph from the mutation pass
        } else {
          this.headChar = this.randChar();
          cell.char = this.headChar;
          cell.sentient = false;
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
    // Square-root falloff keeps cells bright much longer before tapering —
    // creates the wide, luminous cascade seen in the film where many cells
    // behind the head stay near-white/glow before gradually fading.
    for (let i = 0; i <= this.headGlow; i++) {
      const r = this.head - i;
      if (r < 0 || r >= this.rows) continue;
      const t = i / (this.headGlow + 1);
      const brightness = peak * Math.sqrt(1 - t);
      grid[this.col][r].brightness = Math.max(
        grid[this.col][r].brightness,
        brightness,
      );
    }

    // Throttled head character flicker
    if (!this.isSentient) {
      if (tick % this.headFlickerInterval === 0) {
        this.headChar = this.randChar();
      }
      grid[this.col][this.head].char = this.headChar;
    }
  }
}

/* ── RainEngine ───────────────────────────────────────────────────────── */

export default class RainEngine {
  constructor(rainConfig, fontConfig, sentientPhrases = []) {
    // Fail loud-but-clear if rain.json never loaded (404 / offline / bad JSON):
    // dataLoader returns {} on failure, which would otherwise blow up below with
    // a cryptic "cannot set property of undefined". The caller catches this and
    // disables rain rather than freezing the whole app on the loader screen.
    if (
      !rainConfig ||
      typeof rainConfig.defaultConfig !== "object" ||
      rainConfig.defaultConfig === null
    ) {
      throw new Error(
        "RainEngine: rain.json is missing or invalid (no defaultConfig).",
      );
    }
    this.canvas = document.getElementById("matrix-canvas");
    this.ctx = this.canvas?.getContext("2d");
    // Defensive copy — never mutate the shared parsed-JSON object in place.
    this.defaultConfig = { ...rainConfig.defaultConfig };
    this.glyphs = rainConfig.glyphs || "01";
    this.presets = rainConfig.presets || {};
    this.validationRules = rainConfig.validationRules || {};
    this.defaultConfig.fontFamily = fontConfig.matrix;
    this.activeConfig = { ...this.defaultConfig };
    this.activePresetName = "default";
    this.fontSets = rainConfig.fontSets || {};

    // Default to the classic 1999 katakana set (combined/resurrections opt-in
    // via `rain font`).
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
    // Monotonic token: each start() claims one. start() bails after its async
    // setup() if a newer start() has superseded it, so overlapping calls (boot
    // applyPreset + boot start, or a resize mid-setup) never spawn two rAF loops.
    this._startGen = 0;
    this.lastDecayTime = 0;
    this.sentientPhrases = sentientPhrases;
    this.dpr = window.devicePixelRatio || 1;

    /** Frame counter for globally synchronized glyph mutations. */
    this.globalTick = 0;

    /** Counter for the stammer effect. */
    this.stammerCounter = 0;

    /** Active landing glow bursts at canvas bottom. */
    this.landingGlows = [];

    /** True during high-res capture — disables temporal dithering. */
    this.isCapturing = false;

    /**
     * Cached resolved theme colours + the brightness→colour LUT derived from
     * them. Both are rebuilt only on palette change (refreshColors, which the
     * `theme` command calls on every switch), so the render loop reads these
     * instead of calling getComputedStyle ~60×/s. Null until first refresh.
     */
    this.themeColors = null;
    this.colorLUT = null;

    /** Active transient colour pulse (redpill/bluepill/wake/theme swell) or null. */
    this.pulseState = null;

    /**
     * Torch/spotlight mode: when on, the rain is veiled black except a soft
     * radius that follows the pointer. The canvas is `pointer-events: none`, so
     * we track the pointer on `window`; `torchX/Y` eases toward it for a trail.
     */
    this.torch = false;
    this.torchRadius = 160;
    this.torchRadiusUser = null; // px override, or null = auto (scales w/ viewport)
    this.pointerX = window.innerWidth / 2;
    this.pointerY = window.innerHeight / 2;
    this.torchX = this.pointerX;
    this.torchY = this.pointerY;
    this.pointerInside = true; // false when the pointer leaves the window → dark
    this._onPointer = (e) => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerInside = true;
    };
    // relatedTarget null → the pointer left the window entirely (not just an
    // element boundary). window blur covers tab/app switches.
    this._onPointerLeave = (e) => {
      if (!e || !e.relatedTarget) this.pointerInside = false;
    };
    this._onBlur = () => {
      this.pointerInside = false;
    };
    window.addEventListener("pointermove", this._onPointer, { passive: true });
    window.addEventListener("pointerdown", this._onPointer, { passive: true });
    window.addEventListener("pointerout", this._onPointerLeave, {
      passive: true,
    });
    window.addEventListener("blur", this._onBlur);

    this._resizeTimeout = null;
    this._handleResize = this._handleResize.bind(this);
    window.addEventListener("resize", this._handleResize, { passive: true });
  }

  destroy() {
    window.removeEventListener("resize", this._handleResize);
    window.removeEventListener("pointermove", this._onPointer);
    window.removeEventListener("pointerdown", this._onPointer);
    window.removeEventListener("pointerout", this._onPointerLeave);
    window.removeEventListener("blur", this._onBlur);
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
    this.landingGlows = [];

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

    // Torch radius: a user override wins; otherwise it scales with the smaller
    // viewport dimension (recomputed here so it tracks resizes / orientation).
    this.torchRadius =
      this.torchRadiusUser ??
      Math.max(90, Math.min(window.innerWidth, window.innerHeight) * 0.15);

    this.activeConfig.colW = colW;
    this.totalCols = Math.max(1, Math.floor(window.innerWidth / colW));
    this.gridRows = Math.max(
      1,
      Math.ceil(
        window.innerHeight /
          (this.activeConfig.font * this.activeConfig.lineH),
      ),
    );

    // Persistent glyph grid: characters exist at every position.
    // Brightness starts at 0 (black) — streams illuminate cells as they pass.
    this.grid = Array.from({ length: this.totalCols }, () =>
      Array.from({ length: this.gridRows }, () => ({
        char: this.randChar(),
        prevChar: null,
        brightness: 0,
        // Set while a sentient stream owns this cell (spelling a phrase); the
        // glyph mutation pass skips these so the words stay readable.
        sentient: false,
      })),
    );

    // Bloom: offscreen canvas at 1/4 resolution for diffuse glow pass
    this.bloomCanvas = document.createElement("canvas");
    this.bloomCtx = this.bloomCanvas.getContext("2d");
    this.bloomScale = 0.25;
    this.bloomCanvas.width = Math.ceil(this.canvas.width * this.bloomScale);
    this.bloomCanvas.height = Math.ceil(this.canvas.height * this.bloomScale);

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

    // Multiple raindrops per column: some columns get a second stream.
    // Extra streams are marked and get additional restart delay for spacing.
    const multiChance = this.activeConfig.multiStream ?? 0.2;
    if (multiChance > 0) {
      const extraStreams = activeColIndices
        .filter(() => Math.random() < multiChance)
        .map((index) => {
          const s = new Stream(
            index,
            this.gridRows,
            this.activeConfig,
            this.glyphs,
            this.sentientPhrases,
          );
          s.isExtra = true;
          return s;
        });
      this.streams.push(...extraStreams);
    }

    // Scatter initial head positions and pre-illuminate trails
    // so the rain is evenly distributed from the first frame
    const decayBase = this.activeConfig.decayBase;
    const minGap = this.activeConfig.minStreamGap ?? 12;
    for (const s of this.streams) {
      s.head = -randInt(this.gridRows) + randInt(this.gridRows + s.len);
      // Stagger extra streams further from primaries for spacing
      if (s.isExtra) {
        s.head -= minGap + randInt(minGap);
      }
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

  /** Decay all grid cell brightnesses toward `dimFloor` (0 = fade to black). */
  decayGrid() {
    const decay = this.activeConfig.decayBase;
    const floor = this.activeConfig.dimFloor ?? 0;
    const floorThreshold = floor + 0.005;
    for (let c = 0; c < this.totalCols; c++) {
      const col = this.grid[c];
      for (let r = 0; r < this.gridRows; r++) {
        const cell = col[r];
        if (cell.brightness > floorThreshold) {
          cell.brightness *= decay;
          // Uneven tail dissolve: dim cells randomly snap out early,
          // creating gritty analogue fade instead of smooth decay
          if (cell.brightness < 0.12 && cell.brightness > floorThreshold && Math.random() < 0.15) {
            cell.brightness = floor;
            cell.sentient = false; // phrase has faded; release the cell
            continue;
          }
          if (cell.brightness < floorThreshold) {
            cell.brightness = floor;
            cell.sentient = false;
          }
        }
      }
    }
  }

  /** Globally synchronized glyph mutation across the entire grid.
   *  Stores previous character for cross-fade rendering. */
  mutateGrid() {
    const mutationChance = this.activeConfig.mutationChance ?? 0.03;
    for (let c = 0; c < this.totalCols; c++) {
      const col = this.grid[c];
      for (let r = 0; r < this.gridRows; r++) {
        const cell = col[r];
        // Sentient cells spell a phrase — never mutate them or the words scramble.
        if (cell.sentient) {
          cell.prevChar = null;
          continue;
        }
        if (Math.random() < mutationChance) {
          cell.prevChar = cell.char;
          cell.char = this.randChar();
        } else {
          cell.prevChar = null;
        }
      }
    }
  }

  /**
   * Render the entire grid. Every visible cell gets a brightness-scaled
   * shadowBlur — each glyph glows from within like glass holding light.
   * Brighter cells glow more intensely, creating the luminous cascade
   * seen in the film.
   *
   * Color mapping: the colour comes from the precomputed brightness→colour LUT
   * (built per palette change, indexed by brightness here), which ramps
   * background → primary → glow → white cursor. Alpha stays keyed off the same
   * brightness bands as before:
   *  [0.85, 1.0] → alpha 1.0                (head)
   *  [0.2, 0.85) → alpha 0.7..1.0           (neon glow region)
   *  (0.01, 0.2) → alpha 0..0.8 (b * 4)     (trail body)
   *  ≤ 0.01       → skip                     (black / not drawn)
   *
   * Second pass: full-screen bloom (offscreen blur + additive composite).
   */
  renderGrid(themeColors) {
    const ctx = this.ctx;
    const CFG = this.activeConfig;
    const colW = CFG.colW || CFG.font;
    const lineH = CFG.font * CFG.lineH;
    const blurScale = CFG.blur;

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

    // Draw all grid cells with brightness-mapped colors and per-cell glow.
    // Every visible character gets shadowBlur scaled by its brightness,
    // making each glyph look self-illuminated — glass holding light.
    ctx.shadowColor = CFG.headCol;

    // Blur clamp: cap per-glyph shadowBlur to prevent muddy midtones
    const maxBlur = blurScale * 0.65;
    const capturing = this.isCapturing;

    // Palette LUT — normally built in refreshColors(); guard covers a render
    // that somehow precedes the first refreshColors().
    if (!this.colorLUT) this._buildColorLUT(themeColors);
    const lut = this.colorLUT;

    for (let c = 0; c < this.totalCols; c++) {
      const x = c * colW;
      const col = this.grid[c];

      for (let r = 0; r < this.gridRows; r++) {
        const cell = col[r];
        if (!cell.char || cell.brightness < 0.005) continue;

        let b = cell.brightness;

        // Ghost flicker: dim cells occasionally spike brighter for one frame
        // (visual only — does not alter grid state)
        if (b > 0.05 && b < 0.25 && Math.random() < 0.006) {
          b += 0.15 + Math.random() * 0.1;
        }

        let alpha;

        if (b >= 0.85) {
          alpha = 1.0;
        } else if (b >= 0.2) {
          alpha = 0.7 + ((b - 0.2) / 0.65) * 0.3;
        } else if (b > 0.01) {
          alpha = Math.min(1.0, b * 4.0);
        } else {
          continue;
        }

        // Colour from the LUT (background → primary → glow → white cursor).
        const color = lut[Math.min(LUT_LAST, (b * LUT_SIZE) | 0)];

        // Per-cell glow with clamp to preserve glyph legibility
        ctx.shadowBlur = b > 0.15 ? Math.min(b * blurScale, maxBlur) : 0;

        // Temporal dithering: disabled during screenshot capture
        const finalAlpha = capturing
          ? alpha
          : Math.max(0, alpha + (Math.random() - 0.5) * 0.02);
        ctx.fillStyle = color;

        if (cell.prevChar) {
          ctx.globalAlpha = finalAlpha * 0.5;
          ctx.fillText(cell.prevChar, x, r * lineH);
          ctx.fillText(cell.char, x, r * lineH);
        } else {
          ctx.globalAlpha = finalAlpha;
          ctx.fillText(cell.char, x, r * lineH);
        }
      }
    }

    ctx.shadowBlur = 0;

    // Pass 3: Full-screen bloom — pervasive diffuse phosphor glow.
    // Downscale the rendered frame to a small offscreen canvas, then
    // draw it back blurred with additive blending. Creates the ambient
    // luminescence that bleeds between characters in the film.
    const bloomRadius = CFG.bloomRadius ?? 8;
    const bloomIntensity = CFG.bloomIntensity ?? 0.15;

    if (bloomRadius > 0 && bloomIntensity > 0 && this.bloomCanvas) {
      const bCtx = this.bloomCtx;
      const bCanvas = this.bloomCanvas;

      // Downscale main canvas to bloom canvas
      bCtx.clearRect(0, 0, bCanvas.width, bCanvas.height);
      bCtx.drawImage(this.canvas, 0, 0, bCanvas.width, bCanvas.height);

      // Draw bloom back with blur + additive blend
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = `blur(${bloomRadius}px)`;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = bloomIntensity;
      ctx.drawImage(bCanvas, 0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  /**
   * Paint one full frame in composite order: grid, then landing-glow bursts,
   * then the torch veil LAST so nothing (bloom, glows) bleeds through the dark.
   * The animation loop and the static repaint callers both route through here.
   */
  renderFrame(themeColors, timestamp = performance.now()) {
    this.renderGrid(themeColors);
    const landingGlow = this.activeConfig.landingGlow ?? 0;
    if (landingGlow > 0 && this.landingGlows.length > 0) {
      this.renderLandingGlows(timestamp, themeColors);
    }
    // Torch/spotlight veil: hide everything except a soft radius at the pointer.
    if (this.torch && !this.isCapturing) this._renderTorch(themeColors);
  }

  /**
   * Composite a background-coloured veil over the finished frame with a soft
   * transparent hole that eases toward the pointer, so only the rain around the
   * cursor shows. Cheap: one radial gradient + one fillRect per frame.
   */
  _renderTorch(themeColors) {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const c = parseColorRGB(themeColors.background || "#000", {
      r: 0,
      g: 0,
      b: 0,
    });
    const solid = `rgba(${c.r},${c.g},${c.b},1)`;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Pointer left the window (or the app lost focus) → no light, full veil.
    if (!this.pointerInside) {
      ctx.fillStyle = solid;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      return;
    }

    // Ease the light toward the pointer for a trailing feel.
    this.torchX += (this.pointerX - this.torchX) * 0.18;
    this.torchY += (this.pointerY - this.torchY) * 0.18;

    const R = this.torchRadius;
    const clear = `rgba(${c.r},${c.g},${c.b},0)`;
    const grad = ctx.createRadialGradient(
      this.torchX,
      this.torchY,
      R * 0.12,
      this.torchX,
      this.torchY,
      R,
    );
    grad.addColorStop(0, clear);
    grad.addColorStop(0.6, clear);
    grad.addColorStop(1, solid); // fully veiled by the outer radius (and beyond)
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /** Toggle torch/spotlight mode. Repaints once if the loop is stopped. */
  setTorch(on) {
    this.torch = !!on;
    if (!this.animationId && this.grid && this.grid.length && this.ctx) {
      this.renderFrame(this.themeColors || getCurrentThemeColors());
    }
    return this.torch;
  }

  /** Set the torch radius in px (overrides the viewport-scaled default). */
  setTorchRadius(px) {
    this.torchRadiusUser = px;
    this.torchRadius = px;
    if (!this.animationId && this.grid && this.grid.length && this.ctx) {
      this.renderFrame(this.themeColors || getCurrentThemeColors());
    }
  }

  /**
   * Render multi-layered elliptical glow bursts at the canvas bottom.
   * Three concentric layers with exponential decay (~120ms half-life)
   * create a phosphor-persistence effect rather than a cartoonish pop.
   */
  renderLandingGlows(timestamp, themeColors) {
    const ctx = this.ctx;
    const canvasH = window.innerHeight;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Three layers: tight core (fast decay), mid bloom, wide halo (slow decay)
    const layers = [
      { rScale: 0.3, aScale: 0.5, halfLife: 80 },
      { rScale: 0.7, aScale: 0.2, halfLife: 140 },
      { rScale: 1.5, aScale: 0.06, halfLife: 220 },
    ];

    for (let i = this.landingGlows.length - 1; i >= 0; i--) {
      const g = this.landingGlows[i];
      const age = timestamp - g.birth;
      if (age > 600) {
        this.landingGlows.splice(i, 1);
        continue;
      }

      for (const layer of layers) {
        // Exponential decay: each layer has its own half-life
        const alpha =
          g.intensity * layer.aScale * Math.exp((-age * 0.693) / layer.halfLife);
        if (alpha < 0.003) continue;

        const r = g.radius * layer.rScale;

        // Elliptical shape (wider than tall) via scale transform
        ctx.save();
        ctx.translate(g.x, canvasH);
        ctx.scale(1.0, 0.4);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, themeColors.glow);
        grad.addColorStop(0.15, themeColors.glow);
        grad.addColorStop(0.5, themeColors.primary);
        grad.addColorStop(1, "transparent");

        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.fillRect(-r, -r, r * 2, r);

        ctx.restore();
      }
    }

    ctx.restore();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Render the current grid state at a target resolution and return a PNG blob.
   * Uses the DPR scaling trick: same logical coordinates, more physical pixels.
   * Disables temporal dithering for a clean, stable capture.
   */
  captureHighRes(targetW, targetH) {
    const offCanvas = document.createElement("canvas");
    offCanvas.width = targetW;
    offCanvas.height = targetH;
    const offCtx = offCanvas.getContext("2d");

    // Scale to cover the entire target canvas (no gaps)
    const logicalW =
      this.totalCols * (this.activeConfig.colW || this.activeConfig.font);
    const logicalH =
      this.gridRows * this.activeConfig.font * this.activeConfig.lineH;
    const scale = Math.max(targetW / logicalW, targetH / logicalH);

    // Save engine state
    const savedCanvas = this.canvas;
    const savedCtx = this.ctx;
    const savedDpr = this.dpr;
    const savedBloom = this.bloomCanvas;
    const savedBloomCtx = this.bloomCtx;

    try {
      this.isCapturing = true;

      // Swap to offscreen canvas with scaled transform
      this.canvas = offCanvas;
      this.ctx = offCtx;
      this.dpr = scale;
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
      this.ctx.font = `${this.activeConfig.font}px ${this.activeConfig.fontFamily}`;
      this.ctx.textBaseline = "top";

      // Scaled bloom canvas
      this.bloomCanvas = document.createElement("canvas");
      this.bloomCtx = this.bloomCanvas.getContext("2d");
      this.bloomCanvas.width = Math.ceil(targetW * this.bloomScale);
      this.bloomCanvas.height = Math.ceil(targetH * this.bloomScale);

      // Render current state at target resolution
      const themeColors = getCurrentThemeColors();
      this.renderGrid(themeColors);

      const landingGlow = this.activeConfig.landingGlow ?? 0;
      if (landingGlow > 0 && this.landingGlows.length > 0) {
        this.renderLandingGlows(performance.now(), themeColors);
      }
    } finally {
      // Restore engine state — even if a swap/render step above threw, the
      // live engine must never keep pointing at the dead offscreen canvas.
      this.canvas = savedCanvas;
      this.ctx = savedCtx;
      this.dpr = savedDpr;
      this.bloomCanvas = savedBloom;
      this.bloomCtx = savedBloomCtx;
      this.isCapturing = false;
    }

    return new Promise((resolve) => offCanvas.toBlob(resolve, "image/png"));
  }

  loop = (timestamp) => {
    // Theme colours are cached (refreshColors on every theme change) so the
    // render path never calls getComputedStyle. Fallback only if the cache is
    // somehow unset — refreshColors() always runs in start() before the loop.
    let themeColors = this.themeColors || getCurrentThemeColors();
    // Transient colour pulse: blend toward the pulse colour on a quick-attack /
    // fade envelope, rebuilding the LUT for that frame only. Colour-only (no
    // grid rebuild) and auto-expiring, so it can't disturb the active preset.
    if (this.pulseState) themeColors = this._applyPulse(timestamp, themeColors);
    this.globalTick++;

    // Decay brightness at ~30fps
    if (timestamp - this.lastDecayTime >= DECAY_INTERVAL_MS) {
      this.lastDecayTime = timestamp;
      this.decayGrid();
    }

    // Globally synchronized glyph mutations
    const glyphSyncInterval = this.activeConfig.glyphSyncInterval ?? 6;
    if (this.globalTick % glyphSyncInterval === 0) {
      this.mutateGrid();
    }

    // Stammer: periodically all highlighted heads pause for one frame
    this.stammerCounter++;
    const stammerInterval = this.activeConfig.stammerInterval ?? 90;
    const isStammerFrame = this.stammerCounter >= stammerInterval;
    if (isStammerFrame) {
      this.stammerCounter = 0;
    }

    // Step streams (advance cursors, set brightness in grid)
    // Then update heads (counteract decay, apply flicker)
    const landingGlow = this.activeConfig.landingGlow ?? 0;
    for (const s of this.streams) {
      s.step(this.activeConfig, this.grid, timestamp, isStammerFrame);
      s.updateHead(this.grid, this.globalTick);

      // Collect landing glow burst when a stream head exits the bottom
      if (s.justLanded && !s.del && landingGlow > 0) {
        this.landingGlows.push({
          x:
            s.col * (this.activeConfig.colW || this.activeConfig.font) +
            (this.activeConfig.colW || this.activeConfig.font) / 2,
          intensity: landingGlow,
          radius: this.activeConfig.landingGlowSize ?? 60,
          birth: timestamp,
        });
        s.justLanded = false;
        // Cap array for performance
        if (this.landingGlows.length > 30) this.landingGlows.shift();
      }

    }

    // Render the frame (grid → landing glows → torch veil, in that order)
    this.renderFrame(themeColors, timestamp);

    this.animationId = requestAnimationFrame(this.loop);
  };

  async start() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.stop();
    try {
      const gen = ++this._startGen;
      this.refreshColors();
      this.globalTick = 0;
      this.stammerCounter = 0;
      await this.setup();
      // A newer start() ran while we awaited setup() — let it own the loop.
      if (gen !== this._startGen) return true;

      if (prefersReducedMotion) {
        // setup() already pre-illuminates a full field, so one static
        // renderFrame() reads as paused rain rather than a blank canvas.
        // refreshColors() ran above, so the cached colours are current.
        this.renderFrame(this.themeColors || getCurrentThemeColors());
        return true;
      }
      // setup() already scatters + pre-illuminates a full field. Combined with
      // starting on fonts.ready (main.js), the rain runs behind the loader and is
      // already established/mid-stream when the loader's fade-out reveals it — so
      // there's no startup "burst". No canvas fade needed.
      const now = performance.now();
      this.lastDecayTime = now - DECAY_INTERVAL_MS;
      this.loop(now);
      return true;
    } catch (err) {
      // start() is fire-and-forget from every call site (resize, presets, font
      // switches) — an uncaught rejection here would kill the rain with no
      // trace. Fail loud but recoverable: log, stop cleanly, never throw.
      console.error("RainEngine start failed:", err);
      this.stop();
      return false;
    }
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
    this.torch = false; // reset clears torch/spotlight mode
    this.torchRadiusUser = null; // and its custom radius
    // Factory reset also restores the default (classic) font set so glyphs and
    // fontFamily can't be left desynced by an earlier `rain font` switch.
    const classic = this.fontSets.classic;
    if (classic) {
      this.glyphs = classic.glyphs;
      this.activeConfig.fontFamily = classic.fontFamily;
      this.activeFontSet = "classic";
    }
    this.start();
    return { success: true, message: "Rain reset to defaults." };
  }

  /**
   * Apply a named preset. Presets are self-contained (each carries its full
   * config), so this assigns the config directly — no inheritance from
   * defaultConfig — then rebuilds the grid via start() (which also applies the
   * current theme colours). The "default" preset resets to defaultConfig.
   */
  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset)
      return { success: false, message: `Unknown preset: '${presetName}'.` };

    if (preset.isReset) {
      return this.resetToDefaults();
    }

    if (preset.config) {
      // Presets are self-contained — every preset carries its full config, so
      // use it directly with NO inheritance from defaultConfig (tuning the
      // default can never leak into a preset). Colours come from refreshColors()
      // (theme) and the font set (glyphs + fontFamily) is owned by setFontSet.
      this.activeConfig = { ...preset.config };
      const activeSet = this.fontSets[this.activeFontSet];
      if (activeSet) this.activeConfig.fontFamily = activeSet.fontFamily;
      this.activePresetName = presetName;

      // Presets define structural params (font/density/lineH), so always
      // rebuild the grid; start() also applies the theme colours.
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

  /**
   * Trigger a transient colour pulse: the rain blends toward `colors` on a
   * quick attack, then fades back to the theme over `durationMs`. Colour-only
   * (no grid rebuild), so it never disturbs the active preset; a no-op if the
   * loop is stopped (reduced motion). Used by the easter eggs and theme switch.
   * @param {{background?:string, primary?:string, glow?:string}} colors
   * @param {number} [durationMs=2600]
   */
  pulse(colors, durationMs = 2600) {
    if (!colors) return;
    this.pulseState = {
      colors,
      start: performance.now(),
      duration: durationMs,
    };
  }

  /** Per-frame: fold the active pulse into the theme colours + LUT. Returns the
   *  effective colours to render this frame; clears the pulse when it expires. */
  _applyPulse(timestamp, base) {
    const ps = this.pulseState;
    const elapsed = timestamp - ps.start;
    if (elapsed >= ps.duration) {
      this.pulseState = null;
      this._buildColorLUT(base); // restore the base palette
      return base;
    }
    const p = elapsed / ps.duration;
    const k = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88; // attack, then fade
    const eff = this._blendColors(base, ps.colors, k);
    this._buildColorLUT(eff);
    return eff;
  }

  /** Lerp {background,primary,glow} from `base` toward `target` by `k` (0..1).
   *  Keys absent from `target` pass through unchanged. */
  _blendColors(base, target, k) {
    const out = { ...base };
    for (const key of ["background", "primary", "glow"]) {
      if (!target[key]) continue;
      const a = parseColorRGB(base[key], { r: 0, g: 0, b: 0 });
      const b = parseColorRGB(target[key], a);
      out[key] = rgbToHex(
        a.r + (b.r - a.r) * k,
        a.g + (b.g - a.g) * k,
        a.b + (b.b - a.b) * k,
      );
    }
    return out;
  }

  refreshColors() {
    const themeColors = getCurrentThemeColors();
    // Cache the resolved colours so the render path (loop/renderGrid) never
    // re-reads getComputedStyle; this is the only place they're refreshed.
    this.themeColors = themeColors;
    this.activeConfig.baseCol = themeColors.primary;
    this.activeConfig.headCol = themeColors.glow;
    this._buildColorLUT(themeColors);
  }

  /**
   * Rebuild the brightness→colour LUT for the current theme. Called only on
   * palette change (refreshColors / theme apply), never per frame, so the
   * render loop stays allocation-free.
   *
   * No per-theme palette is authored yet, so the palette is DERIVED from the
   * theme's existing colours: a gradient from the background at brightness 0,
   * through the primary trail colour, up into the glow band, ending in a white
   * cursor at the head (clamped flat for brightness >= ~0.85). This reproduces
   * the previous three-band mapping (primary → glow → white) as a smooth ramp.
   * A future explicit `palette` in the theme registry would replace these stops.
   */
  _buildColorLUT(themeColors) {
    const bg = parseColorRGB(themeColors.background, { r: 0, g: 0, b: 0 });
    const primary = parseColorRGB(themeColors.primary, { r: 0, g: 255, b: 0 });
    const glow = parseColorRGB(themeColors.glow, { r: 159, g: 255, b: 159 });
    const cursor = { r: 255, g: 255, b: 255 }; // white head

    // Ordered stops (ascending `at`). Positions mirror the old bands: primary
    // owns the low-mid trail, glow the upper-mid, white the head from ~0.85 up.
    this.colorLUT = buildLUT([
      { at: 0.0, c: bg },
      { at: 0.08, c: primary },
      { at: 0.5, c: glow },
      { at: 0.85, c: cursor },
    ]);
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
