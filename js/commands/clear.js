/**
 * @file js/commands/clear.js
 * Handles the 'clear' command.
 */
export default function clearCommand(args, context) {
    const { terminalController } = context; // Or directly get clearTerminalOutput if preferred
    terminalController.clearTerminalOutput();
}
