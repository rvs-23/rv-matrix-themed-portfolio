/**
 * @file js/commands/toggleterm.js
 * Handles the 'toggleterm' command to show/hide the terminal window.
 */

export default function toggleTermCommand(args, context) {
    const { appendToTerminal, terminalController } = context;

    if (terminalController.toggleTerminalVisibility) {
        terminalController.toggleTerminalVisibility();
        // Feedback messages are handled within toggleTerminalVisibility itself
    } else {
        appendToTerminal("<div class='output-error'>Error: Terminal toggle functionality is not available.</div>", "output-error-wrapper");
    }
}
