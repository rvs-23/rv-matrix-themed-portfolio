/**
 * @file js/commands/wake.js
 * Hidden easter egg — recreates the Matrix opening screen sequence.
 */

import { decodeReveal, sleep } from "../effects/decode.js";
import { escapeHtml } from "../utils.js";

const SEQUENCE = [
  { text: (name) => `Wake up, ${name}...`, delay: 1000, duration: 1000 },
  { text: () => "The Matrix has you...", delay: 1200, duration: 1000 },
  { text: () => "Follow the white rabbit.", delay: 1200, duration: 1000 },
  { text: () => "Knock, knock.", delay: 1500, duration: 800 },
];

export default async function wakeCommand(args, context) {
  const { appendToTerminal, config, terminalController } = context;
  const name = escapeHtml(config.user.name?.split(" ")[0] || "Neo");

  // Disable input during the cinematic sequence
  const input = document.getElementById("command-input");
  if (input) input.disabled = true;

  // Clear terminal for cinematic feel
  terminalController.clearTerminalOutput();
  await sleep(600);

  for (const step of SEQUENCE) {
    const el = appendToTerminal("");
    await decodeReveal(el, step.text(name), { duration: step.duration });
    await sleep(step.delay);
  }

  // Re-enable input
  if (input) {
    input.disabled = false;
    input.focus();
  }
}
