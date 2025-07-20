export default function termTextCommand(args, context) {
  // ++ Get configs from context
  const { appendToTerminal, terminalController, config } = context;
  const messages = config.terminal.messages;

  if (!args || args.length === 0) {
    appendToTerminal(`<div class='output-error'>${messages.text_usage}</div>`);
    appendToTerminal(`<div>${messages.text_examples}</div>`);
    const currentSize =
      document.documentElement.style.getPropertyValue("--terminal-font-size") ||
      config.terminal.fontSizes.default;
    appendToTerminal(`<div>${messages.text_current(currentSize)}</div>`);
    return;
  }

  const inputSize = args[0].toLowerCase();
  if (terminalController.setTerminalFontSize) {
    terminalController.setTerminalFontSize(inputSize);
  } else {
    appendToTerminal(
      `<div class='output-error'>${messages.text_unavailable}</div>`,
    );
  }
}
