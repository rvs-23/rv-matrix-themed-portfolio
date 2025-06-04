/**
 * @file js/commands/help.js
 * Handles the 'help' command, displaying available commands and their descriptions.
 */
export default function helpCommand(args, context) {
    const { appendToTerminal, rainOptions } = context;
    const presets = rainOptions.getRainPresets ? rainOptions.getRainPresets() : {};
    const presetNames = Object.keys(presets).map(p => p.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ');

    // Define the new list of themes for the help message
    const newThemeList = [
        'amber', 'cyan', 'green', 'purple', 'twilight', 
        'crimson', 'forest', 'goldenglitch',
        'retroarcade', 'reloaded', 'voidblue', 'synthwavegrid'
    ].sort().join(', ');

    let commandList = [
        { cmd: "whoami", display: "whoami", desc: "Display operator identification and profile." }, // Example if 'about' was merged
        { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
        { cmd: "contact", display: "contact", desc: "Show contact information." },
        { cmd: "date", display: "date [timezone]", desc: "Display date/time. Optional: utc, est, etc." }, // Updated date desc
        { cmd: "download cv", display: "download cv", desc: "Download my CV." },
        { cmd: "easter.egg", display: "easter.egg", desc: "???" },
        { cmd: "hobbies", display: "hobbies", desc: "List my hobbies and interests." },
        { cmd: "rainpreset <name>", display: "rainpreset <name>", desc: `Apply rain preset. Available: ${presetNames}.` },
        { cmd: "resize term <W> <H>|reset", display: "resize term <W> <H>|reset", desc: "Resize terminal. E.g. `resize term 60vw 70vh` or `reset`." },
        { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
        { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., `skilltree se`." },
        { cmd: "sudo", display: "sudo", desc: "Attempt superuser command (humorous)." },
        { cmd: "termopacity <0-100|reset>", display: "termopacity <value>|reset", desc: "Set terminal background opacity." },
        { cmd: "termtext <size>", display: "termtext <size>", desc: "Set terminal font size. E.g., `13px`, `small`, `default`, `large`." },
        { cmd: "theme <name>", display: "theme <name>", desc: `Themes: ${newThemeList}. (Default green).` },
        { cmd: "toggleterm", display: "toggleterm", desc: "Hide or show the terminal window (Shortcut: Ctrl + \\)." },
    ];

    const basePad = "  ";
    const descSeparator = " - ";
    let maxDisplayLength = 0;
    commandList.forEach(item => { if (item.display.length > maxDisplayLength) maxDisplayLength = item.display.length; });

    let helpOutput = `<div class="output-section-title" style="border-left: none; padding-left:0;"><i class="fas fa-question-circle"></i> AVAILABLE COMMANDS</div>`;
    commandList.forEach(item => {
        const displayPart = item.display.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");
        const padding = "&nbsp;".repeat(Math.max(0, maxDisplayLength - item.display.length));
        const descPart = item.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        helpOutput += `<div>${basePad.replace(/ /g, "&nbsp;")}${displayPart}${padding}${descSeparator.replace(/ /g, "&nbsp;")}${descPart}</div>`;
    });
    appendToTerminal(helpOutput, 'output-help-wrapper');
}