/**
 * @file js/commands/man.js
 * Handles the 'man' command, displaying manual pages for other commands.
 */

export default function manCommand(args, context) {
  const { appendToTerminal, manPages } = context;

  if (!args || args.length === 0) {
    appendToTerminal(
      "<div class='output-error'>Usage: man &lt;command_name&gt;</div>",
      "output-error-wrapper",
    );
    appendToTerminal("<div>Example: man theme</div>", "output-text-wrapper");
    if (manPages && Object.keys(manPages).length > 0) {
      const availableManPages = Object.keys(manPages).sort().join(", ");
      appendToTerminal(
        `<div>Available man pages for: ${availableManPages.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`,
        "output-text-wrapper",
      );
    } else {
      appendToTerminal(
        "<div>No manual pages loaded or defined. Check 'assets/manPages.json'.</div>",
        "output-text-wrapper",
      );
    }
    return;
  }

  const commandName = args[0].toLowerCase();
  const page = manPages ? manPages[commandName] : null;

  if (!page) {
    appendToTerminal(
      `<div class='output-error'>No manual entry for ${commandName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`,
      "output-error-wrapper",
    );
    if (manPages && Object.keys(manPages).length > 0) {
      const suggestions = Object.keys(manPages).filter((key) =>
        key.includes(commandName),
      );
      if (suggestions.length > 0) {
        appendToTerminal(
          `<div>Did you mean one of these: ${suggestions.join(", ")}?</div>`,
          "output-text-wrapper",
        );
      }
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
      htmlOutput += `<div class="output-manpage-header">${sectionKey.toUpperCase()}</div>`;
      if (sectionKey === "examples" && Array.isArray(page.examples)) {
        page.examples.forEach((example) => {
          htmlOutput += `<div class="output-manpage-example">${example.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        });
      } else {
        htmlOutput += `<div class="output-manpage-section-body">${String(page[sectionKey]).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>`;
      }
    }
  });

  // Handle any other custom fields not in standard sections or custom order
  Object.keys(page).forEach((key) => {
    if (!sections.includes(key) && !customSectionOrder.includes(key)) {
      const header = key.toUpperCase().replace(/_/g, " ");
      htmlOutput += `<div class="output-manpage-header">${header}</div>`;
      htmlOutput += `<div class="output-manpage-section-body">${String(page[key]).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>`;
    }
  });

  // Handle custom ordered sections (like 'available_themes' for the 'theme' command)
  customSectionOrder.forEach((sectionKey) => {
    if (page[sectionKey]) {
      const header = sectionKey.toUpperCase().replace(/_/g, " ");
      htmlOutput += `<div class="output-manpage-header">${header}</div>`;
      htmlOutput += `<div class="output-manpage-section-body">${String(page[sectionKey]).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>`;
    }
  });

  htmlOutput += `</div>`;
  // Using a more specific container class for the whole man page output
  appendToTerminal(htmlOutput, "output-manpage-container");
}
