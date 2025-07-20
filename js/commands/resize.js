export default function resizeTermCommand(args, context) {
  // ++ Get configs from context
  const { appendToTerminal, terminalController, config } = context;
  const messages = config.resize.messages;
  const validUnits = new RegExp(config.resize.validUnitsRegex, "i"); // ++ Create RegExp from config string

  if (args[0]?.toLowerCase() === "term") {
    if (args.length === 2 && args[1].toLowerCase() === "reset") {
      const defaultSize = terminalController.getDefaultTerminalSize?.();
      if (defaultSize && terminalController.resizeTerminalElement) {
        terminalController.resizeTerminalElement(
          defaultSize.width,
          defaultSize.height,
        );
      } else {
        appendToTerminal(
          `<div class='output-error'>${messages.reset_unavailable}</div>`,
        );
      }
    } else if (args.length === 3) {
      const [width, height] = [args[1], args[2]];
      if (validUnits.test(width) && validUnits.test(height)) {
        if (terminalController.resizeTerminalElement) {
          terminalController.resizeTerminalElement(width, height);
        } else {
          appendToTerminal(
            `<div class='output-error'>${messages.resize_unavailable}</div>`,
          );
        }
      } else {
        appendToTerminal(
          `<div class='output-error'>${messages.invalid_units}</div>`,
        );
      }
    } else {
      appendToTerminal(`<div class='output-error'>${messages.usage}</div>`);
    }
  } else {
    appendToTerminal(`<div class='output-error'>${messages.usage}</div>`);
  }
}
