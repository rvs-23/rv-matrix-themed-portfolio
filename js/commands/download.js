/**
 * @file js/commands/download.js
 * Handles the 'download cv' command.
 */

export default function downloadCvCommand(args, context) {
    const { appendToTerminal, userConfig } = context;

    if (args[0] && args[0].toLowerCase() === 'cv') {
        if (!userConfig.cvLink || userConfig.cvLink === "" || userConfig.cvLink === "path/to/your/resume.pdf") { // More robust check
            return appendToTerminal("<div class='output-error'>CV link not configured or is a placeholder.</div>", 'output-error-wrapper');
        }

        appendToTerminal("<div>Attempting to prepare CV for viewing/download...</div>", 'output-text-wrapper');
        let finalCvLink = userConfig.cvLink;

        // Regex to check for Google Drive file links and convert to direct download
        const gDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//;
        const match = userConfig.cvLink.match(gDriveRegex);

        if (match && match[1]) {
            finalCvLink = `https://drive.google.com/uc?export=download&id=${match[1]}`;
            appendToTerminal(`<div>Using Google Drive direct download link format.</div>`, 'output-text-wrapper');
        } else {
            appendToTerminal(`<div>Using provided link directly. Behavior depends on link type.</div>`, 'output-text-wrapper');
        }

        const linkEl = document.createElement('a');
        linkEl.href = finalCvLink;
        // Sanitize username for filename
        const userNameForFile = (userConfig.userName || "User").replace(/\s+/g, "_");
        linkEl.download = `${userNameForFile}_CV.pdf`;
        linkEl.target = '_blank'; // Open in new tab, browser might handle download or display
        linkEl.rel = 'noopener noreferrer';

        document.body.appendChild(linkEl);
        linkEl.click();
        document.body.removeChild(linkEl);

        appendToTerminal(`<div>If your browser blocked the pop-up or download didn't start, check your browser settings. You can also use the CV link in the navigation bar.</div>`, 'output-text-wrapper');
    } else {
        appendToTerminal("<div class='output-error'>Usage: download cv</div>", 'output-error-wrapper');
    }
}
