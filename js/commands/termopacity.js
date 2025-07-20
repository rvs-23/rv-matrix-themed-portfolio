export default function termOpacityCommand(args, context) {
  // ++ Get configs from context
  const { appendToTerminal, terminalController, config } = context;
  const messages = config.terminal.messages;

  if (!args || args.length === 0) {
    let currentOpacityPercentage = "N/A";
    if (typeof getComputedStyle !== "undefined" && document.documentElement) {
      const currentOpacityValue = getComputedStyle(document.documentElement)
        .getPropertyValue("--terminal-opacity")
        .trim();
      const parsedOpacity = parseFloat(currentOpacityValue);
      if (!isNaN(parsedOpacity)) {
        currentOpacityPercentage = (parsedOpacity * 100).toFixed(0) + "%";
      }
    }
    appendToTerminal(
      `<div class='output-error'>${messages.opacity_usage}</div>`,
    );
    appendToTerminal(
      `<div>${messages.opacity_current(currentOpacityPercentage)}</div>`,
    );
    return;
  }

  const inputValue = args[0].toLowerCase();

  if (terminalController.setTerminalOpacity) {
    terminalController.setTerminalOpacity(inputValue);
  } else {
    appendToTerminal(
      `<div class='output-error'>${messages.opacity_unavailable}</div>`,
    );
  }
}
