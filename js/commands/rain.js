/**
 * @file js/commands/rain.js
 * Umbrella command for all rain customization.
 * Subcommands: preset, font, size, gravity, glyphspeed
 */

import { escapeHtml } from "../utils.js";

const GRAVITY_LEVELS = {
  moon:    { value: 0.15, desc: "Gentle drift — barely noticeable acceleration." },
  earth:   { value: 0.4,  desc: "Natural pull — streams visibly pick up speed." },
  jupiter: { value: 0.75, desc: "Heavy pull — streams crawl at top, race at bottom." },
};

export default function rainCommand(args, context) {
  const { appendToTerminal, rainEngine, config } = context;

  if (!rainEngine) {
    appendToTerminal("<div class='output-error'>Rain engine not available.</div>");
    return;
  }

  if (!args || args.length === 0) {
    _showOverview(appendToTerminal, rainEngine);
    return;
  }

  const sub = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (sub) {
    case "preset":  return _preset(subArgs, appendToTerminal, rainEngine, config);
    case "font":    return _font(subArgs, appendToTerminal, rainEngine, config);
    case "size":    return _size(subArgs, appendToTerminal, rainEngine);
    case "gravity": return _gravity(subArgs, appendToTerminal, rainEngine);
    case "glyphspeed": return _glyphspeed(subArgs, appendToTerminal, rainEngine);
    default:
      appendToTerminal(
        `<div class='output-error'>Unknown subcommand '${escapeHtml(sub)}'. Type 'rain' for usage.</div>`,
      );
  }
}

function _showOverview(appendToTerminal, rainEngine) {
  const cfg = rainEngine.activeConfig;
  const gravVal = cfg.gravityAccel ?? 0;
  const gravLabel = Object.entries(GRAVITY_LEVELS).find(([, l]) => Math.abs(l.value - gravVal) < 0.01)?.[0] || (gravVal > 0 ? gravVal : "off");

  let output =
    `<div class="output-section-title section-title-plain"><i class="fas fa-cloud-rain icon-inline"></i> RAIN CONFIG</div>` +
    `<div class="output-section">` +
    `<div><span class="output-line-label">Preset:</span> ${rainEngine.activePresetName}</div>` +
    `<div><span class="output-line-label">Font:</span> ${rainEngine.activeFontSet}</div>` +
    `<div><span class="output-line-label">Size:</span> ${cfg.font}px</div>` +
    `<div><span class="output-line-label">Gravity:</span> ${gravLabel}</div>` +
    `<div><span class="output-line-label">Glyph cycle:</span> every ${cfg.glyphSyncInterval ?? 6} frames</div>` +
    `</div>` +
    `<div class="mt-section output-text-small">` +
    `rain preset &lt;name&gt; &middot; rain font &lt;name&gt; &middot; rain size &lt;px&gt; &middot; rain gravity &lt;level&gt; &middot; rain glyphspeed &lt;1-30&gt;` +
    `</div>`;
  appendToTerminal(output);
}

/* ── preset ─────────────────────────────────────────────────────────── */

function _preset(args, appendToTerminal, rainEngine, config) {
  const messages = config.rainpreset.messages;
  const presets = rainEngine.presets || {};

  if (args.length === 0) {
    const presetKeys = Object.keys(presets);
    if (presetKeys.length === 0) {
      appendToTerminal(`<div>${messages.no_presets}</div>`);
      return;
    }
    let output = `<div class='output-error'>Usage: rain preset &lt;name&gt;</div>`;
    output += `<div>Current: <span class='output-success'>${rainEngine.activePresetName}</span></div>`;
    for (const key of presetKeys) {
      const marker = key === rainEngine.activePresetName ? " ◄" : "";
      output += `<div>  ${key} — ${presets[key].description || ""}${marker}</div>`;
    }
    appendToTerminal(output);
    return;
  }

  const presetName = args[0].toLowerCase();
  const presetData = presets[presetName];

  if (!presetData) {
    return appendToTerminal(
      `<div class='output-error'>${messages.unknown_preset(escapeHtml(presetName))}</div>`,
    );
  }

  if (!presetData.isReset) {
    appendToTerminal(
      `<div>${messages.applying(presetName, presetData.description || "")}</div>`,
    );
  }

  const result = rainEngine.applyPreset(presetName);
  const cls = result.success ? "output-success" : "output-error";
  appendToTerminal(`<div class='${cls}'>${result.message}</div>`);
  if (result.success) {
    try { localStorage.setItem("rv_preset", presetName); } catch { /* storage unavailable */ }
  }
}

/* ── font ───────────────────────────────────────────────────────────── */

