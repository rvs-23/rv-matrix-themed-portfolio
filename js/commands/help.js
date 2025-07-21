/**
 * @file js/commands/help.js
 * Handles the 'help' command.
 */
export default function helpCommand(args, context) {
  const { appendToTerminal, config } = context;
  const helpConfig = config.help;
  const commandList = helpConfig.commandList;

  const basePad = "  ";
  const descSeparator = " - ";
  let maxDisplayLength = 0;
  commandList.forEach((item) => {
    if (item.display.length > maxDisplayLength)
      maxDisplayLength = item.display.length;
  });

  let helpOutput = `<div class="output-section-title" style="border-left: none; padding-left:0;"><i class="fas fa-question-circle"></i> ${helpConfig.title}</div>`;
  commandList.forEach((item) => {
    const displayPart = item.display
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/ /g, "&nbsp;");
    const padding = "&nbsp;".repeat(
      Math.max(0, maxDisplayLength - item.display.length),
    );

    //  If desc is a function, call it to get dynamic description
    const descText =
      typeof item.desc === "function" ? item.desc(context) : item.desc;

    const descPart = descText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    helpOutput += `<div>${basePad.replace(/ /g, "&nbsp;")}${displayPart}${padding}${descSeparator.replace(/ /g, "&nbsp;")}${descPart}</div>`;
  });
  appendToTerminal(helpOutput, "output-help-wrapper");
}
