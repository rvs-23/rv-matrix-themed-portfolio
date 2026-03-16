/**
 * @file js/commands/0_index.js
 * Central registration point for all terminal commands.
 * Imports individual command modules and aggregates them.
 */

// Import individual command handlers
import bluepillCommand from "./bluepill.js";
import clearCommand from "./clear.js";
import contactCommand from "./contact.js";
import dateCommand from "./date.js";
import decodeCommand from "./decode.js";
import downloadCvCommand from "./download.js";
import helpCommand from "./help.js";
import hobbiesCommand from "./hobbies.js";
import manCommand from "./man.js";
import missionCommand from "./mission.js";
import nospoonCommand from "./nospoon.js";
import rainFontCommand from "./rainfont.js";
import rainInteractCommand from "./raininteract.js";
import rainPresetCommand from "./rainpreset.js";
import rainSizeCommand from "./rainsize.js";
import redpillCommand from "./redpill.js";
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
import wakeCommand from "./wake.js";
import whoamiCommand from "./whoami.js";

/**
 * Assembles all command functions into a single object.
 * @returns {object} An object mapping command names to their functions.
 */
export function getAllCommands() {
  const cmds = {
    bluepill: bluepillCommand,
    clear: clearCommand,
    contact: contactCommand,
    date: dateCommand,
    decode: decodeCommand,
    download: downloadCvCommand,
    help: helpCommand,
    hobbies: hobbiesCommand,
    man: manCommand,
    mission: missionCommand,
    hire: missionCommand,
    nospoon: nospoonCommand,
    rainfont: rainFontCommand,
    raininteract: rainInteractCommand,
    rainpreset: rainPresetCommand,
    rainsize: rainSizeCommand,
    redpill: redpillCommand,
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
    wake: wakeCommand,
    whoami: whoamiCommand,
  };

  return cmds;
}
