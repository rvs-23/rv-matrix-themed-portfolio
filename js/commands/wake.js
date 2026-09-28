/**
 * @file js/commands/wake.js
 * Hidden easter egg — recreates the Matrix opening screen sequence.
 */

import { decodeReveal, sleep } from "../effects/decode.js";

const SEQUENCE = [
  { text: (name) => `Wake up, ${name}...`, delay: 1000, duration: 1000 },
  { text: () => "The Matrix has you...", delay: 1200, duration: 1000 },
  { text: () => "Follow the white rabbit.", delay: 1200, duration: 1000 },
  { text: () => "Knock, knock.", delay: 1500, duration: 800 },
];

export default async function wakeCommand(args, context) {
  const { appendToTerminal, config, terminalController, rainEngine } = context;
  // Plain text: decodeReveal writes textContent, so no HTML escaping.
  const name = config.user.name?.split(" ")[0] || "Neo";

  // Lock input (and the command chips) during the cinematic sequence
  terminalController.setInputLocked(true);
  try {
    // Clear terminal for cinematic feel
    terminalController.clearTerminalOutput();
    // The system stirs — a bright surge through the rain as it wakes.
    rainEngine?.pulse?.({ primary: "#dfffdf", glow: "#ffffff" }, 1800);
    await sleep(600);

    for (const step of SEQUENCE) {
      const el = appendToTerminal("");
      await decodeReveal(el, step.text(name), { duration: step.duration });
      await sleep(step.delay);
    }
  } finally {
    // Always re-enable, even if a step throws
    terminalController.setInputLocked(false);
  }
}
