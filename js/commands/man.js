// @ts-check
/**
 * @file js/commands/man.js
 * Handles the 'man' command, displaying manual pages for other commands.
 */

import { escapeHtml, own } from "../utils.js";
import { HIDDEN_COMMANDS } from "./0_index.js";

// Command aliases that share another command's manual page.
// Exported for the contract smoke test.
export const MAN_ALIASES = { hire: "mission" };

/**
 * Man page names safe to advertise: hidden eggs (decode, sudo) keep their
 * pages for `man decode` typed in full, but never appear in lists,
 * suggestions or completion.
 * @param {object | null | undefined} manPages
 * @returns {string[]} Sorted page names.
 */
export function listedManPages(manPages) {
  return Object.keys(manPages || {})
    .filter((key) => !HIDDEN_COMMANDS.has(key))
    .sort();
}

export default function manCommand(args, context) {
  const { appendToTerminal, manPages } = context;

  if (!args || args.length === 0) {
    appendToTerminal(
      "<div class='output-error'>Usage: man &lt;command_name&gt;</div>",
      "output-error-wrapper",
    );
    appendToTerminal("<div>Example: man theme</div>", "output-text-wrapper");
    const listed = listedManPages(manPages);
    if (listed.length > 0) {
      const availableManPages = listed.join(", ");
      appendToTerminal(
        `<div>Available man pages for: ${escapeHtml(availableManPages)}</div>`,
        "output-text-wrapper",
      );
    } else {
      appendToTerminal(
        "<div>No manual pages loaded or defined. Check 'public/config/content/manPages.json'.</div>",
        "output-text-wrapper",
      );
    }
    return;
  }

  const requested = args[0].toLowerCase();
  const commandName = own(MAN_ALIASES, requested) || requested;
  const page = own(manPages, commandName);

  if (!page) {
    appendToTerminal(
      `<div class='output-error'>No manual entry for ${escapeHtml(commandName)}</div>`,
      "output-error-wrapper",
    );
    const suggestions = listedManPages(manPages).filter((key) =>
      key.includes(commandName),
    );
    if (suggestions.length > 0) {
      appendToTerminal(
        `<div>Did you mean one of these: ${suggestions.join(", ")}?</div>`,
        "output-text-wrapper",
      );
    }
    return;
  }

  let htmlOutput = `<div class="output-manpage-wrapper">`;

  // Standard sections
  const sections = [
    "name",
    "synopsis",
    "description",
    "arguments",
    "examples",
    "notes",
  ];
  const customSectionOrder = ["available_themes"]; // Add other custom ordered sections here

  sections.forEach((sectionKey) => {
    if (page[sectionKey]) {
      htmlOutput += `<div class="output-manpage-header" data-section="${sectionKey}">${sectionKey.toUpperCase()}</div>`;
      if (sectionKey === "examples" && Array.isArray(page.examples)) {
        page.examples.forEach((example) => {
          htmlOutput += `<div class="output-manpage-example">${escapeHtml(example)}</div>`;
        });
      } else {
        htmlOutput += `<div class="output-manpage-section-body">${escapeHtml(String(page[sectionKey])).replace(/\n/g, "<br/>")}</div>`;
      }
    }
  });

  // Handle any other custom fields not in standard sections or custom order
  Object.keys(page).forEach((key) => {
    if (!sections.includes(key) && !customSectionOrder.includes(key)) {
      const header = key.toUpperCase().replace(/_/g, " ");
      htmlOutput += `<div class="output-manpage-header">${header}</div>`;
      htmlOutput += `<div class="output-manpage-section-body">${escapeHtml(String(page[key])).replace(/\n/g, "<br/>")}</div>`;
    }
  });

  // Handle custom ordered sections (like 'available_themes' for the 'theme' command)
  customSectionOrder.forEach((sectionKey) => {
    if (page[sectionKey]) {
      const header = sectionKey.toUpperCase().replace(/_/g, " ");
      htmlOutput += `<div class="output-manpage-header">${header}</div>`;
      htmlOutput += `<div class="output-manpage-section-body">${escapeHtml(String(page[sectionKey])).replace(/\n/g, "<br/>")}</div>`;
    }
  });

  htmlOutput += `</div>`;
  // Using a more specific container class for the whole man page output
  appendToTerminal(htmlOutput, "output-manpage-container");
}
