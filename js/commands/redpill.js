/**
 * @file js/commands/redpill.js
 * Hidden easter egg — the red pill experience.
 */

import { decodeReveal, sleep } from "../effects/decode.js";
import { escapeHtml } from "../utils.js";

export default async function redpillCommand(args, context) {
  const { appendToTerminal, terminalController, rainEngine, config } = context;
  const name = escapeHtml(config.user.name?.split(" ")[0] || "Neo");

  // Red flash overlay
  document.body.classList.add("redpill-flash");

  const line1 = appendToTerminal("");
  await decodeReveal(line1, "You take the red pill...", { duration: 800 });
  await sleep(600);

  // Switch to crimson + intense rain
  terminalController.applyTheme("crimson");
  if (rainEngine?.refreshColors) rainEngine.refreshColors();
  if (rainEngine?.applyPreset) rainEngine.applyPreset("storm");

  await sleep(400);

  const line2 = appendToTerminal("");
  await decodeReveal(line2, `Welcome to the real world, ${name}.`, {
    duration: 1200,
  });
  await sleep(800);

  appendToTerminal(
    "<div class='output-text-small' style='opacity:0.7'>Remember... all I'm offering is the truth. Nothing more.</div>",
  );

  document.body.classList.remove("redpill-flash");
}
