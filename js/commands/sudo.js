/**
 * @file js/commands/sudo.js
 * Handles the 'sudo' command (humorous denial).
 */

import { escapeHtml } from "../utils.js";

export default function sudoCommand(args, context) {
  const { appendToTerminal, userConfig } = context;
  const userName = escapeHtml(userConfig.userName || "User");

  appendToTerminal(
    `<div class="output-error"><i class="fas fa-user-shield icon-inline"></i> Access Denied. User '${userName}' is not authorized for 'sudo'. This incident will be logged (not really).</div>`,
    "output-error-wrapper", // Ensure this class is defined in your CSS for error styling
  );
}
