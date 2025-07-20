/**
 * @file js/commands/easter.egg.js
 * Handles the 'easter.egg' command which triggers a terminal glitch effect and a quote.
 */

async function activateTerminalGlitchAndQuote(context) {
  const { appendToTerminal, mainContentContainer, allMatrixChars, userConfig } =
    context;

  const terminalOutput = document.getElementById("terminal-output");
  if (!terminalOutput || !mainContentContainer) return;

  appendToTerminal(
    "<div class='output-error'>Initiating system override...</div>",
    "output-error-wrapper",
  );
  await new Promise((resolve) => setTimeout(resolve, 300));

  const overlay = document.createElement("div");
  overlay.className = "terminal-glitch-overlay";

  const currentRainCfg = context.rainOptions.getActiveRainConfig
    ? context.rainOptions.getActiveRainConfig()
    : {}; // Use context.rainOptions
  const glitchFontFamily =
    currentRainCfg.fontFamily || "MatrixA, MatrixB, monospace";
  overlay.style.fontFamily = glitchFontFamily;

  const originalPosition = mainContentContainer.style.position;
  mainContentContainer.style.position = "relative";
  mainContentContainer.appendChild(overlay);

  const computedStyle = getComputedStyle(terminalOutput);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
  const glitchFontSize =
    parseFloat(computedStyle.fontSize) ||
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--terminal-font-size",
      ),
    ) ||
    12.5;
  const charWidth = glitchFontSize * 0.6;

  const overlayRect = overlay.getBoundingClientRect();
  const containerRect = mainContentContainer.getBoundingClientRect();
  const overlayHeight =
    overlayRect.height > 0 ? overlayRect.height : containerRect.height;
  const overlayWidth =
    overlayRect.width > 0 ? overlayRect.width : containerRect.width;

  const lines = Math.max(1, Math.floor(overlayHeight / lineHeight));
  const charsPerLine = Math.max(1, Math.floor(overlayWidth / charWidth));
  let glitchIntervalCount = 0;
  const maxGlitchIntervals = 25;

  let glitchInterval = setInterval(() => {
    let glitchText = "";
    for (let i = 0; i < lines; i++) {
      for (let j = 0; j < charsPerLine; j++) {
        glitchText +=
          allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
      }
      glitchText += "\n";
    }
    overlay.textContent = glitchText;
    glitchIntervalCount++;
    if (glitchIntervalCount >= maxGlitchIntervals) {
      clearInterval(glitchInterval);
      finalizeEasterEgg();
    }
  }, 80);

  function finalizeEasterEgg() {
    if (mainContentContainer.contains(overlay)) {
      mainContentContainer.removeChild(overlay);
    }
    mainContentContainer.style.position = originalPosition;
    terminalOutput.innerHTML = "";

    // FIX 1.1: Explicitly use context.getFullWelcomeMessage
    const welcomeMessage = context.getFullWelcomeMessage
      ? context.getFullWelcomeMessage()
      : "System re-initialized.";
    appendToTerminal(
      welcomeMessage.replace(/\n/g, "<br/>"),
      "output-welcome-wrapper",
    );

    const { easterEggConfig, userConfig } = context;
    const quotes = easterEggConfig.quotes;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    appendToTerminal(
      `<div><br/><span class="output-success" style="font-size: 1.1em; text-align: center; display: block; padding: 1em 0;">"${randomQuote}"</span><br/></div>`,
      "output-success-wrapper",
    );

    const commandInput = document.getElementById("command-input");
    if (commandInput) commandInput.focus();
  }

  setTimeout(
    () => {
      if (mainContentContainer.contains(overlay)) {
        clearInterval(glitchInterval);
        finalizeEasterEgg();
      }
    },
    maxGlitchIntervals * 80 + 500,
  );
}

export default function easterEggCommand(args, context) {
  activateTerminalGlitchAndQuote(context).catch((err) => {
    console.error("Easter egg error:", err);
    context.appendToTerminal(
      "<div class='output-error'>Easter egg malfunction. Please check console.</div>",
      "output-error-wrapper",
    );
  });
}
