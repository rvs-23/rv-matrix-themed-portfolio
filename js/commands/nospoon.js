/**
 * @file js/commands/nospoon.js
 * Hidden easter egg — "there is no spoon" with terminal warp.
 */

import { decodeReveal, sleep } from "../effects/decode.js";

export default async function nospoonCommand(args, context) {
  const { appendToTerminal, mainContentContainer } = context;

  const line1 = appendToTerminal("");
  await decodeReveal(
    line1,
    "Do not try and bend the spoon — that's impossible.",
    { duration: 1000 },
  );
  await sleep(500);

  // Warp the terminal
  if (mainContentContainer) {
    mainContentContainer.style.transition = "transform 0.4s ease";
    mainContentContainer.style.transform =
      "perspective(800px) rotateY(2deg) skewY(0.5deg)";
    await sleep(400);
    mainContentContainer.style.transform =
      "perspective(800px) rotateY(-2deg) skewY(-0.5deg)";
    await sleep(400);
    mainContentContainer.style.transform = "";
    await sleep(200);
  }

  const line2 = appendToTerminal("");
  await decodeReveal(
    line2,
    "Instead, only try to realize the truth... there is no spoon.",
    { duration: 1200 },
  );
  await sleep(600);

  appendToTerminal(
    "<div class='output-text-small' style='opacity:0.7'>Then you will see it is not the spoon that bends, it is only yourself.</div>",
  );
}