function _font(args, appendToTerminal, rainEngine, config) {
  const messages = config.rainfont.messages;
  const fontSets = rainEngine.fontSets || {};
  const fontSetNames = Object.keys(fontSets);

  if (args.length === 0) {
    let output = `<div class='output-error'>Usage: rain font &lt;name&gt;</div>`;
    output += `<div>Current: <span class='output-success'>${rainEngine.activeFontSet}</span></div>`;
    for (const name of fontSetNames) {
      const marker = name === rainEngine.activeFontSet ? " ◄" : "";
      output += `<div>  ${name} — ${fontSets[name].description}${marker}</div>`;
    }
    appendToTerminal(output);
    return;
  }

  const name = args[0].toLowerCase();

  if (!fontSets[name]) {
    appendToTerminal(
      `<div class='output-error'>${messages.unknown(escapeHtml(name))}</div>` +
        `<div>Available: ${fontSetNames.join(", ")}</div>`,
    );
    return;
  }

  const result = rainEngine.setFontSet(name);
  const cls = result.success ? "output-success" : "output-error";
  appendToTerminal(`<div class='${cls}'>${result.message}</div>`);
}

/* ── size ───────────────────────────────────────────────────────────── */

function _size(args, appendToTerminal, rainEngine) {
  if (args.length === 0) {
    const current = rainEngine.activeConfig.font;
    appendToTerminal(
      `<div class='output-error'>Usage: rain size &lt;px&gt; | reset</div>` +
        `<div>Current: ${current}px (valid range: 8–40)</div>`,
    );
    return;
  }

  const input = args[0].toLowerCase();

  if (input === "reset") {
    const defaultSize = rainEngine.defaultConfig.font;
    rainEngine.updateParameter("font", defaultSize);
    rainEngine.start();
    appendToTerminal(
      `<div class='output-success'>Rain size reset to ${defaultSize}px.</div>`,
    );
    return;
  }

  const size = parseInt(input, 10);
  if (Number.isNaN(size) || size < 8 || size > 40) {
    appendToTerminal(
      `<div class='output-error'>Invalid size. Must be 8–40 (px).</div>`,
    );
    return;
  }

  rainEngine.updateParameter("font", size);
  rainEngine.start();
  appendToTerminal(
    `<div class='output-success'>Rain glyph size set to ${size}px.</div>`,
  );
}

/* ── gravity ─────────────────────────────────────────────────────────── */

function _gravity(args, appendToTerminal, rainEngine) {
  const current = rainEngine.activeConfig.gravityAccel ?? 0;

  if (args.length === 0) {
    const label = Object.entries(GRAVITY_LEVELS).find(([, l]) => Math.abs(l.value - current) < 0.01)?.[0];
    const status = current > 0
      ? `<span class="output-success">on</span> (${label || current})`
      : `<span class="output-error">off</span>`;
    let output = `<div>Gravity: ${status}</div>`;
    for (const [name, level] of Object.entries(GRAVITY_LEVELS)) {
      const marker = label === name ? " ◄" : "";
      output += `<div>  ${name} (${level.value}) — ${level.desc}${marker}</div>`;
    }
    output += "<div class='output-text-small'>Usage: rain gravity &lt;off|moon|earth|jupiter&gt;</div>";
    appendToTerminal(output);
    return;
  }

  const input = args[0].toLowerCase();

  if (input === "off") {
    rainEngine.activeConfig.gravityAccel = 0;
    appendToTerminal("<div class='output-success'>Gravity disabled.</div>");
    return;
  }

  const level = GRAVITY_LEVELS[input];
  if (level) {
    rainEngine.activeConfig.gravityAccel = level.value;
    appendToTerminal(
      `<div class='output-success'>Gravity: ${input}. ${level.desc}</div>`,
    );
    return;
  }

  appendToTerminal(
    "<div class='output-error'>Unknown level. Available: off, moon, earth, jupiter.</div>",
  );
}

/* ── glyphspeed ──────────────────────────────────────────────────────── */

function _glyphspeed(args, appendToTerminal, rainEngine) {
  const currentSync = rainEngine.activeConfig.glyphSyncInterval ?? 6;
  const currentMut = rainEngine.activeConfig.mutationChance ?? 0.03;

  if (args.length === 0) {
    appendToTerminal(
      `<div>Glyph cycle: every <span class="output-success">${currentSync}</span> frames (mutation: ${(currentMut * 100).toFixed(1)}%)</div>` +
      "<div class='output-text-small'>Usage: rain glyphspeed &lt;1–30|reset&gt;</div>",
    );
    return;
  }

  const input = args[0].toLowerCase();

  if (input === "reset") {
    rainEngine.activeConfig.glyphSyncInterval = 6;
    rainEngine.activeConfig.mutationChance = 0.03;
    appendToTerminal("<div class='output-success'>Glyph speed reset to defaults.</div>");
    return;
  }

  const value = parseInt(input, 10);
  if (isNaN(value) || value < 1 || value > 30) {
    appendToTerminal("<div class='output-error'>Value must be 1–30, or 'reset'.</div>");
    return;
  }

  rainEngine.activeConfig.glyphSyncInterval = value;
  const mutChance = Math.max(0.005, 0.06 / Math.sqrt(value));
  rainEngine.activeConfig.mutationChance = mutChance;

  const feel = value <= 3 ? "Rapid churn." : value <= 8 ? "Default pace." : value <= 15 ? "Deliberate, steady." : "Near-frozen glyphs.";
  appendToTerminal(
    `<div class='output-success'>Glyph cycle: every ${value} frames. ${feel}</div>`,
  );
}
