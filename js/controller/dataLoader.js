// @ts-check
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
          `CRITICAL ERROR: Failed to fetch ${fileNameForError}: ${response.status} ${response.statusText}. Rain presets and default rain configuration will be missing or incorrect. This will affect the 'rain' command and rain appearance.`,
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
      /* data loaded */
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

/**
 * The paper site's index (/config/content/paper.json) only exists when the
 * build published it. Its absence is normal, and Cloudflare answers a missing
 * path with index.html, so anything that isn't the expected JSON means "not
 * published" — quietly, with no console noise.
 * @returns {Promise<{about: string, notes: {title: string, date: string, summary: string, url: string}[]} | null>}
 */
async function fetchPaperIndex(url) {
  try {
    const res = await fetch(url);
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) return null;
    const data = await res.json();
    return typeof data?.about === "string" && Array.isArray(data.notes) ? data : null;
  } catch {
    return null;
  }
}

export async function loadAllData() {
  // This ensures the path is always correct in both development and production.
  const baseUrl = import.meta.env.BASE_URL;
  const [rainConfig, skillsAsset, hobbiesAsset, manPagesAsset, paperIndex] =
    await Promise.all([
      fetchJson(`${baseUrl}config/rain.json`, "rain.json (public)"),
      fetchJson(`${baseUrl}config/content/skills.json`, "skills.json (public)"),
      fetchJson(
        `${baseUrl}config/content/hobbies.json`,
        "hobbies.json (public)",
      ),
      fetchJson(
        `${baseUrl}config/content/manPages.json`,
        "manPages.json (public)",
      ),
      fetchPaperIndex(`${baseUrl}config/content/paper.json`),
    ]);

  return {
    config,
    rainConfig: rainConfig || {},
    skillsData: skillsAsset || {},
    hobbiesData: hobbiesAsset || {},
    manPages: manPagesAsset || {},
    paperIndex,
  };
}
