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
import searchCommand from "./search.js";
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
    search: searchCommand,
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
