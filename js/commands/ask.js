/**
 * @file js/commands/ask.js
 * Natural-language fallback — maps a plain-English question to the best command
 * via local keyword routing. No LLM; pure string matching against config.ask.
 */

export default function askCommand(args, context) {
  const { appendToTerminal, config, terminalController } = context;
  const question = (args || []).join(" ").toLowerCase().trim();
  const cfg = config.ask || { routes: [], fallback: "" };

  if (!question) {
    appendToTerminal(
      "<div class='output-error'>Usage: ask &lt;a question&gt;</div>" +
        "<div class='output-text-small'>e.g., ask what have you built &middot; ask how do I reach you</div>",
    );
    return;
  }

  let best = null;
  let bestScore = 0;
  for (const route of cfg.routes) {
    let score = 0;
    for (const kw of route.keywords) {
      if (question.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = route;
    }
  }

  if (best && bestScore > 0 && best.command) {
    appendToTerminal(
      `<div class='output-text-small'>↳ best match: <span class="output-success">${best.command}</span></div>`,
    );
    terminalController.runCommand(best.command);
  } else {
    appendToTerminal(`<div>${cfg.fallback}</div>`);
  }
}
