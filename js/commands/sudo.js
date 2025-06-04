/**
 * @file js/commands/sudo.js
 * Handles the 'sudo' command (humorous denial).
 */

export default function sudoCommand(args, context) {
    const { appendToTerminal, userConfig } = context;
    const userName = userConfig.userName || 'User'; // Fallback if userName is not in config

    appendToTerminal(
        `<div class="output-error"><i class="fas fa-user-shield" style="margin-right: 0.3em;"></i> Access Denied. User '${userName}' is not authorized for 'sudo'. This incident will be logged (not really).</div>`,
        'output-error-wrapper' // Ensure this class is defined in your CSS for error styling
    );
}
