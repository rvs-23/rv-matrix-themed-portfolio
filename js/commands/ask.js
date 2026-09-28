/**
 * @file js/commands/ask.js
 * Natural-language fallback — maps a plain-English question to the best command
 * via local keyword routing. No LLM; pure string matching against config.ask.
 */

/**
 * Best route for a question: most keywords matched as whole words (a plain
 * plural "-s"/"-es" also counts), so "fun" never hits "function" nor "ml"
 * hit "html". Pure — exported for the contract test.
 * @param {string} question - Lower-cased question text.
 * @param {Array<{ keywords: string[], command: string }>} routes
 * @returns {{ keywords: string[], command: string } | null}
 */
export function matchAskRoute(question, routes) {
  const words = new Set(question.split(/[^a-z0-9]+/).filter(Boolean));
  const hit = (kw) =>
    words.has(kw) || words.has(`${kw}s`) || words.has(`${kw}es`);
  let best = null;
  let bestScore = 0;
  for (const route of routes) {
    const score = route.keywords.filter(hit).length;
    if (score > bestScore) {
      bestScore = score;
      best = route;
    }
  }
  return best;
}

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

  const best = matchAskRoute(question, cfg.routes);

  if (best && best.command) {
    appendToTerminal(
      `<div class='output-text-small'>↳ best match: <span class="output-success">${best.command}</span></div>`,
    );
    terminalController.runCommand(best.command);
  } else {
    appendToTerminal(`<div>${cfg.fallback}</div>`);
  }
}
