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
    if (timestamp - this.lastUpdate < this.baseSpeed * wobble) return false;
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

    /** Active landing glow bursts at canvas bottom. */
    this.landingGlows = [];

    /** True during high-res capture — disables temporal dithering. */
    this.isCapturing = false;

    /** Interactive rain: click burst enabled by default. */
    this.interactBurst = true;
    this.clickBursts = [];

    this._resizeTimeout = null;
    this._handleResize = this._handleResize.bind(this);
    this._handleClick = this._handleClick.bind(this);
    window.addEventListener("resize", this._handleResize, { passive: true });

    if (this.canvas) {
      this.canvas.addEventListener("click", this._handleClick);
    }
  }

  destroy() {
    window.removeEventListener("resize", this._handleResize);
    if (this.canvas) {
      this.canvas.removeEventListener("click", this._handleClick);
    }
    this.stop();
  }

  _handleClick(e) {
    if (!this.interactBurst) return;
    e.preventDefault();
    // Organic burst: slight randomness in intensity and radius
    this.clickBursts.push({
      x: e.clientX,
      y: e.clientY,
      birth: performance.now(),
      intensity: 0.7 + Math.random() * 0.3,
      radius: 70 + Math.random() * 40,
    });
    if (this.clickBursts.length > 8) this.clickBursts.shift();
  }

  /** Get burst interaction state. */
  getInteract() {
    return { burst: this.interactBurst };
  }

  /** Enable or disable burst interaction. */
  setInteract(effect, enabled) {
    this.interactBurst = enabled;
    if (!enabled) this.clickBursts = [];
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

  /** Decay all grid cell brightnesses toward a dim floor (never fully black). */
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
          if (cell.brightness < 0.08 && cell.brightness > floorThreshold && Math.random() < 0.04) {
            cell.brightness = floor;
            continue;
          }
          if (cell.brightness < floorThreshold) cell.brightness = floor;
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
   * Color mapping:
   *  [0.85, 1.0] → white          (head)
   *  [0.2, 0.85) → headCol/glow   (neon glow region)
   *  (0.01, 0.2) → baseCol        (trail body)
   *  ≤ 0.01       → skip          (black / not drawn)
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

        let color, alpha;

        if (b >= 0.85) {
          color = "#ffffff";
          alpha = 1.0;
        } else if (b >= 0.2) {
          color = CFG.headCol;
          alpha = 0.7 + ((b - 0.2) / 0.65) * 0.3;
        } else if (b > 0.01) {
          color = CFG.baseCol;
          alpha = Math.min(1.0, b * 4.0);
        } else {
          continue;
        }

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
   * Click bursts: organic brightness wave that expands outward from click.
   * Longer duration (800ms), ease-out decay, per-cell jitter for natural feel.
   */
  _applyClickBursts(timestamp) {
    const CFG = this.activeConfig;
    const colW = CFG.colW || CFG.font;
    const lineH = CFG.font * CFG.lineH;
    const DURATION = 800;

    for (let i = this.clickBursts.length - 1; i >= 0; i--) {
      const burst = this.clickBursts[i];
      const age = timestamp - burst.birth;
      if (age > DURATION) {
        this.clickBursts.splice(i, 1);
        continue;
      }

      const t = age / DURATION;
      // Ease-out cubic decay — fast bright start, slow fade
      const decay = 1 - t * t * t;
      // Radius expands outward as burst ages (wave front)
      const innerRadius = burst.radius * t * 0.6;
      const outerRadius = burst.radius * (0.4 + t * 0.6);
      const burstCol = Math.floor(burst.x / colW);
      const burstRow = Math.floor(burst.y / lineH);
      const colRadius = Math.ceil(outerRadius / colW);
      const rowRadius = Math.ceil(outerRadius / lineH);

      for (let c = burstCol - colRadius; c <= burstCol + colRadius; c++) {
        if (c < 0 || c >= this.totalCols) continue;
        for (let r = burstRow - rowRadius; r <= burstRow + rowRadius; r++) {
          if (r < 0 || r >= this.gridRows) continue;
          const dx = (c - burstCol) * colW;
          const dy = (r - burstRow) * lineH;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > outerRadius) continue;

          // Ring-shaped wave: strongest between inner and outer radius
          let wave;
          if (dist < innerRadius) {
            wave = 0.2; // Faint residual glow inside the ring
          } else {
            const ringPos = (dist - innerRadius) / (outerRadius - innerRadius);
            // Bell-curve peaking at ring center
            wave = Math.exp(-8 * (ringPos - 0.4) * (ringPos - 0.4));
          }

          // Per-cell jitter: hash from position for stable randomness
          const jitter = 0.7 + ((c * 7 + r * 13) % 17) / 17 * 0.6;
          const boost = burst.intensity * decay * wave * jitter * 0.5;
          this.grid[c][r].brightness = Math.min(
            1.0,
            this.grid[c][r].brightness + boost,
          );
        }
      }
    }
  }

  /**
   * Render radial glow overlay for click bursts (additive blend).
   * Expands outward as a soft ring rather than a solid circle.
   */
  _renderClickBursts(timestamp, themeColors) {
    const ctx = this.ctx;
    const DURATION = 800;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = this.clickBursts.length - 1; i >= 0; i--) {
      const burst = this.clickBursts[i];
      const age = timestamp - burst.birth;
      if (age > DURATION) continue;

      const t = age / DURATION;
      const decay = 1 - t * t * t;
      const r = burst.radius * (0.4 + t * 0.6);
      const alpha = burst.intensity * decay * 0.1;
      if (alpha < 0.003) continue;

      const grad = ctx.createRadialGradient(burst.x, burst.y, r * 0.3, burst.x, burst.y, r);
      grad.addColorStop(0, themeColors.primary);
      grad.addColorStop(0.5, themeColors.glow);
      grad.addColorStop(1, "transparent");

      ctx.globalAlpha = alpha;
      ctx.fillStyle = grad;
      ctx.fillRect(burst.x - r, burst.y - r, r * 2, r * 2);
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
    this.isCapturing = true;

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

    // Restore engine state
    this.canvas = savedCanvas;
    this.ctx = savedCtx;
    this.dpr = savedDpr;
    this.bloomCanvas = savedBloom;
    this.bloomCtx = savedBloomCtx;
    this.isCapturing = false;

    return new Promise((resolve) => offCanvas.toBlob(resolve, "image/png"));
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

    // Interactive effects: modify grid before render
    if (this.interactBurst && this.clickBursts.length > 0) {
      this._applyClickBursts(timestamp);
    }

    // Render entire grid
    this.renderGrid(themeColors);

    // Render landing glow bursts at canvas bottom
    if (landingGlow > 0 && this.landingGlows.length > 0) {
      this.renderLandingGlows(timestamp, themeColors);
    }

    // Render click burst glow overlay
    if (this.interactBurst && this.clickBursts.length > 0) {
      this._renderClickBursts(timestamp, themeColors);
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

      // Reset to defaults first so no stale values leak between presets
      this.activeConfig = { ...this.defaultConfig };
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
