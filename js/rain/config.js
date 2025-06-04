/**
 * @file config.js (for rain)
 * Holds and manages the active configuration for the Matrix rain effect.
 */

let activeRainConfig = {};
let defaultRainConfig = {};
let rainGlyphs = "";
let rainPresets = {};

export function initializeRainConfig(loadedRainConfig) {
  defaultRainConfig = loadedRainConfig.defaultConfig || {
    speed: 100,
    font: 15,
    baseCol: "#0F0",
    headCol: "#FFF",
    fontFamily: "monospace",
    layers: 1,
    layerOp: [1],
    density: 0.7,
    minTrail: 10,
    maxTrail: 30,
    headGlowMin: 1,
    headGlowMax: 5,
    blur: 0,
    trailMutate: 150,
    fade: 0.1,
    decayBase: 0.9,
    delChance: 0,
  };
  rainGlyphs = loadedRainConfig.glyphs || "01";
  rainPresets = loadedRainConfig.presets || {};
  activeRainConfig = { ...defaultRainConfig };
  console.log("Rain configuration initialized.", activeRainConfig);
}

export function getActiveRainConfig() {
  return { ...activeRainConfig };
}

export function getDefaultRainConfig() {
  return { ...defaultRainConfig };
}

export function getRainGlyphs() {
  return rainGlyphs;
}

export function getRainPresets() {
  return rainPresets;
}

export function setActiveRainColors(baseColor, headColor) {
  if (baseColor && typeof baseColor === "string") {
    activeRainConfig.baseCol = baseColor;
  }
  if (headColor && typeof headColor === "string") {
    activeRainConfig.headCol = headColor;
  }
  console.log(
    `Rain colors updated in active config: base=${activeRainConfig.baseCol}, head=${activeRainConfig.headCol}`,
  );
}

export function updateRainConfigParameter(
  param,
  value,
  applyingPresetContext = null,
) {
  const MAPPINGS = {
    speed: { key: "speed", type: "int", min: 10, max: 500 },
    font: { key: "font", type: "int", min: 8, max: 40 },
    lineH: { key: "lineH", type: "float", min: 0.5, max: 2.0 },
    density: { key: "density", type: "float", min: 0.1, max: 2.0 },
    minTrail: { key: "minTrail", type: "int", min: 1, max: 100 },
    maxTrail: { key: "maxTrail", type: "int", min: 1, max: 100 },
    headGlowMin: { key: "headGlowMin", type: "int", min: 0, max: 20 },
    headGlowMax: { key: "headGlowMax", type: "int", min: 0, max: 20 },
    blur: { key: "blur", type: "int", min: 0, max: 20 },
    trailMutate: { key: "trailMutate", type: "int", min: 10, max: 1000 },
    fade: { key: "fade", type: "float", min: 0.01, max: 1.0 },
    decayBase: { key: "decayBase", type: "float", min: 0.7, max: 0.99 },
    fontFamily: { key: "fontFamily", type: "string_font" },
    layers: { key: "layers", type: "int", min: 1, max: 10 },
    layerOp: { key: "layerOp", type: "array_float", ele_min: 0, ele_max: 1 },
    delChance: { key: "delChance", type: "float", min: 0, max: 1 },
  };

  const setting = MAPPINGS[param];

  if (!setting) {
    // FIX 3.2 (Related to rainpreset): Handle baseCol and headCol for presets
    if (param === "baseCol" || param === "headCol") {
      if (
        typeof value === "string" &&
        (value.startsWith("#") || value.startsWith("rgb"))
      ) {
        // Basic validation
        activeRainConfig[param] = value;
        console.log(`Rain config updated directly: ${param} = ${value}`);
        return true;
      } else {
        console.warn(`RainConfig: Invalid color value for ${param}: ${value}`);
        return false;
      }
    }
    console.warn(`RainConfig: Unknown parameter '${param}' during update.`);
    return false;
  }

  let parsedValue = value;
  let isValid = true;

  switch (setting.type) {
    case "int":
      parsedValue = parseInt(value, 10);
      if (
        isNaN(parsedValue) ||
        (setting.min !== undefined && parsedValue < setting.min) ||
        (setting.max !== undefined && parsedValue > setting.max)
      )
        isValid = false;
      break;
    case "float":
      parsedValue = parseFloat(value);
      if (
        isNaN(parsedValue) ||
        (setting.min !== undefined && parsedValue < setting.min) ||
        (setting.max !== undefined && parsedValue > setting.max)
      )
        isValid = false;
      break;
    case "string_font":
      parsedValue = String(value).trim();
      if (!/^[a-zA-Z0-9\s,-]+$/.test(parsedValue)) isValid = false;
      break;
    case "array_float":
      parsedValue = Array.isArray(value)
        ? value.map(Number).filter((n) => !isNaN(n))
        : [];
      if (
        setting.key === "layerOp" &&
        parsedValue.length !==
          (applyingPresetContext?.layers ?? activeRainConfig.layers)
      ) {
        console.warn(
          `RainConfig: LayerOp length mismatch. Expected ${applyingPresetContext?.layers ?? activeRainConfig.layers}, got ${parsedValue.length}`,
        );
        isValid = false;
      } else {
        for (const item of parsedValue) {
          if (
            typeof item !== "number" ||
            item < (setting.ele_min || 0) ||
            item > (setting.ele_max || 1)
          ) {
            isValid = false;
            break;
          }
        }
      }
      break;
    default:
      isValid = false; // Should not happen if MAPPINGS are complete
      break;
  }

  if (!isValid) {
    console.warn(
      `RainConfig: Invalid value for ${param}: '${value}'. Check type, range, or format.`,
    );
    return false;
  }

  // Validation for min/max trail and headGlow
  if (
    setting.key === "minTrail" &&
    parsedValue > (applyingPresetContext?.maxTrail ?? activeRainConfig.maxTrail)
  )
    isValid = false;
  if (
    setting.key === "maxTrail" &&
    parsedValue < (applyingPresetContext?.minTrail ?? activeRainConfig.minTrail)
  )
    isValid = false;
  if (
    setting.key === "headGlowMin" &&
    parsedValue >
      (applyingPresetContext?.headGlowMax ?? activeRainConfig.headGlowMax)
  )
    isValid = false;
  if (
    setting.key === "headGlowMax" &&
    parsedValue <
      (applyingPresetContext?.headGlowMin ?? activeRainConfig.headGlowMin)
  )
    isValid = false;

  if (!isValid) {
    console.warn(
      `RainConfig: Validation failed for ${param} (e.g. minTrail > maxTrail). Value: '${value}'`,
    );
    return false;
  }

  activeRainConfig[setting.key] = parsedValue;
  // console.log(`Rain config updated via parameter: ${param} = ${parsedValue}`);
  return true;
}

export function resetRainConfigToActiveDefaults() {
  activeRainConfig = { ...defaultRainConfig };
  console.log(
    "Rain configuration reset to loaded defaults (from config/rain.json).",
  );
}
