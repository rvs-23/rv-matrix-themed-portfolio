/**
 * @file matrix.js
 * Core logic for the Matrix Terminal Portfolio.
 * Handles DOM setup, loading screen, canvas animations, terminal I/O,
 * and overall page initialization.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const loadingScreen = document.getElementById('loading-screen');
    const matrixLoaderCharsEl = document.getElementById('matrix-loader-chars');
    const decryptStatusEl = document.getElementById('decrypt-status');
    const mainContentContainer = document.getElementById('contentContainer');
    const parallaxCanvasBg = document.getElementById('parallax-canvas-bg');
    const parallaxCtxBg = parallaxCanvasBg ? parallaxCanvasBg.getContext('2d') : null;
    const parallaxCanvasFg = document.getElementById('parallax-canvas-fg');
    const parallaxCtxFg = parallaxCanvasFg ? parallaxCanvasFg.getContext('2d') : null;
    const matrixRainCanvas = document.getElementById('matrix-canvas');
    const matrixRainCtx = matrixRainCanvas ? matrixRainCanvas.getContext('2d') : null;
    const allCanvases = [matrixRainCanvas, parallaxCanvasBg, parallaxCanvasFg].filter(Boolean);
    const terminalOutput = document.getElementById('terminal-output');
    const commandInput = document.getElementById('command-input');
    const navCvLink = document.getElementById('nav-cv-link');

    // --- Configuration Variables ---
    const rainFontSize = 13;
    const rainAnimationInterval = 90;
    const gridCellSize = 50;
    const numFgSymbols = 12;
    const allMatrixChars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?@#$%^&*()[]{};:\'"<>,./\\|';
    const parallaxSymbolChars = 'コンピュータサイエンスデータAIグリッドワイヤーフレーム012345ABCDEFネオン';

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    const commandHistory = [];
    let historyIndex = commandHistory.length;

    // --- Loading Screen Logic ---
    let loaderCharInterval;
    let statusCyclingInterval;
    const loadingMessages = [
        "DECRYPTING DATA STREAMS...", "CALIBRATING REALITY MATRIX...", "ESTABLISHING SECURE LINK...",
        "SYSTEM INTERFACE INITIALIZING...", "WELCOME TO THE GRID, USER."
    ];
    let currentLoadingMsgIndex = 0;

    /** Animates the block of random characters on the loading screen. */
    function animateLoaderMatrixChars() {
        if (!matrixLoaderCharsEl) return;
        let text = '';
        const lines = 4; const charsPerLine = 28;
        for (let i = 0; i < lines * charsPerLine; i++) {
            text += allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
            if ((i + 1) % charsPerLine === 0 && i < (lines * charsPerLine) - 1) text += '\n';
        }
        matrixLoaderCharsEl.textContent = text;
    }

    /** Updates the status message text on the loading screen. */
    function updateLoadingStatusMessage() {
        if (!decryptStatusEl) return;
        if (currentLoadingMsgIndex < loadingMessages.length) {
            decryptStatusEl.textContent = loadingMessages[currentLoadingMsgIndex];
            currentLoadingMsgIndex++;
        }
    }

    /** Handles hiding the loader and starting the main application logic. */
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

    window.onload = handleWindowLoad;

    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        loaderCharInterval = setInterval(animateLoaderMatrixChars, 120);
        animateLoaderMatrixChars();
        updateLoadingStatusMessage();
        statusCyclingInterval = setInterval(updateLoadingStatusMessage, 800);
    }

    /**
     * Appends content (HTML string) to the terminal output area.
     * @param {string} htmlContent - The HTML content to append.
     * @param {string} [type='output-text'] - A class for styling the output line.
     */
    function appendToTerminal(htmlContent, type = 'output-text') {
        if (!terminalOutput) return;
        const lineDiv = document.createElement('div');
        lineDiv.classList.add(type);
        lineDiv.innerHTML = htmlContent;
        terminalOutput.appendChild(lineDiv);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    /**
     * Gets current theme's primary, secondary, and trail colors from CSS custom properties.
     * @returns {{primary: string, secondary: string, trail: string}} Object containing color codes.
     */
    function getCurrentThemeColors() {
        if (typeof getComputedStyle !== 'undefined' && document.body) {
            const styles = getComputedStyle(document.body);
            return {
                primary: styles.getPropertyValue('--primary-color').trim() || '#0F0',
                secondary: styles.getPropertyValue('--secondary-color').trim() || '#00FFFF',
                trail: styles.getPropertyValue('--matrix-rain-trail-color').trim() || 'rgba(0,0,0,0.05)'
            };
        }
        return { primary: '#0F0', secondary: '#00FFFF', trail: 'rgba(0,0,0,0.05)' };
    }

    /**
     * Gets current themed monospace font family from CSS custom properties.
     * @returns {string} The current monospace font family.
     */
    function getCurrentFontFamily() {
         if (typeof getComputedStyle !== 'undefined' && document.body) return getComputedStyle(document.body).getPropertyValue('--font-mono-current').trim() || 'Fira Code, monospace';
         return 'Fira Code, monospace';
    }


    /** Main Initialization Function for Terminal and Graphics. */
    function initializeTerminalAndGraphics() {
        let columns = Math.floor(window.innerWidth / rainFontSize);
        const rainDrops = [];
        const fgParallaxSymbols = [];

        /** Resizes all canvases and reinitializes size-dependent graphics. */
        function resizeAllCanvases() {
            allCanvases.forEach(canvas => {
                if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
            });
            columns = Math.floor(window.innerWidth / rainFontSize);
            rainDrops.length = 0;
            for (let x = 0; x < columns; x++) rainDrops[x] = Math.floor(Math.random() * (window.innerHeight / rainFontSize));
            if (parallaxCanvasFg) initializeParallaxFgSymbols();
        }


        /** Draws a single frame of the Matrix rain effect. */
        function drawMatrixRain() {
            if (!matrixRainCtx) return;
            matrixRainCtx.fillStyle = getCurrentThemeColors().trail;
            matrixRainCtx.fillRect(0, 0, matrixRainCanvas.width, matrixRainCanvas.height);
            matrixRainCtx.fillStyle = getCurrentThemeColors().primary;
            matrixRainCtx.font = rainFontSize + 'px ' + getCurrentFontFamily();
            for (let i = 0; i < rainDrops.length; i++) {
                const text = allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
                matrixRainCtx.fillText(text, i * rainFontSize, rainDrops[i] * rainFontSize);
                if (rainDrops[i] * rainFontSize > matrixRainCanvas.height && Math.random() > 0.975) rainDrops[i] = 0;
                rainDrops[i]++;
            }
        }

        /** Draws the parallax background grid. */
        function drawParallaxBackground() {
            if (!parallaxCtxBg) return;
            parallaxCtxBg.clearRect(0, 0, parallaxCanvasBg.width, parallaxCanvasBg.height);
            const themeColors = getCurrentThemeColors();
            parallaxCtxBg.strokeStyle = themeColors.primary + '1A';
            parallaxCtxBg.lineWidth = 0.5;
            const offsetX = (mouseX / window.innerWidth - 0.5) * gridCellSize * 0.15;
            const offsetY = (mouseY / window.innerHeight - 0.5) * gridCellSize * 0.15;
            for (let x = -offsetX; x < parallaxCanvasBg.width + gridCellSize; x += gridCellSize) {
                parallaxCtxBg.beginPath(); parallaxCtxBg.moveTo(x, 0); parallaxCtxBg.lineTo(x, parallaxCanvasBg.height); parallaxCtxBg.stroke();
            }
            for (let y = -offsetY; y < parallaxCanvasBg.height + gridCellSize; y += gridCellSize) {
                parallaxCtxBg.beginPath(); parallaxCtxBg.moveTo(0, y); parallaxCtxBg.lineTo(parallaxCanvasBg.width, y); parallaxCtxBg.stroke();
            }
        }

        /** Initializes properties of foreground parallax symbols. */
        function initializeParallaxFgSymbols() {
            if (!parallaxCanvasFg) return;
            fgParallaxSymbols.length = 0;
            for (let i = 0; i < numFgSymbols; i++) {
                fgParallaxSymbols.push({
                    char: parallaxSymbolChars[Math.floor(Math.random() * parallaxSymbolChars.length)],
                    x: Math.random() * parallaxCanvasFg.width, y: Math.random() * parallaxCanvasFg.height,
                    size: Math.random() * 20 + 25,
                    vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
                    parallaxFactor: Math.random() * 0.02 + 0.01
                });
            }
        }


        /** Draws the floating foreground parallax symbols. */
        function drawParallaxForeground() {
            if (!parallaxCtxFg) return;
            parallaxCtxFg.clearRect(0, 0, parallaxCanvasFg.width, parallaxCanvasFg.height);
            const themeColors = getCurrentThemeColors();
            fgParallaxSymbols.forEach(s => {
                parallaxCtxFg.font = s.size + 'px ' + getCurrentFontFamily();
                parallaxCtxFg.fillStyle = themeColors.primary + '55';
                const targetX = s.x - (mouseX - parallaxCanvasFg.width / 2) * s.parallaxFactor;
                const targetY = s.y - (mouseY - parallaxCanvasFg.height / 2) * s.parallaxFactor;
                s.x += s.vx + (targetX - s.x) * 0.01; s.y += s.vy + (targetY - s.y) * 0.01;
                if (s.x < -s.size) s.x = parallaxCanvasFg.width + s.size; if (s.x > parallaxCanvasFg.width + s.size) s.x = -s.size;
                if (s.y < -s.size) s.y = parallaxCanvasFg.height + s.size; if (s.y > parallaxCanvasFg.height + s.size) s.y = -s.size;
                parallaxCtxFg.fillText(s.char, s.x, s.y);
            });
        }

        resizeAllCanvases();
        if (parallaxCanvasFg) initializeParallaxFgSymbols();

        let rainIntervalId;
        /** Master animation loop for effects driven by requestAnimationFrame. */
        function masterAnimationLoop() {
            if (parallaxCtxBg) drawParallaxBackground();
            if (parallaxCtxFg) drawParallaxForeground();
            requestAnimationFrame(masterAnimationLoop);
        }

        if (matrixRainCtx || parallaxCtxBg || parallaxCtxFg) {
            if (matrixRainCtx) { if(rainIntervalId) clearInterval(rainIntervalId); rainIntervalId = setInterval(drawMatrixRain, rainAnimationInterval); }
            requestAnimationFrame(masterAnimationLoop);
        }

        // User Details (passed to commands.js)
        const userDetails = {
            userName: "Rishav Sharma",
            userTitle: "Software Engineer / Data Scientist",
            githubUser: "rvs-23",
            linkedinUser: "rishav-sharma-23rvs",
            mediumUser: "rvs",
            emailAddress: "23rishavsharma@gmail.com",
            cvLink: "https://drive.google.com/file/d/1Iuc5cFy34BkkRYLZPeGUOMGZNdGUOz-n/view?usp=sharing"
        };
        if (navCvLink) navCvLink.href = userDetails.cvLink;

        const bioContent = `Currently working as a Data Scientist, I'm a curious developer passionate about the full spectrum of software and data development. My interests span from foundational data engineering and robust back-end systems to the cutting edge of Machine Learning, Deep Learning, and Large Language Models. I enjoy coding and architecting solutions across this entire stack.`;
        
	const focusContent = `Building intuitive digital experiences, developing intelligent AI models, and engineering scalable data solutions. I thrive on continuous learning and applying elegant approaches to complex challenges in technology.`;
        
	const githubLink = `<a href="https://github.com/${userDetails.githubUser}" target="_blank" rel="noopener noreferrer">${userDetails.githubUser} @ The Grid</a>`;
        
	const fullBioText = `Name: ${userDetails.userName}\nTitle: ${userDetails.userTitle}\nBio: ${bioContent}\nFocus: ${focusContent}\nDigital Self: ${githubLink}`;

        const plainNameArt = `<span class="ascii-name">${userDetails.userName.toUpperCase()}</span>`;
        const welcomeText = `Welcome to ${userDetails.userName}'s Terminal.\nType 'help' to see available commands.\n---------------------------------------------------`;
        const fullWelcomeMessageString = `${plainNameArt}\n${welcomeText}`;

        // Context object to pass necessary functions/data to commands.js
        const commandHandlerContext = {
            appendToTerminal,
            fullWelcomeMessageString,
            userDetails,
            fullBioText,
            mainContentContainer,
            allMatrixChars,
        };
        // Get command definitions from commands.js (getTerminalCommands is expected to be defined in commands.js)
        const terminalCommands = getTerminalCommands(commandHandlerContext);

        /** Handles command input from the user. */
        if (commandInput) {
            commandInput.addEventListener('keydown', (e) => {
                let setInputHandled = false;
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (commandHistory.length > 0) {
                        if (historyIndex <= 0) { historyIndex = commandHistory.length - 1; }
                        else { historyIndex--; }
                        commandInput.value = commandHistory[historyIndex];
                        setInputHandled = true;
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIndex < commandHistory.length -1 ) {
                        historyIndex++;
                        commandInput.value = commandHistory[historyIndex];
                        setInputHandled = true;
                    } else if (historyIndex === commandHistory.length -1 || historyIndex === commandHistory.length ) {
                        historyIndex = commandHistory.length;
                        commandInput.value = '';
                        setInputHandled = true;
                    }
                }

                if(setInputHandled) {
                    setTimeout(() => commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length), 0);
                }

                if (e.key === 'Enter') {
                    e.preventDefault();
                    const fullCommand = commandInput.value.trim();
                    if (fullCommand) {
                        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== fullCommand) {
                           commandHistory.push(fullCommand);
                        }
                        historyIndex = commandHistory.length;

                        const sanitizedCommand = fullCommand.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        appendToTerminal(`<span class="prompt-arrow">&gt;</span> <span class="output-command">${sanitizedCommand}</span>`);

                        let commandNameVal;
                        let argsVal = [];
                        const commandParts = [];
                        let inQuotes = false;
                        let currentPart = "";

                        for (let i = 0; i < fullCommand.length; i++) {
                            const char = fullCommand[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                                if(inQuotes || (!inQuotes && currentPart.length > 0) ) {
                                    currentPart += char;
                                }
                                if (!inQuotes && currentPart.endsWith('"')) {
                                     if (currentPart) commandParts.push(currentPart);
                                     currentPart = "";
                                }
                            } else if (char === ' ' && !inQuotes) {
                                if (currentPart) {
                                    commandParts.push(currentPart);
                                    currentPart = "";
                                }
                            } else {
                                currentPart += char;
                            }
                        }
                        if (currentPart) commandParts.push(currentPart);

                        if (commandParts.length > 0) {
                            commandNameVal = commandParts[0].toLowerCase();
                            argsVal = commandParts.slice(1).map(arg => {
                                if (arg.startsWith('"') && arg.endsWith('"')) {
                                    return arg.substring(1, arg.length - 1);
                                }
                                return arg;
                            });
                        } else {
                            commandNameVal = fullCommand.toLowerCase();
                        }

                        const commandFunc = terminalCommands[commandNameVal];

                        if (typeof commandFunc === 'function') {
                            const result = commandFunc(argsVal);
                            if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                                result.catch(err => {
                                    console.error("Error executing async command:", err);
                                    appendToTerminal(`Async Command Error: ${err.message}`, 'output-error');
                                });
                            }
                        } else {
                            appendToTerminal(`Command not found: ${commandNameVal.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`, 'output-error');
                            appendToTerminal(`Type 'help' for commands.`);
                        }
                    }
                    commandInput.value = '';
                    if (terminalOutput) terminalOutput.scrollTop = terminalOutput.scrollHeight;
                }
            });
        }

        /** Displays the initial welcome message in the terminal. */
        function displayInitialWelcomeMessage() {
            if (terminalOutput) appendToTerminal(fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome');
            if (commandInput) commandInput.focus();
        }

        if (terminalOutput) displayInitialWelcomeMessage();

        // --- Global Event Listeners ---
        window.addEventListener('resize', resizeAllCanvases);
        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    } // End of initializeTerminalAndGraphics()
}); // End of DOMContentLoaded
