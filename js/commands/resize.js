/**
 * @file js/commands/resize.js
 * Handles the 'resize term' command.
 */

export default function resizeTermCommand(args, context) {
    const { appendToTerminal, terminalController } = context;

    if (args[0] && args[0].toLowerCase() === 'term') {
        if (args.length === 2 && args[1].toLowerCase() === 'reset') {
            const defaultSize = terminalController.getDefaultTerminalSize ? terminalController.getDefaultTerminalSize() : null;
            if (defaultSize && terminalController.resizeTerminalElement) {
                terminalController.resizeTerminalElement(defaultSize.width, defaultSize.height);
                // appendToTerminal is called within resizeTerminalElement in terminalController
            } else {
                appendToTerminal("<div class='output-error'>Terminal reset function or default sizes not available.</div>", 'output-error-wrapper');
            }
        } else if (args.length === 3) {
            const width = args[1];
            const height = args[2];
            // Basic validation for units (can be expanded)
            const validUnits = /^\d+(\.\d+)?(px|%|vw|vh|em|rem)$/i;
            if (validUnits.test(width) && validUnits.test(height)) {
                if (terminalController.resizeTerminalElement) {
                    terminalController.resizeTerminalElement(width, height);
                } else {
                    appendToTerminal("<div class='output-error'>Terminal resize function not available.</div>", 'output-error-wrapper');
                }
            } else {
                appendToTerminal("<div class='output-error'>Invalid size units. Use px, %, vw, vh, em, or rem (e.g., 600px, 80%, 70vw, 60vh).</div>", 'output-error-wrapper');
            }
        } else {
            appendToTerminal("<div class='output-error'>Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset</div>", 'output-error-wrapper');
        }
    } else {
        // If 'term' is not the first arg or args are missing
        appendToTerminal("<div class='output-error'>Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset</div>", 'output-error-wrapper');
    }
}
