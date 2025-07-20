/**
 * @file js/commands/0_index.js
 * Central registration point for all terminal commands.
 * Imports individual command modules and aggregates them.
 */

// Import individual command handlers
import clearCommand from "./clear.js";
import contactCommand from "./contact.js";
import dateCommand from "./date.js";
import downloadCvCommand from "./download.js";
import easterEggCommand from "./easter.egg.js";
import helpCommand from "./help.js";
import hobbiesCommand from "./hobbies.js";
import manCommand from "./man.js";
import rainPresetCommand from "./rainpreset.js";
import resizeTermCommand from "./resize.js";
import screenshotCommand from "./screenshot.js";
import skillsCommand from "./skills.js";
import skillTreeCommand from "./skilltree.js";
import sudoCommand from "./sudo.js";
import termOpacityCommand from "./termopacity.js";
import termTextCommand from "./termtext.js";
import themeCommand from "./theme.js";
import toggleTermCommand from "./toggleterm.js";
import whoamiCommand from "./whoami.js";

/**
 * Assembles all command functions into a single object.
 * The `context` will be passed from main.js and contains necessary functions
 * (like appendToTerminal, access to configs, etc.) and data.
 * @returns {object} An object mapping command names to their functions.
 */
export function getAllCommands() {
  const cmds = {
    clear: clearCommand,
    contact: contactCommand,
    date: dateCommand,
    download: downloadCvCommand,
    "easter.egg": easterEggCommand,
    help: helpCommand,
    hobbies: hobbiesCommand,
    man: manCommand,
    rainpreset: rainPresetCommand,
    resize: resizeTermCommand,
    screenshot: screenshotCommand,
    skills: skillsCommand,
    skilltree: skillTreeCommand,
    sudo: sudoCommand,
    termopacity: termOpacityCommand,
    termtext: termTextCommand,
    theme: themeCommand,
    toggleterm: toggleTermCommand,
    whoami: whoamiCommand,
  };

  return cmds;
}

// Utility function for rendering tree structures (skills, hobbies)
// This can be kept here or moved to a separate utility module if it grows.
export function renderTree(
  node,
  indent = "",
  isLast = true,
  outputArray = [],
  isRootCall = true,
) {
  if (!node || typeof node.name === "undefined") {
    const errorMsg =
      isRootCall && !node
        ? "Error: Data source is not loaded or empty."
        : "Error: Malformed data node.";
    console.error("Error in renderTree:", errorMsg, "Node:", node);
    if (!Array.isArray(outputArray)) {
      outputArray = [];
    }
    outputArray.push(`${indent}${isLast ? "└── " : "├── "}[${errorMsg}]`);
    return outputArray;
  }
  const sanitizedNodeName = node.name
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  outputArray.push(`${indent}${isLast ? "└── " : "├── "}${sanitizedNodeName}`);

  const newIndent = indent + (isLast ? "    " : "│   ");
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      renderTree(
        child,
        newIndent,
        index === node.children.length - 1,
        outputArray,
        false,
      );
    });
  }
  return outputArray;
}
