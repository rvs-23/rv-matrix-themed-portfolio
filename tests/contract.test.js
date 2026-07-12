/**
 * @file tests/contract.test.js
 * Contract smoke test: boots the real command registry and config files and
 * asserts the cross-file contracts that have historically drifted (missing
 * man pages, help entries, preset shape, completion lists). Pure Node — no
 * DOM, no rendering; the visual side is covered by preview verification.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getAllCommands, HIDDEN_COMMANDS } from "../js/commands/0_index.js";
import { MAN_ALIASES } from "../js/commands/man.js";
import { GRAVITY_LEVELS, RAIN_SUBCOMMANDS } from "../js/commands/rain.js";
import { help, themes } from "../js/config/index.js";
import { getArgumentSuggestions } from "../js/controller/terminalController.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const rainJson = JSON.parse(read("../public/config/rain.json"));
const manPages = JSON.parse(read("../public/config/content/manPages.json"));
const themesCss = read("../css/themes.css");
const rainJsSource = read("../js/commands/rain.js");

const commands = getAllCommands();
const commandNames = Object.keys(commands);
const visibleCommands = commandNames.filter((c) => !HIDDEN_COMMANDS.has(c));

describe("command registry ↔ man pages", () => {
  it("every visible command has a man page (directly or via alias)", () => {
    const missing = visibleCommands.filter(
      (cmd) => !(cmd in manPages) && !(MAN_ALIASES[cmd] in manPages),
    );
    expect(missing).toEqual([]);
  });

  it("every man alias points at a registered command with a man page", () => {
    for (const [alias, target] of Object.entries(MAN_ALIASES)) {
      expect(commandNames).toContain(alias);
      expect(manPages).toHaveProperty(target);
    }
  });

  it("every man page documents a registered command", () => {
    const orphans = Object.keys(manPages).filter((page) => !(page in commands));
    expect(orphans).toEqual([]);
  });
});

describe("command registry ↔ help", () => {
  const helpBaseCmds = help.commandList.map((e) => e.cmd.split(" ")[0]);

  it("every help entry maps to a registered command", () => {
    const unknown = helpBaseCmds.filter((cmd) => !(cmd in commands));
    expect(unknown).toEqual([]);
  });

  it("every visible command appears in help (aliases exempt)", () => {
    const aliasKeys = Object.keys(MAN_ALIASES);
    const missing = visibleCommands.filter(
      (cmd) => !helpBaseCmds.includes(cmd) && !aliasKeys.includes(cmd),
    );
    expect(missing).toEqual([]);
  });

  it("no hidden command leaks into help", () => {
    const leaked = helpBaseCmds.filter((cmd) => HIDDEN_COMMANDS.has(cmd));
    expect(leaked).toEqual([]);
  });

  it("every hidden command actually exists in the registry", () => {
    // A typo'd name in HIDDEN_COMMANDS would silently exclude nothing.
    const phantom = [...HIDDEN_COMMANDS].filter((cmd) => !(cmd in commands));
    expect(phantom).toEqual([]);
  });
});

describe("rain.json shape", () => {
  const { defaultConfig, presets, fontSets, validationRules } = rainJson;
  // Colours and font family are engine/theme-owned at runtime; presets and
  // validation rules must not carry them (the v1.1.0 preset-desync bug class).
  const engineOwned = ["baseCol", "headCol", "fontFamily"];
  const knownKeys = new Set([...Object.keys(defaultConfig), "gravityAccel"]);

  it("every preset's layerOp length matches its layers", () => {
    for (const [name, preset] of Object.entries(presets)) {
      const cfg = preset.config ?? {};
      if (typeof cfg.layers === "number" && Array.isArray(cfg.layerOp)) {
        expect(cfg.layerOp.length, `preset ${name}`).toBe(cfg.layers);
      }
    }
  });

  it("presets only use known keys and never engine-owned ones", () => {
    for (const [name, preset] of Object.entries(presets)) {
      const keys = Object.keys(preset.config ?? {});
      const unknown = keys.filter((k) => !knownKeys.has(k));
      expect(unknown, `preset ${name} unknown keys`).toEqual([]);
      const owned = keys.filter((k) => engineOwned.includes(k));
      expect(owned, `preset ${name} engine-owned keys`).toEqual([]);
    }
  });

  it("every tunable defaultConfig key has a validation rule", () => {
    const tunable = Object.keys(defaultConfig).filter(
      (k) => !engineOwned.includes(k),
    );
    const uncovered = tunable.filter((k) => !(k in validationRules));
    expect(uncovered).toEqual([]);
  });

  it("every font set has glyphs and a font family", () => {
    for (const [name, set] of Object.entries(fontSets)) {
      expect(set.glyphs?.length, `fontSet ${name} glyphs`).toBeGreaterThan(0);
      expect(set.fontFamily?.length, `fontSet ${name} fontFamily`).toBeGreaterThan(0);
    }
  });

  it("the font sets the code references exist", () => {
    // classic = engine default (constructor + resetToDefaults);
    // combined/resurrections = documented `rain font` options.
    for (const name of ["classic", "combined", "resurrections"]) {
      expect(fontSets).toHaveProperty(name);
    }
  });
});

describe("theme registry ↔ themes.css", () => {
  it("every registered theme has a body.theme-<name> selector", () => {
    const missing = Object.keys(themes).filter(
      (name) => !themesCss.includes(`body.theme-${name}`),
    );
    expect(missing).toEqual([]);
  });

  it("help.availableThemes derives from the registry", () => {
    expect([...help.availableThemes].sort()).toEqual(Object.keys(themes).sort());
  });
});

describe("tab-completion contracts", () => {
  const context = {
    config: { help },
    rainEngine: { presets: rainJson.presets, fontSets: rainJson.fontSets },
    manPages,
  };

  it("RAIN_SUBCOMMANDS matches the switch cases in rain.js", () => {
    const cases = [...rainJsSource.matchAll(/case "(\w+)":/g)].map((m) => m[1]);
    expect(new Set(cases)).toEqual(new Set(RAIN_SUBCOMMANDS));
  });

  it("'rain ' completes subcommands; 'rain preset ' completes preset names", () => {
    expect(getArgumentSuggestions("rain", context, "rain ")).toEqual(
      RAIN_SUBCOMMANDS,
    );
    expect(getArgumentSuggestions("rain", context, "rain preset ")).toEqual(
      Object.keys(rainJson.presets).sort(),
    );
  });

  it("gravity completion derives from GRAVITY_LEVELS", () => {
    expect(getArgumentSuggestions("rain", context, "rain gravity ")).toEqual([
      "off",
      ...Object.keys(GRAVITY_LEVELS),
    ]);
  });

  it("mid-word arg input still yields the full candidate list (filtering happens at apply)", () => {
    expect(getArgumentSuggestions("rain", context, "rain preset c")).toEqual(
      Object.keys(rainJson.presets).sort(),
    );
    expect(getArgumentSuggestions("download", context, "download c")).toEqual(["cv"]);
  });
});
