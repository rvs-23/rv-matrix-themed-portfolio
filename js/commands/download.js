/**
 * @file js/commands/download.js
 * Handles the 'download' command.
 */
export default function downloadCvCommand(args, context) {
  const { appendToTerminal, userConfig, config } = context;
  const downloadConfig = config.download;
  const messages = downloadConfig.messages;
  const fileKey = args[0] ? args[0].toLowerCase() : null;
  const fileConfig = downloadConfig[fileKey];

  if (fileConfig) {
    const fileUrl = userConfig[fileConfig.userConfigKey];
    if (!fileUrl || fileUrl === "" || fileUrl === fileConfig.placeholder) {
      return appendToTerminal(
        `<div class='output-error'>${messages.not_configured}</div>`,
      );
    }

    appendToTerminal(`<div>${messages.preparing}</div>`);
    let finalLink = fileUrl;
    const gDriveRegex = new RegExp(fileConfig.gDriveRegex);
    const match = fileUrl.match(gDriveRegex);

    if (match && match[1]) {
      finalLink = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      appendToTerminal(`<div>${messages.gdrive_format}</div>`);
    } else {
      appendToTerminal(`<div>${messages.direct_link}</div>`);
    }

    const linkEl = document.createElement("a");
    linkEl.href = finalLink;
    const userNameForFile = (userConfig.name || "User").replace(/\s+/g, "_");
    linkEl.download = fileConfig.filenameTemplate.replace(
      "{{userName}}",
      userNameForFile,
    );
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";

    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);

    appendToTerminal(`<div>${messages.popup_blocked}</div>`);
  } else {
    appendToTerminal(`<div class='output-error'>${messages.usage}</div>`);
  }
}
