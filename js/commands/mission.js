/**
 * @file js/commands/mission.js
 * Handles the 'mission' command — recruiter dossier with nav highlight.
 * Running again toggles recruiter mode off.
 */

import { escapeHtml } from "../utils.js";

export default function missionCommand(args, context) {
  const { appendToTerminal, config } = context;

  // Toggle recruiter mode
  if (document.body.classList.contains("recruiter-mode")) {
    document.body.classList.remove("recruiter-mode");
    appendToTerminal(
      `<div class="output-success">Recruiter mode disengaged.</div>`,
    );
    return;
  }

  document.body.classList.add("recruiter-mode");

  const user = config.user;
  const name = escapeHtml(user.name || "OPERATOR");
  const title = escapeHtml(user.title || "System Analyst");
  const bio = escapeHtml(user.bio || "");

  const output =
    `<div class="output-section-title section-title-plain"><i class="fas fa-user-secret icon-inline"></i> DOSSIER &mdash; ${name}</div>` +
    `<div class="output-section">` +
    `<div class="output-line"><span class="output-line-label">Identity:</span> ${name}</div>` +
    `<div class="output-line"><span class="output-line-label">Role:</span> ${title}</div>` +
    `<div class="output-line"><span class="output-line-label">Status:</span> <span class="output-success">AVAILABLE FOR HIRE</span></div>` +
    `</div>` +
    `<div class="output-section">` +
    `<div class="output-line">${bio}</div>` +
    `</div>` +
    `<div class="mt-section output-text-small">` +
    `<span class="output-success">skills</span> &middot; <span class="output-success">whoami</span> &middot; <span class="output-success">contact</span> &middot; <span class="output-success">download cv</span>` +
    `</div>`;

  appendToTerminal(output);
}
