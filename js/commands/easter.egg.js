/**
 * @file js/commands/easter.egg.js
 * Handles the 'easter.egg' command which triggers a terminal glitch effect and a quote.
 */

export default async function easterEggCommand(args, context) {
  try {
    // ++ This is the fix. All variables must be destructured from the 'context' object.
    const {
      appendToTerminal,
      mainContentContainer,
      allMatrixChars,
      config,
      getFullWelcomeMessage,
    } = context;

    const easterEggConfig = config.easterEgg;
    const userConfig = config.user;

    const terminalOutput = document.getElementById("terminal-output");
    if (!terminalOutput || !mainContentContainer) return;

    appendToTerminal(
      `<div class='output-error'>${easterEggConfig.initialMessage}</div>`,
      "output-error-wrapper",
    );
    await new Promise((resolve) => setTimeout(resolve, 300));

    const overlay = document.createElement("div");
    overlay.className = "terminal-glitch-overlay";
    overlay.style.fontFamily = config.fonts.matrix;

    const originalPosition = mainContentContainer.style.position;
    mainContentContainer.style.position = "relative";
    mainContentContainer.appendChild(overlay);

    const computedStyle = getComputedStyle(terminalOutput);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
    const glitchFontSize = parseFloat(computedStyle.fontSize) || 12.5;
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
    const maxGlitchIntervals = easterEggConfig.maxGlitches;

    const finalizeEasterEgg = () => {
      if (mainContentContainer.contains(overlay)) {
        mainContentContainer.removeChild(overlay);
      }
      mainContentContainer.style.position = originalPosition;
      terminalOutput.innerHTML = "";

      const welcomeMessage = getFullWelcomeMessage
        ? getFullWelcomeMessage()
        : "System re-initialized.";
      appendToTerminal(
        welcomeMessage.replace(/\n/g, "<br/>"),
        "output-welcome-wrapper",
      );

      const quotes = easterEggConfig.quotes;
      let randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      randomQuote = randomQuote.replace("{{userName}}", userConfig.name || "User");

      appendToTerminal(
        `<div><br/><span class="output-success" style="font-size: 1.1em; text-align: center; display: block; padding: 1em 0;">"${randomQuote}"</span><br/></div>`,
        "output-success-wrapper",
      );

      const commandInput = document.getElementById("command-input");
      if (commandInput) commandInput.focus();
    };

    const glitchInterval = setInterval(() => {
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
    }, easterEggConfig.glitchInterval);

    setTimeout(() => {
      if (mainContentContainer.contains(overlay)) {
        clearInterval(glitchInterval);
        finalizeEasterEgg();
      }
    }, maxGlitchIntervals * easterEggConfig.glitchInterval + 500);
  } catch (err) {
    console.error("Easter egg error:", err);
    context.appendToTerminal(
      "<div class='output-error'>Easter egg malfunction. Please check console.</div>",
      "output-error-wrapper",
    );
  }
}