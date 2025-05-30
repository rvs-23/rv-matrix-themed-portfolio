/**
 * @file matrix.js
 * Core logic for the Matrix Terminal Portfolio.
 * Handles DOM setup, loading screen, new Matrix rain animation, terminal I/O,
 * and overall page initialization.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const loadingScreen = document.getElementById('loading-screen');
    const matrixLoaderCharsEl = document.getElementById('matrix-loader-chars');
    const decryptStatusEl = document.getElementById('decrypt-status');
    const mainContentContainer = document.getElementById('contentContainer');
    const matrixRainCanvas = document.getElementById('matrix-canvas'); // Uses existing ID
    const matrixRainCtx = matrixRainCanvas ? matrixRainCanvas.getContext('2d') : null;
    const terminalOutput = document.getElementById('terminal-output');
    const commandInput = document.getElementById('command-input');
    const navCvLink = document.getElementById('nav-cv-link');
    const navMediumLink = document.getElementById('nav-medium-link');

    const defaultTerminalSize = {
        width: '45vw',
        height: '40vh'
    };

    // --- All Matrix Chars (for Easter Egg, etc.) ---
    const allMatrixCharsGlobal = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?@#$%^&*()[]{};:\'"<>,./\\|';

    /**
     * MATRIX-RAIN CONFIG PARAMETERS
     * ──────────────────────────────
     *
     * speed: time gap (ms) between frames
     *     30  : very fast animation, CPU-heavier
     *     120 : leisurely drip, lighter load
     *
     * font: glyph size in pixels (sets column width)
     *     12  : dense “micro” rain
     *     28  : huge billboard-style characters
     *
     * lineH: line-height factor (row spacing)
     *     0.8 : rows overlap slightly, tighter curtain
     *     1.2 : airy spacing, individual glyphs isolated
     *
     * density: fraction of columns that are active rain
     *     0.50 : half the screen sprinkled with streams
     *     1.20 : over-populate – columns can overlap
     *
     * minTrail: shortest possible stream length (rows)
     *     5   : stubby drips that vanish quickly
     *     30  : longer ribbons before fading
     *
     * maxTrail: longest possible stream length (rows)
     *     40  : moderate tails
     *     90  : epic, screen-filling streaks
     *
     * headGlowMin: minimum glowing-head length (rows)
     *     1 : single bright leader
     *     4 : small flare at stream front
     *
     * headGlowMax: maximum glowing-head length (rows)
     *     3 : always compact glow
     *     10: occasional comet-like flare
     *
     * blur: max shadow-blur radius for glowing glyphs (px)
     *     0  : crisp neon
     *     15 : soft blooming glow
     *
     * trailMutate: frames between random glyph swaps inside a trail
     *     30  : jittery, high “code” churn
     *     300 : almost static tails
     *
     * fade: alpha of black overlay painted each frame
     *     0.05 : persistent trails, slow fade-out
     *     0.40 : quick dissolve, airy rain
     *
     * decayBase: exponential per-glyph brightness falloff (0.7–0.99)
     *     0.85 : steep fade down the column
     *     0.97 : gentle, lingering glow
     *
     * baseCol: regular glyph colour
     *     \"#0aff0a\" : classic Matrix green
     *     \"#00dfff\" : bright cyan variant
     *
     * headCol: colour of glowing head glyphs
     *     \"#c8ffc8\" : pale green highlight
     *     \"#ffffff\" : stark white leaders
     *
     * fontFamily: font stack used to render glyphs
     *     \"MatrixA, MatrixB, monospace\" : custom glyph fonts
     *     \"Courier New, monospace\"      : fallback terminal look
     *
     * layers: number of depth planes for parallax opacity
     *     1 : flat, uniform rain
     *     5 : multi-layered depth illusion
     *
     * layerOp: array giving base opacity per depth layer (front → back)
     *     [1,0.7,0.5] : subtle dimming with distance
     *     [1,0.5,0.25,0.1] : pronounced foreground vs. background
     *
     * delChance: probability (0–1) a column is an invisible “eraser” stream
     *     0.00 : no deletion, constant brightness
     *     0.10 : frequent vanishing columns for dynamic gaps
     */
    const DEFAULT_CFG = {
        speed: 90, 
        font: 19,  
        lineH: 1,
        density: 0.95,
        minTrail: 11, 
        maxTrail: 69,
        headGlowMin: 1,
        headGlowMax: 7,
        blur: 15, 
        trailMutate: 150,
        fade: 0.15,
        decayBase: 0.92,
        baseCol: "#0aff0a",
        headCol: "#c8ffc8",
        fontFamily: "MatrixA, MatrixB, monospace", // Uses new fonts
        layers: 3,
        layerOp: [1, 0.7, 0.5],
        delChance: 0.04
    };
    let CFG = { ...DEFAULT_CFG };

    const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ" +
                   "0123456789" + "CKUVFRZ" + "*|:=<>-_";

    let TOTAL_COLS, ACTIVE_COL_INDICES = [], streams = [], ROWS, colW;
    let rainAnimationRequestID;

    const randInt = (n) => Math.floor(Math.random() * n);
    const randChar = () => GLYPHS[randInt(GLYPHS.length)];
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = randInt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function resizeRainCanvasAndStreams() {
        if (!matrixRainCanvas || !matrixRainCtx) return;

        matrixRainCanvas.width = window.innerWidth;
        matrixRainCanvas.height = window.innerHeight;

        matrixRainCtx.font = `${CFG.font}px ${CFG.fontFamily}`;
        matrixRainCtx.textBaseline = "top";
        colW = CFG.font; // monospaced assumption
        TOTAL_COLS = Math.floor(innerWidth / colW);
        ROWS = Math.floor(innerHeight / (CFG.font * CFG.lineH));

        const targetActiveCols = Math.max(1, Math.floor(TOTAL_COLS * CFG.density));
        ACTIVE_COL_INDICES = shuffle([...Array(TOTAL_COLS).keys()]).slice(0, targetActiveCols);

        streams = ACTIVE_COL_INDICES.map(index => new Stream(index));
        if (matrixRainCtx && CFG.headCol) { // Ensure shadowColor is set after CFG might be updated
             matrixRainCtx.shadowColor = CFG.headCol;
        }
    }

    class Stream {
        constructor(colIndex) {
            this.col = colIndex;
            this.dy  = 1 + Math.random() * 0.15; // 1–1.15 rows per tick
            this.reset();
        }

        reset() {
            this.layer   = randInt(CFG.layers);
            this.opacity = CFG.layerOp[this.layer];
            this.del     = Math.random() < CFG.delChance;
            this.len     = CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail);
            this.headGlow = CFG.headGlowMin + randInt(CFG.headGlowMax - CFG.headGlowMin + 1);

            // Start as far as one full screen above viewport
            this.head = -randInt(ROWS + this.len);

            this.buf  = Array.from({ length: ROWS }, randChar);
            this.tick = 0;
        }

        step() {
            this.head += this.dy;                  // ← use dy
            if (this.head >= 0 && this.head < ROWS) this.buf[this.head] = randChar();

            if (++this.tick >= CFG.trailMutate) {
            this.tick = 0;
            for (let r = 0; r < ROWS; r++)
                if (Math.random() < 0.15) this.buf[r] = randChar();
            }

            if (this.head > ROWS) this.reset();    // continuous flow
         }
        draw() {
            if (!matrixRainCtx) return;
            const x = this.col * colW;
            for (let r = 0; r < ROWS; r++) {
                const t = this.head - r;
                if (t < 0 || t >= this.len) continue;
                if (this.del) continue;

                let alpha = Math.pow(CFG.decayBase, t) * this.opacity;
                let colour = CFG.baseCol, blur = 0;

                if (t < this.headGlow) {
                    colour = CFG.headCol;
                    alpha *= 1 - (t / this.headGlow) * 0.5;
                    blur = CFG.blur * (1 - t / this.headGlow);
                }
                matrixRainCtx.globalAlpha = alpha;
                matrixRainCtx.fillStyle = colour;
                matrixRainCtx.shadowBlur = blur;
                // FillText can be slow, ensure valid coordinates
                if (x >= 0 && (r * CFG.font * CFG.lineH) >=0) {
                    matrixRainCtx.fillText(this.buf[r], x, r * CFG.font * CFG.lineH);
                }
            }
        }
    }

    function rainTick() {
        if (!matrixRainCtx || !matrixRainCanvas) return;
        
        matrixRainCtx.shadowBlur = 0;
        matrixRainCtx.globalAlpha = CFG.fade;
        matrixRainCtx.fillStyle = getCurrentThemeColors().background; // Use theme background for fade
        matrixRainCtx.fillRect(0, 0, matrixRainCanvas.width, matrixRainCanvas.height);

        matrixRainCtx.globalAlpha = 1; // Reset globalAlpha for drawing streams
         if (matrixRainCtx && CFG.headCol) { // Ensure shadowColor for head glow
             matrixRainCtx.shadowColor = CFG.headCol;
        }
        for (const s of streams) { s.step(); s.draw(); }

        rainAnimationRequestID = setTimeout(rainTick, CFG.speed);
    }

    function startRainAnimation() {
        if (rainAnimationRequestID) {
            clearTimeout(rainAnimationRequestID);
        }
        updateRainColorsFromTheme(); // Ensure colors are set before first draw
        resizeRainCanvasAndStreams(); // Initial setup
        rainTick(); // Start the loop
    }
    // --- End of New Matrix Rain Logic ---

    const commandHistory = [];
    let historyIndex = commandHistory.length;
    const konamiCodeSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiCodeIndex = 0;
    let crtModeActive = false;
    let loaderCharInterval;
    let statusCyclingInterval;
    const loadingMessages = [
        "DECRYPTING DATA STREAMS...", "CALIBRATING REALITY MATRIX...", "ESTABLISHING SECURE LINK...",
        "SYSTEM INTERFACE INITIALIZING...", "WELCOME TO THE GRID, USER."
    ];
    let currentLoadingMsgIndex = 0;

    function animateLoaderMatrixChars() {
        if (!matrixLoaderCharsEl) return;
        let text = '';
        const lines = 4; const charsPerLine = 28;
        for (let i = 0; i < lines * charsPerLine; i++) {
            text += allMatrixCharsGlobal[Math.floor(Math.random() * allMatrixCharsGlobal.length)];
            if ((i + 1) % charsPerLine === 0 && i < (lines * charsPerLine) - 1) text += '\n';
        }
        matrixLoaderCharsEl.textContent = text;
    }

    function updateLoadingStatusMessage() {
        if (!decryptStatusEl) return;
        if (currentLoadingMsgIndex < loadingMessages.length) {
            decryptStatusEl.textContent = loadingMessages[currentLoadingMsgIndex];
            currentLoadingMsgIndex++;
        }
    }

    const handleWindowLoad = () => {
        if (loadingScreen) {
            if (loaderCharInterval) clearInterval(loaderCharInterval);
            if (statusCyclingInterval) clearInterval(statusCyclingInterval);
            if (decryptStatusEl) decryptStatusEl.textContent = loadingMessages[loadingMessages.length - 1] || "SYSTEM ONLINE.";
            setTimeout(() => {
                if (loadingScreen) loadingScreen.classList.add('hidden');
                if (mainContentContainer) mainContentContainer.style.opacity = '1';
                initializeTerminalAndGraphics();
            }, 600);
        } else {
            if (mainContentContainer) mainContentContainer.style.opacity = '1';
            initializeTerminalAndGraphics();
        }
    };

    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        loaderCharInterval = setInterval(animateLoaderMatrixChars, 120);
        animateLoaderMatrixChars(); updateLoadingStatusMessage();
        statusCyclingInterval = setInterval(updateLoadingStatusMessage, 800);
    }
    window.onload = handleWindowLoad;

    function appendToTerminal(htmlContent, type = 'output-text') {
        if (!terminalOutput) return null;
        const lineDiv = document.createElement('div');
        lineDiv.classList.add(type);
        lineDiv.innerHTML = htmlContent;
        terminalOutput.appendChild(lineDiv);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        return lineDiv;
    }

    function getCurrentThemeColors() {
        if (typeof getComputedStyle !== 'undefined' && document.body) {
            const styles = getComputedStyle(document.body);
            return {
                primary: styles.getPropertyValue('--primary-color').trim() || DEFAULT_CFG.baseCol,
                // secondary: styles.getPropertyValue('--secondary-color').trim() || '#00FFFF', // Not directly used by new rain
                // trail: styles.getPropertyValue('--matrix-rain-trail-color').trim() || 'rgba(0,0,0,0.05)', // New rain uses fade
                glow: styles.getPropertyValue('--matrix-rain-glow-color').trim() || DEFAULT_CFG.headCol,
                background: styles.getPropertyValue('--background-color').trim() || '#000',
            };
        }
        return { primary: DEFAULT_CFG.baseCol, glow: DEFAULT_CFG.headCol, background: '#000' };
    }
    
    function updateRainColorsFromTheme() {
        const themeColors = getCurrentThemeColors();
        CFG.baseCol = themeColors.primary;
        CFG.headCol = themeColors.glow;
        // CFG.fade is not directly a color, but background for fade is set in rainTick
         if (matrixRainCtx && CFG.headCol) { // Update shadow color for glow
            matrixRainCtx.shadowColor = CFG.headCol;
        }
    }


    function resizeTerminalElement(width, height) {
        if (mainContentContainer) {
            mainContentContainer.style.width = width;
            mainContentContainer.style.height = height;
        }
    }

    // Interface for commands.js to interact with new rain CFG
    function getRainConfigForCommand() {
        // Return a copy to prevent direct modification from outside, though CFG is global here
        return { ...CFG };
    }

    function updateRainConfigFromCommand(param, value) {
        const MAPPINGS = { // Maps command-friendly names to CFG keys if different, and provides validation/parsing
            speed: { key: 'speed', type: 'int', min: 10, max: 500 },
            fontSize: { key: 'font', type: 'int', min: 8, max: 40 },
            lineHeight: { key: 'lineH', type: 'float', min: 0.5, max: 2.0 },
            density: { key: 'density', type: 'float', min: 0.1, max: 2.0 },
            minTrail: { key: 'minTrail', type: 'int', min: 1, max: 100 },
            maxTrail: { key: 'maxTrail', type: 'int', min: 1, max: 100 }, // Should be >= minTrail
            headGlowMin: { key: 'headGlowMin', type: 'int', min: 0, max: 20 },
            headGlowMax: { key: 'headGlowMax', type: 'int', min: 0, max: 20 }, // Should be >= headGlowMin
            glowBlur: { key: 'blur', type: 'int', min: 0, max: 20 }, // Renamed from CFG.blur to avoid confusion
            trailMutationSpeed: { key: 'trailMutate', type: 'int', min: 10, max: 1000 },
            fadeSpeed: { key: 'fade', type: 'float', min: 0.01, max: 1.0 },
            decayRate: { key: 'decayBase', type: 'float', min: 0.7, max: 0.99 },
            // baseColor: { key: 'baseCol', type: 'string_color' }, // Theming handles colors
            // headColor: { key: 'headCol', type: 'string_color' }, // Theming handles colors
            fontFamily: {key: 'fontFamily', type: 'string_font'}, // Keep if you want to allow font changes
            layers: {key: 'layers', type: 'int', min: 1, max: 5},
            eraserChance: {key: 'delChance', type: 'float', min: 0, max: 1}
        };

        const setting = MAPPINGS[param];
        if (!setting) {
            if(terminalOutput) appendToTerminal(`Unknown rain config parameter: ${param}`, 'output-error');
            return false;
        }

        let parsedValue = value;
        let isValid = true;

        switch (setting.type) {
            case 'int':
                parsedValue = parseInt(value, 10);
                if (isNaN(parsedValue) || parsedValue < setting.min || parsedValue > setting.max) isValid = false;
                break;
            case 'float':
                parsedValue = parseFloat(value);
                if (isNaN(parsedValue) || parsedValue < setting.min || parsedValue > setting.max) isValid = false;
                break;
            case 'string_font': // Basic validation for font family string
                parsedValue = String(value).trim();
                 // Example: Allow "MatrixA, MatrixB, monospace" or "Courier New, monospace"
                if (!/^[a-zA-Z0-9\s,-]+$/.test(parsedValue)) {
                    isValid = false;
                    if(terminalOutput) appendToTerminal(`Invalid font family format. Use letters, numbers, spaces, commas, hyphens.`, 'output-error');
                }
                break;
            // 'string_color' case removed as colors are handled by themes primarily.
            default: // For other string types or direct assignment
                parsedValue = String(value);
                break;
        }
        
        if (setting.key === 'maxTrail' && parsedValue < CFG.minTrail) {
            appendToTerminal(`Error: maxTrail (${parsedValue}) cannot be less than minTrail (${CFG.minTrail}).`, 'output-error');
            isValid = false;
        }
        if (setting.key === 'minTrail' && parsedValue > CFG.maxTrail) {
            appendToTerminal(`Error: minTrail (${parsedValue}) cannot be greater than maxTrail (${CFG.maxTrail}).`, 'output-error');
            isValid = false;
        }
         if (setting.key === 'headGlowMax' && parsedValue < CFG.headGlowMin) {
            appendToTerminal(`Error: headGlowMax (${parsedValue}) cannot be less than headGlowMin (${CFG.headGlowMin}).`, 'output-error');
            isValid = false;
        }
        if (setting.key === 'headGlowMin' && parsedValue > CFG.headGlowMax) {
            appendToTerminal(`Error: headGlowMin (${parsedValue}) cannot be greater than headGlowMax (${CFG.headGlowMax}).`, 'output-error');
            isValid = false;
        }


        if (!isValid && terminalOutput) {
            appendToTerminal(`Invalid value for ${param}. Please check range or type. Min: ${setting.min}, Max: ${setting.max}`, 'output-error');
            return false;
        }

        CFG[setting.key] = parsedValue;
        // If font size or family changes, a full resize of canvas and streams is good.
        if (setting.key === 'font' || setting.key === 'fontFamily' || setting.key === 'density' || setting.key === 'lineH') {
            resizeRainCanvasAndStreams();
        }
        return true;
    }

    function resetRainConfigToDefaults() {
        CFG = { ...DEFAULT_CFG };
        updateRainColorsFromTheme(); // Re-apply theme colors over default CFG colors
        resizeRainCanvasAndStreams(); // Apply changes like font size, density
    }
    
    function restartRainAfterThemeChange() {
        updateRainColorsFromTheme();
        // No need to fully stop/start the rainTick loop if only colors change,
        // but if font or density were part of theme, resizeRainCanvasAndStreams() would be needed.
        // For now, assume themes primarily change colors reflected in CFG.baseCol/headCol.
        // The rainTick will pick up new CFG values.
        // If font size or density changes with theme, then:
        // resizeRainCanvasAndStreams();
    }


    let fullWelcomeMessageStringGlobal = '';

    function toggleCrtMode(activate) {
        crtModeActive = typeof activate === 'boolean' ? activate : !crtModeActive;
        document.body.classList.toggle('crt-mode', crtModeActive);
        if (typeof activate === 'boolean' && terminalOutput) {
            appendToTerminal(`Analog Channel Override: CRT Mode ${crtModeActive ? 'Engaged' : 'Disengaged'}. Frequency aligned.`, 'output-success');
        }
        if (commandInput) commandInput.focus();
    }

    function globalKeydownHandler(e) {
        const key = e.key; // Case sensitive for 'b', 'a' in Konami
        if (e.target === commandInput || e.target.tagName === 'A') {
            if (key === 'Escape' && document.activeElement === commandInput) {
                commandInput.blur();
            }
            return;
        }

        if (key === konamiCodeSequence[konamiCodeIndex]) {
            konamiCodeIndex++;
            if (konamiCodeIndex === konamiCodeSequence.length) {
                toggleCrtMode(); konamiCodeIndex = 0;
                if (document.activeElement !== commandInput) e.preventDefault();
            }
        } else if (key === konamiCodeSequence[0] && konamiCodeIndex > 0) {
            konamiCodeIndex = 1;
        } else { konamiCodeIndex = 0; }
    }

    function initializeTerminalAndGraphics() {
        startRainAnimation(); // Start the new rain animation

        const userDetails = {
            userName: "Rishav Sharma", userTitle: "Software Engineer / Data Scientist",
            githubUser: "rvs-23", linkedinUser: "rishav-sharma-23rvs", mediumUser: "rvs",
            emailAddress: "23rishavsharma@gmail.com",
            cvLink: "https://drive.google.com/file/d/1Iuc5cFy34BkkRYLZPeGUOMGZNdGUOz-n/view?usp=sharing"
        };
        if (navCvLink) navCvLink.href = userDetails.cvLink;
        if (navMediumLink && userDetails.mediumUser) navMediumLink.href = `https://medium.com/@${userDetails.mediumUser}`;
        else if (navMediumLink) navMediumLink.style.display = 'none';

        const bioContent = `Currently working as a Data Scientist, I'm a curious developer passionate about the full spectrum of software and data development. My interests span from foundational data engineering and robust back-end systems to the cutting edge of Machine Learning, Deep Learning, and Large Language Models. I enjoy coding and architecting solutions across this entire stack.`;
        const focusContent = `Building intuitive digital experiences, developing intelligent AI models, and engineering scalable data solutions. I thrive on continuous learning and applying elegant approaches to complex challenges in technology.`;
        const githubLink = `<a href="https://github.com/${userDetails.githubUser}" target="_blank" rel="noopener noreferrer">${userDetails.githubUser} @ The Grid</a>`;
        const fullBioText = `Name: ${userDetails.userName}\nTitle: ${userDetails.userTitle}\nBio: ${bioContent}\nFocus: ${focusContent}\nDigital Self: ${githubLink}`;

        const plainNameArt = `<span class="ascii-name">${userDetails.userName.toUpperCase()}</span>`;
        const welcomeText = `Welcome to ${userDetails.userName}'s Terminal.\nType 'help' to see available commands.\n---------------------------------------------------`;
        fullWelcomeMessageStringGlobal = `${plainNameArt}\n${welcomeText}`;

        const commandHandlerContext = {
            appendToTerminal, fullWelcomeMessageString: fullWelcomeMessageStringGlobal,
            userDetails, fullBioText, mainContentContainer, allMatrixChars: allMatrixCharsGlobal,
            resizeTerminalElement, defaultTerminalSize,
            getRainConfig: getRainConfigForCommand, // Updated function
            updateRainConfig: updateRainConfigFromCommand, // Updated function
            resetRainConfig: resetRainConfigToDefaults, // Updated function
            restartMatrixRain: restartRainAfterThemeChange, // For theme changes
        };
        const terminalCommands = getTerminalCommands(commandHandlerContext); // From commands.js

        if (commandInput) {
            commandInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (commandInput.disabled) return;
                    e.preventDefault(); const fullCommandText = commandInput.value.trim();
                    if (fullCommandText) {
                        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== fullCommandText) {
                            commandHistory.push(fullCommandText);
                        }
                        historyIndex = commandHistory.length;
                        const sanitizedCommandDisplay = fullCommandText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        appendToTerminal(`<span class="prompt-arrow">&gt;</span> <span class="output-command">${sanitizedCommandDisplay}</span>`);
                        const parts = []; let inQuotes = false; let currentPart = "";
                        for (let i = 0; i < fullCommandText.length; i++) {
                            const char = fullCommandText[i];
                            if (char === '"') { inQuotes = !inQuotes; }
                            else if (char === ' ' && !inQuotes) { if (currentPart) parts.push(currentPart); currentPart = ""; }
                            else { currentPart += char; }
                        }
                        if (currentPart) parts.push(currentPart);
                        const commandName = parts[0] ? parts[0].toLowerCase() : "";
                        const args = parts.slice(1);

                        const commandFunc = terminalCommands[commandName];
                        if (typeof commandFunc === 'function') {
                            const result = commandFunc(args);
                            if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                                result.catch(err => { console.error("Error executing async command:", commandName, err); appendToTerminal(`Async Command Error: ${err.message || 'Unknown error'}`, 'output-error'); });
                            }
                        } else if (commandName) {
                            appendToTerminal(`Command not found: ${commandName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`, 'output-error');
                            appendToTerminal(`Type 'help' for a list of available commands.`);
                        }
                    }
                    commandInput.value = ''; if (terminalOutput) terminalOutput.scrollTop = terminalOutput.scrollHeight;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault(); if (commandHistory.length > 0) {
                        historyIndex = Math.max(0, historyIndex - 1); commandInput.value = commandHistory[historyIndex] || "";
                        setTimeout(() => commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length), 0);
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault(); if (historyIndex < commandHistory.length - 1) {
                        historyIndex++; commandInput.value = commandHistory[historyIndex];
                    } else { historyIndex = commandHistory.length; commandInput.value = ''; }
                    setTimeout(() => commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length), 0);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                }
            });
            if (mainContentContainer) {
                mainContentContainer.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT') {
                        if (commandInput) commandInput.focus();
                    }
                });
            }
        }

        function displayInitialWelcomeMessage() {
            if (terminalOutput) appendToTerminal(fullWelcomeMessageStringGlobal.replace(/\n/g, '<br/>'), 'output-welcome');
            if (commandInput) commandInput.focus();
        }

        if (terminalOutput) displayInitialWelcomeMessage();

        window.addEventListener('resize', () => {
             resizeRainCanvasAndStreams(); // Important for new rain
        });
        // Mouse move listener for parallax removed
        document.addEventListener('keydown', globalKeydownHandler);
    }
});