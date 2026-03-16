/**
 * @file js/commands/decode.js
 * Decode-reveals user text, or a random Matrix quote if no args.
 */

import { decodeReveal } from "../effects/decode.js";
import { escapeHtml } from "../utils.js";

export default async function decodeCommand(args, context) {
  const { appendToTerminal, config } = context;

  let text;
  if (args.length > 0) {
    text = args.join(" ");
  } else {
    const quotes = config.matrixQuotes;
    let quote = quotes[Math.floor(Math.random() * quotes.length)];
    quote = quote.replace(
      "{{userName}}",
      escapeHtml(config.user.name || "User"),
    );
    text = quote;
  }

  const el = appendToTerminal("");
  await decodeReveal(el, text, { duration: 1200 });
}
