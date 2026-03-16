/**
 * @file js/commands/bluepill.js
 * Hidden easter egg — the blue pill experience.
 */

import { decodeReveal, sleep } from "../effects/decode.js";

export default async function bluepillCommand(args, context) {
  const { appendToTerminal, terminalController, rainEngine } = context;

  const line1 = appendToTerminal("");
  await decodeReveal(line1, "You take the blue pill...", { duration: 800 });
  await sleep(600);

  // Drift into neuralstorm + calm rain
  terminalController.applyTheme("neuralstorm");
  if (rainEngine?.refreshColors) rainEngine.refreshColors();
  if (rainEngine?.applyPreset) rainEngine.applyPreset("whisper");

  await sleep(400);

  const line2 = appendToTerminal("");
  await decodeReveal(
    line2,
    "The story ends. You wake up and believe whatever you want to believe.",
    { duration: 1500 },
  );
  await sleep(600);

  appendToTerminal("<div class='output-success'>Ignorance is bliss.</div>");
}
