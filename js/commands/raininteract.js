/**
 * @file js/commands/raininteract.js
 * Toggles interactive rain click effects (burst — expanding glow wave on click).
 */

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
    const { burst } = rainEngine.getInteract();
    const cls = burst ? "output-success" : "output-error";
    appendToTerminal(
      `<div>Click burst: <span class="${cls}">${burst ? "on" : "off"}</span></div>`,
    );
    appendToTerminal(
      "<div class='output-text-small'>Usage: raininteract &lt;on|off&gt;</div>",
    );
    return;
  }

  const action = args[0].toLowerCase();
  if (action !== "on" && action !== "off") {
    appendToTerminal(
      "<div class='output-error'>Usage: raininteract &lt;on|off&gt;</div>",
    );
    return;
  }

  const enabled = action === "on";
  rainEngine.setInteract("burst", enabled);

  appendToTerminal(
    `<div class='output-success'>Click burst ${enabled ? "enabled" : "disabled"}.</div>`,
  );
}
