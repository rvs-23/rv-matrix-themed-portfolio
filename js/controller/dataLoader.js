/**
 * @file dataLoader.js
 * Handles fetching all necessary JSON configuration and asset data.
 */

import * as config from "../config/index.js";

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
  // This ensures the path is always correct in both development and production.
  const baseUrl = import.meta.env.BASE_URL;
  const [rainConfig, skillsAsset, hobbiesAsset, manPagesAsset] =
    await Promise.all([
      fetchJson(`${baseUrl}config/rain.json`, "rain.json (public)"),
      fetchJson(`${baseUrl}config/content/skills.json`, "skills.json (public)"),
      fetchJson(`${baseUrl}config/content/hobbies.json`, "hobbies.json (public)"),
      fetchJson(`${baseUrl}config/content/manPages.json`, "manPages.json (public)"),
    ]);

  return {
    config,
    rainConfig: rainConfig || {},
    skillsData: skillsAsset || {},
    hobbiesData: hobbiesAsset || {},
    manPages: manPagesAsset || {},
  };
}
