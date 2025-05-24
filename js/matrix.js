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

    // --- Konami Code ---
    const konamiCodeSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiCodeIndex = 0;
    let crtModeActive = false;

    // --- ASCII Neural Network Visualization ---
    let nnVisInterval = null;
    let nnVisContainer = null;
    const nnVisFrameRate = 120; // ms per frame, faster for smoother pulse
    const nnVisDuration = 20000; // 20 seconds
    let nnVisPulseState = {
        currentSegment: 0, // segment index (0 to numConnections -1)
        positionInSegment: 0, // 0 to connectionLength -1
        direction: 1, // 1 for forward, -1 for backward (not used yet, but for future)
        activeNodes: []
    };
    let nnCurrentLayerConfig = [3, 5, 4, 2]; // Default layer configuration
    const nnNodeChars = {
        default: "( o )",
        active:  "( @ )", // When pulse hits a node
        pulsing: "( * )"  // Alternative active state
    };
    const nnConnectionChars = {
        empty: " ",
        horizontal: "─",
        pulse: "●", // Small filled circle for pulse
        pulseTrail: "·" // Smaller dot for trail
    };
    const nnConnectionLength = 5; // Number of characters for connection segment between layers
    const nnVerticalSpacing = 1; // Lines between rows of nodes if stacked vertically

    // --- Loading Screen Logic ---
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
            text += allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
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

    window.onload = handleWindowLoad;

    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        loaderCharInterval = setInterval(animateLoaderMatrixChars, 120);
        animateLoaderMatrixChars();
        updateLoadingStatusMessage();
        statusCyclingInterval = setInterval(updateLoadingStatusMessage, 800);
    }

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
                primary: styles.getPropertyValue('--primary-color').trim() || '#0F0',
                secondary: styles.getPropertyValue('--secondary-color').trim() || '#00FFFF',
                trail: styles.getPropertyValue('--matrix-rain-trail-color').trim() || 'rgba(0,0,0,0.05)'
            };
        }
        return { primary: '#0F0', secondary: '#00FFFF', trail: 'rgba(0,0,0,0.05)' };
    }

    function getCurrentFontFamily() {
         if (typeof getComputedStyle !== 'undefined' && document.body) return getComputedStyle(document.body).getPropertyValue('--font-mono-current').trim() || 'Fira Code, monospace';
         return 'Fira Code, monospace';
    }

    let fullWelcomeMessageStringGlobal = '';

    function toggleCrtMode(activate) {
        crtModeActive = typeof activate === 'boolean' ? activate : !crtModeActive;
        document.body.classList.toggle('crt-mode', crtModeActive);
        if (typeof activate === 'boolean' && terminalOutput) {
             appendToTerminal(`1980s Mode ${crtModeActive ? 'Engaged' : 'Disengaged'}. Dialing back to the future...`, 'output-success');
        }
        if (commandInput) commandInput.focus();
    }

    function globalKeydownHandler(e) {
        const key = e.key.toLowerCase();
        if (key === konamiCodeSequence[konamiCodeIndex].toLowerCase()) {
            konamiCodeIndex++;
            if (konamiCodeIndex === konamiCodeSequence.length) {
                toggleCrtMode();
                konamiCodeIndex = 0;
                if (document.activeElement !== commandInput) e.preventDefault();
            }
        } else if (key === konamiCodeSequence[0].toLowerCase() && konamiCodeIndex > 0) {
            konamiCodeIndex = 1;
        } else {
            konamiCodeIndex = 0;
        }
    }

    /** ASCII Neural Network Visualization Logic */
    function drawAsciiNnFrame() {
        if (!nnVisContainer || !nnCurrentLayerConfig || nnCurrentLayerConfig.length === 0) return;

        const numLayers = nnCurrentLayerConfig.length;
        const maxNodesInAnyLayer = Math.max(...nnCurrentLayerConfig, 0);
        const nodeWidth = nnNodeChars.default.length;
        const connectionSegment = nnConnectionChars.horizontal.repeat(nnConnectionLength);

        let output = [];
        nnVisPulseState.activeNodes = []; // Reset active nodes each frame

        // Determine which layer the pulse is currently "activating" or "passing through"
        // Pulse travels node layer -> connection -> node layer
        const pulseOverallProgress = nnVisPulseState.currentSegment * (nnConnectionLength + 1) + nnVisPulseState.positionInSegment;
        const segmentDuration = nnConnectionLength + 1; // Time to pass one node layer and one connection

        for (let i = 0; i < maxNodesInAnyLayer * (1 + nnVerticalSpacing) - nnVerticalSpacing; i++) {
            let line = "";
            const nodeRowIndex = Math.floor(i / (1 + nnVerticalSpacing)); // Which node row this line corresponds to
            const isNodeLine = i % (1 + nnVerticalSpacing) === 0; // True if this line should draw nodes

            for (let l = 0; l < numLayers; l++) {
                // --- Draw Node Layer ---
                if (isNodeLine && nodeRowIndex < nnCurrentLayerConfig[l]) {
                    let nodeChar = nnNodeChars.default;
                    // Check if this node should be "active" due to pulse
                    // Pulse is "on" a node layer 'l' when currentSegment/2 is 'l' and positionInSegment is 0
                    const pulseIsOnThisNodeLayer = Math.floor(nnVisPulseState.currentSegment / 2) === l && nnVisPulseState.positionInSegment === 0;

                    if (pulseIsOnThisNodeLayer) {
                        nodeChar = nnNodeChars.active;
                        nnVisPulseState.activeNodes.push({layer: l, index: nodeRowIndex});
                    }
                    line += nodeChar;
                } else if (isNodeLine) { // Empty space if no node at this vertical position
                    line += " ".repeat(nodeWidth);
                } else { // Vertical spacing line
                    line += " ".repeat(nodeWidth);
                }

                // --- Draw Connection Layer (if not the last layer) ---
                if (l < numLayers - 1) {
                    if (isNodeLine) { // Only draw connections from actual node lines
                        // Check if a node exists at current layer and next layer for this row
                        const connects = nodeRowIndex < nnCurrentLayerConfig[l] && nodeRowIndex < nnCurrentLayerConfig[l+1];
                        if (connects) {
                            let currentConnection = connectionSegment;
                            // Pulse is "on" a connection 'l' when currentSegment/2 is 'l' and positionInSegment > 0
                            const pulseIsOnThisConnection = Math.floor(nnVisPulseState.currentSegment / 2) === l && nnVisPulseState.positionInSegment > 0;

                            if (pulseIsOnThisConnection) {
                                const pulsePosInConn = nnVisPulseState.positionInSegment -1; // 0 to nnConnectionLength-1
                                let tempConn = connectionSegment.split('');
                                if (pulsePosInConn < tempConn.length) {
                                     // Simple pulse: one char
                                    // tempConn[pulsePosInConn] = nnConnectionChars.pulse;
                                    // Pulse with trail
                                    tempConn[pulsePosInConn] = nnConnectionChars.pulse;
                                    if (pulsePosInConn > 0) tempConn[pulsePosInConn-1] = nnConnectionChars.pulseTrail;
                                    if (pulsePosInConn > 1) tempConn[pulsePosInConn-2] = nnConnectionChars.empty; // Clear older trail
                                }
                                currentConnection = tempConn.join('');
                            }
                            line += currentConnection;
                        } else {
                            line += " ".repeat(nnConnectionLength); // No connection, empty space
                        }
                    } else { // Vertical spacing line for connections
                         line += " ".repeat(nnConnectionLength);
                    }
                }
            }
            output.push(line);
        }

        nnVisContainer.innerHTML = output.join('\n').replace(/ /g, '&nbsp;');

        // Update pulse position
        nnVisPulseState.positionInSegment++;
        if (nnVisPulseState.positionInSegment > nnConnectionLength) { // Passed connection + node 'activation'
            nnVisPulseState.positionInSegment = 0;
            nnVisPulseState.currentSegment++;
            if (nnVisPulseState.currentSegment >= (numLayers * 2) - 2) { // Reached end (approx)
                nnVisPulseState.currentSegment = 0; // Reset pulse to start
            }
        }
    }

    function startAsciiNnVis(layerConfig = null) {
        if (nnVisInterval) stopAsciiNnVis();

        nnCurrentLayerConfig = (layerConfig && layerConfig.length > 0) ? layerConfig : [3, 5, 2]; // Default or user config
        if (nnCurrentLayerConfig.length < 2) nnCurrentLayerConfig = [3,2]; // Min 2 layers

        appendToTerminal("Initializing Neural Network Visualization...", "output-text");
        nnVisContainer = appendToTerminal("", "ascii-nn-vis");
        const maxNodes = Math.max(...nnCurrentLayerConfig, 0);
        nnVisContainer.style.minHeight = `${maxNodes * (1 + nnVerticalSpacing) * 1.2}em`; // Dynamic height

        nnVisPulseState = { currentSegment: 0, positionInSegment: 0, direction: 1, activeNodes: [] }; // Reset state
        drawAsciiNnFrame();
        nnVisInterval = setInterval(drawAsciiNnFrame, nnVisFrameRate);

        setTimeout(() => {
            stopAsciiNnVis();
            appendToTerminal("Neural Network Visualization sequence complete.", "output-text");
        }, nnVisDuration);
    }

    function stopAsciiNnVis() {
        if (nnVisInterval) clearInterval(nnVisInterval);
        nnVisInterval = null;
        // nnVisContainer = null; // Don't nullify, so clear command can find it
    }

    /** Main Initialization Function for Terminal and Graphics. */
    function initializeTerminalAndGraphics() {
        let columns = Math.floor(window.innerWidth / rainFontSize);
        const rainDrops = [];
        const fgParallaxSymbols = [];

        function resizeAllCanvases() {
            allCanvases.forEach(canvas => {
                if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
            });
            columns = Math.floor(window.innerWidth / rainFontSize);
            rainDrops.length = 0;
            for (let x = 0; x < columns; x++) rainDrops[x] = Math.floor(Math.random() * (window.innerHeight / rainFontSize));
            if (parallaxCanvasFg) initializeParallaxFgSymbols();
        }

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
        function masterAnimationLoop() {
            if (parallaxCtxBg) drawParallaxBackground();
            if (parallaxCtxFg) drawParallaxForeground();
            requestAnimationFrame(masterAnimationLoop);
        }

        if (matrixRainCtx || parallaxCtxBg || parallaxCtxFg) {
            if (matrixRainCtx) { if(rainIntervalId) clearInterval(rainIntervalId); rainIntervalId = setInterval(drawMatrixRain, rainAnimationInterval); }
            requestAnimationFrame(masterAnimationLoop);
        }

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
        fullWelcomeMessageStringGlobal = `${plainNameArt}\n${welcomeText}`;

        const commandHandlerContext = {
            appendToTerminal,
            fullWelcomeMessageString: fullWelcomeMessageStringGlobal,
            userDetails,
            fullBioText,
            mainContentContainer,
            allMatrixChars,
            startAsciiNnVis,
            stopAsciiNnVis
        };
        const terminalCommands = getTerminalCommands(commandHandlerContext);

        if (commandInput) {
            commandInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (commandInput.disabled) return;
                    e.preventDefault();
                    const fullCommandText = commandInput.value.trim();
                    if (fullCommandText) {
                        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== fullCommandText) {
                           commandHistory.push(fullCommandText);
                        }
                        historyIndex = commandHistory.length;

                        const sanitizedCommandDisplay = fullCommandText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        appendToTerminal(`<span class="prompt-arrow">&gt;</span> <span class="output-command">${sanitizedCommandDisplay}</span>`);

                        const parts = [];
                        let inQuotes = false;
                        let currentPart = "";
                        for (let i = 0; i < fullCommandText.length; i++) {
                            const char = fullCommandText[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                                currentPart += char;
                            } else if (char === ' ' && !inQuotes) {
                                if (currentPart) parts.push(currentPart);
                                currentPart = "";
                            } else {
                                currentPart += char;
                            }
                        }
                        if (currentPart) parts.push(currentPart);

                        const commandName = parts[0] ? parts[0].toLowerCase() : "";
                        const args = parts.slice(1).map(arg => {
                            if (arg.startsWith('"') && arg.endsWith('"')) {
                                return arg.substring(1, arg.length - 1);
                            }
                            return arg;
                        });

                        const commandFunc = terminalCommands[commandName];

                        if (typeof commandFunc === 'function') {
                            const result = commandFunc(args);
                            if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                                result.catch(err => {
                                    console.error("Error executing async command:", err);
                                    appendToTerminal(`Async Command Error: ${err.message}`, 'output-error');
                                });
                            }
                        } else if (commandName === 'sudo') { // Catch 'sudo' specifically if not in terminalCommands
                            terminalCommands['sudo'](args); // Call the generic sudo handler
                        }
                        else {
                            appendToTerminal(`Command not found: ${commandName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`, 'output-error');
                            appendToTerminal(`Type 'help' for commands.`);
                        }
                    }
                    commandInput.value = '';
                    if (terminalOutput) terminalOutput.scrollTop = terminalOutput.scrollHeight;

                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (commandHistory.length > 0) {
                        historyIndex = Math.max(0, historyIndex - 1);
                        commandInput.value = commandHistory[historyIndex];
                        setTimeout(() => commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length), 0);
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        commandInput.value = commandHistory[historyIndex];
                    } else {
                        historyIndex = commandHistory.length;
                        commandInput.value = '';
                    }
                    setTimeout(() => commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length), 0);
                }
            });
        }

        function displayInitialWelcomeMessage() {
            if (terminalOutput) appendToTerminal(fullWelcomeMessageStringGlobal.replace(/\n/g, '<br/>'), 'output-welcome');
            if (commandInput) commandInput.focus();
        }

        if (terminalOutput) displayInitialWelcomeMessage();

        window.addEventListener('resize', resizeAllCanvases);
        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        document.addEventListener('keydown', globalKeydownHandler);

    } // End of initializeTerminalAndGraphics()
}); // End of DOMContentLoaded
