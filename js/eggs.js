/**
 * @file js/eggs.js
 * Tracks which easter eggs the visitor has discovered, in localStorage.
 */

const STORAGE_KEY = "rv_eggs";

/** All trackable eggs — command names plus the Konami code. */
export const EGG_IDS = [
  "wake",
  "redpill",
  "bluepill",
  "nospoon",
  "sudo",
  "decode",
  "konami",
];

export function getUnlockedEggs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((id) => EGG_IDS.includes(id)) : [];
  } catch {
    return [];
  }
}

/** Record an egg as discovered. No-op for unknown ids or already-found ones. */
export function recordEgg(id) {
  if (!EGG_IDS.includes(id)) return;
  const unlocked = getUnlockedEggs();
  if (unlocked.includes(id)) return;
  unlocked.push(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch {
    /* storage unavailable */
  }
}

export function clearEggs() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
