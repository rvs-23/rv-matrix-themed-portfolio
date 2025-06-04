/**
 * @file js/commands/termopacity.js
 * Handles the 'termopacity' command to set the terminal background opacity.
 */

export default function termOpacityCommand(args, context) {
    const { appendToTerminal, terminalController } = context;

    if (!args || args.length === 0) {
        let currentOpacityPercentage = 'N/A';
        // Attempt to get the current opacity for display
        if (typeof getComputedStyle !== 'undefined' && document.documentElement) {
            const currentOpacityValue = getComputedStyle(document.documentElement).getPropertyValue('--terminal-opacity').trim();
            const parsedOpacity = parseFloat(currentOpacityValue);
            if (!isNaN(parsedOpacity)) {
                currentOpacityPercentage = (parsedOpacity * 100).toFixed(0) + '%';
            }
        }

        appendToTerminal("<div class='output-error'>Usage: termopacity &lt;value&gt; (0-100 or 0.0-1.0) or 'termopacity reset'</div>", 'output-error-wrapper');
        appendToTerminal(`<div>Current terminal opacity: ${currentOpacityPercentage}</div>`, 'output-text-wrapper');
        return;
    }

    const inputValue = args[0].toLowerCase(); // The value can be a number or "reset"

    // The setTerminalOpacity function in terminalController now handles parsing,
    // validation, applying the style, and user feedback.
    if (terminalController.setTerminalOpacity) {
        terminalController.setTerminalOpacity(inputValue);
    } else {
        appendToTerminal("<div class='output-error'>Terminal opacity control not available.</div>", 'output-error-wrapper');
    }
}
