/**
 * @file js/commands/raininteract.js
 * Toggles interactive rain click effects with selectable mode.
 * Modes: thunder (lightning bolts), column (downward energy pulse).
 */

const MODES = ["thunder", "column"];

export default function rainInteractCommand(args, context) {
  const { appendToTerminal, rainEngine } = context;

  if (!rainEngine) {
    appendToTerminal(
      "<div class='output-error'>Rain engine not available.</div>",
    );
    return;
  }

  // No args: show status
  if (args.length === 0) {
    const { burst, mode } = rainEngine.getInteract();
    const cls = burst ? "output-success" : "output-error";
    const status = burst ? `on (${mode})` : "off";
    appendToTerminal(`<div>Click effects: <span class="${cls}">${status}</span></div>`);
    appendToTerminal(
      `<div class='output-text-small'>Usage: raininteract &lt;off|${MODES.join("|")}&gt;</div>`,
    );
    return;
  }

  const action = args[0].toLowerCase();

  if (action === "off") {
    rainEngine.setInteract("off");
    appendToTerminal(
      "<div class='output-success'>Click effects disabled.</div>",
    );
    return;
  }

  if (MODES.includes(action)) {
    rainEngine.setInteract(action);
    const descriptions = {
      thunder: "Lightning strikes from sky to click point.",
      column: "Energy pulse travels down through columns.",
    };
    appendToTerminal(
      `<div class='output-success'>Mode: ${action}. ${descriptions[action]}</div>`,
    );
    return;
  }

  appendToTerminal(
    `<div class='output-error'>Unknown mode '${action.replace(/</g, "&lt;")}'. Available: off, ${MODES.join(", ")}.</div>`,
  );
}
