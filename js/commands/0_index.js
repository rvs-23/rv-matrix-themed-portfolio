/**
 * @file js/commands/0_index.js
 * Central registration point for all terminal commands.
 * Imports individual command modules and aggregates them.
 */

import askCommand from "./ask.js";
import bluepillCommand from "./bluepill.js";
import clearCommand from "./clear.js";
import contactCommand from "./contact.js";
import dateCommand from "./date.js";
import decodeCommand from "./decode.js";
import downloadCvCommand from "./download.js";
import eeCommand from "./ee.js";
import helpCommand from "./help.js";
import hobbiesCommand from "./hobbies.js";
import manCommand from "./man.js";
import missionCommand from "./mission.js";
import nospoonCommand from "./nospoon.js";
import rainCommand from "./rain.js";
import redpillCommand from "./redpill.js";
import resetCommand from "./reset.js";
import screenshotCommand from "./screenshot.js";
import searchCommand from "./search.js";
import skillsCommand from "./skills.js";
import skillTreeCommand from "./skilltree.js";
import sudoCommand from "./sudo.js";
import termCommand from "./term.js";
import themeCommand from "./theme.js";
import toggleTermCommand from "./toggleterm.js";
import wakeCommand from "./wake.js";
import whoamiCommand from "./whoami.js";

/**
 * Assembles all command functions into a single object.
 * @returns {object} An object mapping command names to their functions.
 */
export function getAllCommands() {
  return {
    // Portfolio
    whoami: whoamiCommand,
    skills: skillsCommand,
    skilltree: skillTreeCommand,
    hobbies: hobbiesCommand,
    contact: contactCommand,
    mission: missionCommand,
    hire: missionCommand,

    // Utility
    help: helpCommand,
    man: manCommand,
    clear: clearCommand,
    search: searchCommand,
    ask: askCommand,
    date: dateCommand,
    download: downloadCvCommand,
    screenshot: screenshotCommand,
    reset: resetCommand,

    // Customization
    theme: themeCommand,
    rain: rainCommand,
    term: termCommand,
    toggleterm: toggleTermCommand,

    // Easter eggs (hidden from help)
    ee: eeCommand,
    decode: decodeCommand,
    sudo: sudoCommand,
    wake: wakeCommand,
    redpill: redpillCommand,
    bluepill: bluepillCommand,
    nospoon: nospoonCommand,
  };
}
