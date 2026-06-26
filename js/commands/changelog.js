/**
 * @file js/commands/changelog.js
 * Renders the project's own CHANGELOG.md in the terminal (imported at build
 * time via Vite's ?raw, so it's always in sync with the repo).
 */

import { escapeHtml } from "../utils.js";
import changelogRaw from "../../CHANGELOG.md?raw";

export default function changelogCommand(_args, context) {
  const { appendToTerminal } = context;

  let html = `<div class="output-section">`;
  for (const line of changelogRaw.split("\n")) {
    const t = line.trimEnd();
    if (/^#{1,6}\s/.test(t)) {
      html += `<div class="output-section-title section-title-plain">${escapeHtml(t.replace(/^#{1,6}\s/, ""))}</div>`;
    } else if (/^\s*[-*]\s/.test(t)) {
      html += `<div>&nbsp;&nbsp;&bull; ${escapeHtml(t.replace(/^\s*[-*]\s/, ""))}</div>`;
    } else if (t === "") {
      html += `<div>&nbsp;</div>`;
    } else {
      html += `<div>${escapeHtml(t)}</div>`;
    }
  }
  html += `</div>`;
  appendToTerminal(html);
}
