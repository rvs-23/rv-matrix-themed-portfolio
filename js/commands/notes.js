/**
 * @file js/commands/notes.js
 * Lists the notes published on the paper site, newest first.
 */

import { escapeHtml } from "../utils.js";

export default function notesCommand(_args, context) {
  const { appendToTerminal, paper } = context;
  if (!paper || paper.notes.length === 0) {
    appendToTerminal("<div class='output-text-small'>No notes published yet.</div>");
    return;
  }
  const rows = paper.notes.map(
    (n) =>
      `<div><span class="output-text-small">${escapeHtml(n.date)}</span>  <a href="${escapeHtml(n.url)}">${escapeHtml(n.title)}</a></div>` +
      `<div class="output-text-small">  ${escapeHtml(n.summary)}</div>`,
  );
  appendToTerminal(
    `<div class="output-section-title section-title-plain">NOTES</div><div class="output-section">${rows.join("")}</div>`,
  );
}
