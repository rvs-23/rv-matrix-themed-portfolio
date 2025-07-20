/**
 * @file dataLoader.js
 * Handles fetching all necessary JSON configuration and asset data.
 */

async function fetchJson(url, fileNameForError) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // More specific error for rain.json
      if (fileNameForError.includes("rain.json")) {
        console.error(
          `CRITICAL ERROR: Failed to fetch ${fileNameForError}: ${response.status} ${response.statusText}. Rain presets and default rain configuration will be missing or incorrect. This will affect 'rainpreset' command and rain appearance.`,
        );
      } else {
        console.warn(
          `Warning: Failed to fetch ${fileNameForError}: ${response.status} ${response.statusText}. Some features might not work as expected.`,
        );
      }
      return null;
    }
    try {
      const jsonData = await response.json();
      console.log(`${fileNameForError} loaded successfully.`);
      return jsonData;
    } catch (e) {
      if (fileNameForError.includes("rain.json")) {
        console.error(
          `CRITICAL ERROR: Invalid JSON in ${fileNameForError}: ${e.message}. Rain presets and defaults will be affected.`,
        );
      } else {
        console.warn(
          `Warning: Invalid JSON in ${fileNameForError}: ${e.message}. Please check the file.`,
        );
      }
      return null;
    }
  } catch (error) {
    if (fileNameForError.includes("rain.json")) {
      console.error(
        `CRITICAL ERROR: Network error fetching ${fileNameForError}: ${error.message}. Rain presets and defaults will be affected.`,
      );
    } else {
      console.warn(
        `Warning: Error fetching ${fileNameForError}: ${error.message}.`,
      );
    }
    return null;
  }
}

export async function loadAllData() {
  const [
    userConfig,
    terminalConfig,
    rainConfig, 
    skillsAsset,
    hobbiesAsset,
    manPagesAsset,
    easterEggAsset
  ] = await Promise.all([
    fetchJson("js/controller/userConfig.json", "userConfig.json", true),
    fetchJson("js/controller/terminalConfig.json", "terminalConfig.json", true),
    fetchJson("js/rain/rainConfig.json", "rainConfig.json", true), // Critical for presets
    fetchJson("config/skills.json", "skills.json (config)"),
    fetchJson("config/hobbies.json", "hobbies.json (config)"),
    fetchJson("config/manPages.json", "manPages.json (config)"),
    fetchJson("config/easterEgg.json", "easterEgg.json (config)"),
  ]);

  if (!userConfig)
    console.error("CRITICAL WARNING: user.json (config) failed to load.");
  if (!terminalConfig)
    console.error("CRITICAL WARNING: terminal.json (config) failed to load.");
  // The specific error for rainConfig is now handled inside fetchJson if it's critical

  return {
    userConfig: userConfig || {},
    terminalConfig: terminalConfig || {},
    // Fallback for rainConfig ensures presets is at least an empty object if loading fails
    rainConfig: rainConfig || {
      defaultConfig: {
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
      },
      glyphs: "01",
      presets: {},
    },
    skillsData: skillsAsset || { name: "Skills (Error Loading)", children: [] },
    hobbiesData: hobbiesAsset || {
      name: "Hobbies (Error Loading)",
      children: [],
    },
    manPages: manPagesAsset || {},
    easterEggData: easterEggAsset || { quotes: [] },
  };
}
