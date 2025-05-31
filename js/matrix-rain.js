/**
 * @file matrix-rain.js
 * Core logic for the Matrix Terminal Portfolio.
 * Handles DOM setup, loading screen, new Matrix rain animation, terminal I/O,
 * and overall page initialization.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Element References ---
    const loadingScreen = document.getElementById('loading-screen');
    const matrixLoaderCharsEl = document.getElementById('matrix-loader-chars');
    const decryptStatusEl = document.getElementById('decrypt-status');
    const mainContentContainer = document.getElementById('contentContainer');
    const matrixRainCanvas = document.getElementById('matrix-canvas');
    const matrixRainCtx = matrixRainCanvas ? matrixRainCanvas.getContext('2d') : null;
    const terminalOutput = document.getElementById('terminal-output');
    const commandInput = document.getElementById('command-input');
    const navCvLink = document.getElementById('nav-cv-link');
    const navMediumLink = document.getElementById('nav-medium-link');

    const defaultTerminalSize = {
        width: '52vw',
        height: '42vh'
    };
    const initialTerminalOpacity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--terminal-opacity').trim()) || 0.88;


    let loadedSkillsData = null;
    let loadedHobbiesData = null;
    let loadedManPagesData = null;

    const allMatrixCharsGlobal = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンFUKZVRC0123456789!?@#$%^&*()[]{};:\'"<>,./\\|';

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
        fontFamily: "MatrixA, MatrixB, monospace",
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

    async function loadAllCommandData() {
        try {
            let response, jsonData;

            // Load skills.json
            response = await fetch('assets/skills.json');
            if (!response.ok) throw new Error(`Failed to fetch skills.json: ${response.status} ${response.statusText}`);
            try {
                jsonData = await response.json();
            } catch (e) {
                throw new Error(`Invalid JSON in skills.json: ${e.message}. Please check the file for syntax errors (e.g., trailing commas, mismatched brackets).`);
            }
            loadedSkillsData = jsonData;
            console.log("skills.json loaded successfully.");

            // Load hobbies.json
            response = await fetch('assets/hobbies.json');
            if (!response.ok) throw new Error(`Failed to fetch hobbies.json: ${response.status} ${response.statusText}`);
            try {
                jsonData = await response.json();
            } catch (e) {
                throw new Error(`Invalid JSON in hobbies.json: ${e.message}. Please check the file for syntax errors.`);
            }
            loadedHobbiesData = jsonData;
            console.log("hobbies.json loaded successfully.");

            // Load manPages.json
            response = await fetch('assets/manPages.json');
            if (!response.ok) throw new Error(`Failed to fetch manPages.json: ${response.status} ${response.statusText}`);
            try {
                jsonData = await response.json();
            } catch (e) {
                throw new Error(`Invalid JSON in manPages.json: ${e.message}. Please check the file for syntax errors.`);
            }
            loadedManPagesData = jsonData;
            console.log("manPages.json loaded successfully.");

        } catch (error) {
            console.error("Error loading command data:", error);
            const terminalOutputEl = document.getElementById('terminal-output');
            if (terminalOutputEl) {
                const lineDiv = document.createElement('div');
                lineDiv.classList.add('output-error-wrapper');
                lineDiv.innerHTML = `<div class="output-error">Critical error loading data files: ${error.message}. Some commands may not work. Check console.</div>`;
                terminalOutputEl.appendChild(lineDiv);
                if (terminalOutputEl.scrollTop !== undefined) { // Ensure property exists
                    terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
                }
            } else {
                alert(`Critical error loading data files: ${error.message}. Some commands may not work. Check console.`);
            }
            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.classList.add('hidden');
            }
        }
    }

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
        colW = CFG.font;
        TOTAL_COLS = Math.floor(innerWidth / colW);
        ROWS = Math.floor(innerHeight / (CFG.font * CFG.lineH));
        const targetActiveCols = Math.max(1, Math.floor(TOTAL_COLS * CFG.density));
        ACTIVE_COL_INDICES = shuffle([...Array(TOTAL_COLS).keys()]).slice(0, targetActiveCols);
        streams = ACTIVE_COL_INDICES.map(index => new Stream(index));
        if (matrixRainCtx && CFG.headCol) {
            matrixRainCtx.shadowColor = CFG.headCol;
        }
    }

    class Stream {
        constructor(colIndex) { this.col = colIndex; this.reset(); }
        reset() {
            this.layer = randInt(CFG.layers);
            this.opacity = CFG.layerOp[this.layer] !== undefined ? CFG.layerOp[this.layer] : (CFG.layerOp.length > 0 ? CFG.layerOp[CFG.layerOp.length - 1] : 1);
            this.del = Math.random() < CFG.delChance;
            this.len = CFG.minTrail + Math.random() * (CFG.maxTrail - CFG.minTrail);
            this.headGlow = CFG.headGlowMin + randInt(CFG.headGlowMax - CFG.headGlowMin + 1);
            this.head = -randInt(Math.floor(this.len));
            this.buf = Array.from({ length: ROWS }, randChar);
            this.tick = 0;
        }
        step() {
            this.head++;
            if (this.head >= 0 && this.head < ROWS) this.buf[this.head] = randChar();
            if (++this.tick >= CFG.trailMutate) {
                this.tick = 0;
                for (let r = 0; r < ROWS; r++) if (Math.random() < 0.15) this.buf[r] = randChar();
            }
            if (this.head > ROWS) this.reset();
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
                if (x >= 0 && (r * CFG.font * CFG.lineH) >= 0) {
                    matrixRainCtx.fillText(this.buf[r], x, r * CFG.font * CFG.lineH);
                }
            }
        }
    }

    function rainTick() {
        if (!matrixRainCtx || !matrixRainCanvas) return;
        matrixRainCtx.shadowBlur = 0;
        matrixRainCtx.globalAlpha = CFG.fade;
        matrixRainCtx.fillStyle = getCurrentThemeColors().background;
        matrixRainCtx.fillRect(0, 0, matrixRainCanvas.width, matrixRainCanvas.height);
        matrixRainCtx.globalAlpha = 1;
        if (matrixRainCtx && CFG.headCol) {
            matrixRainCtx.shadowColor = CFG.headCol;
        }
        for (const s of streams) { s.step(); s.draw(); }
        rainAnimationRequestID = setTimeout(rainTick, CFG.speed);
    }

    function startRainAnimation() {
        if (rainAnimationRequestID) {
            clearTimeout(rainAnimationRequestID);
        }
        updateRainColorsFromTheme();
        resizeRainCanvasAndStreams();
        rainTick();
    }

    const commandHistory = [];
    let historyIndex = commandHistory.length;
    const konamiCodeSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiCodeIndex = 0;
    let crtModeActive = false;
    let terminalVisible = true;
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
                initializeTerminalAndGraphics();
            }, 600);
        } else {
            initializeTerminalAndGraphics();
        }
    };

    function appendToTerminal(htmlContent, type = 'output-text-wrapper') {
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
        if (matrixRainCtx && CFG.headCol) {
            matrixRainCtx.shadowColor = CFG.headCol;
        }

        if (document.body) {
            let primaryColorValue = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
            let r, g, b;
            let parsedSuccessfully = false;

            // Try to parse as hex (6-digit or 3-digit)
            if (primaryColorValue.startsWith('#')) {
                const hex = primaryColorValue.substring(1);
                if (hex.length === 3) { // Expand 3-digit hex to 6-digit
                    r = parseInt(hex[0] + hex[0], 16);
                    g = parseInt(hex[1] + hex[1], 16);
                    b = parseInt(hex[2] + hex[2], 16);
                    parsedSuccessfully = !isNaN(r) && !isNaN(g) && !isNaN(b);
                } else if (hex.length === 6) {
                    r = parseInt(hex.substring(0, 2), 16);
                    g = parseInt(hex.substring(2, 4), 16);
                    b = parseInt(hex.substring(4, 6), 16);
                    parsedSuccessfully = !isNaN(r) && !isNaN(g) && !isNaN(b);
                }
            }

            if (parsedSuccessfully) {
                document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
            } else {
                // Try to parse as rgb() or rgba() if hex parsing failed or wasn't a hex
                const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i.exec(primaryColorValue);
                if (rgbMatch) {
                    document.documentElement.style.setProperty('--primary-color-rgb', `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`);
                    parsedSuccessfully = true;
                }
            }

            if (!parsedSuccessfully) {
                // Fallback for named colors or if all parsing fails (default to green)
                console.warn(`Could not parse --primary-color ('${primaryColorValue}') to RGB. Defaulting --primary-color-rgb to green.`);
                document.documentElement.style.setProperty('--primary-color-rgb', `0, 255, 0`); // Default to green
            }
        }
    }
    // </modified>

    function resizeTerminalElement(width, height) {
        if (mainContentContainer) {
            mainContentContainer.style.width = width;
            mainContentContainer.style.height = height;
        }
    }

    function getRainConfigForCommand() {
        return { ...CFG };
    }

    function updateRainConfigFromCommand(param, value, applyingPresetContext = null) {
        const MAPPINGS = {
            speed: { key: 'speed', type: 'int', min: 10, max: 500 },
            fontSize: { key: 'font', type: 'int', min: 8, max: 40 },
            lineHeight: { key: 'lineH', type: 'float', min: 0.5, max: 2.0 },
            density: { key: 'density', type: 'float', min: 0.1, max: 2.0 },
            minTrail: { key: 'minTrail', type: 'int', min: 1, max: 100 },
            maxTrail: { key: 'maxTrail', type: 'int', min: 1, max: 100 },
            headGlowMin: { key: 'headGlowMin', type: 'int', min: 0, max: 20 },
            headGlowMax: { key: 'headGlowMax', type: 'int', min: 0, max: 20 },
            glowBlur: { key: 'blur', type: 'int', min: 0, max: 20 },
            trailMutationSpeed: { key: 'trailMutate', type: 'int', min: 10, max: 1000 },
            fadeSpeed: { key: 'fade', type: 'float', min: 0.01, max: 1.0 },
            decayRate: { key: 'decayBase', type: 'float', min: 0.7, max: 0.99 },
            fontFamily: { key: 'fontFamily', type: 'string_font' },
            layers: { key: 'layers', type: 'int', min: 1, max: 10 },
            layerOp: { key: 'layerOp', type: 'array_float', ele_min: 0, ele_max: 1 },
            eraserChance: { key: 'delChance', type: 'float', min: 0, max: 1 }
        };
        const setting = MAPPINGS[param];
        if (!setting) {
            if (terminalOutput) appendToTerminal(`<div class="output-error">Error: Unknown rain config parameter '${param}'.</div>`, 'output-error-wrapper');
            return false;
        }
        let parsedValue = value;
        let isValid = true;
        switch (setting.type) {
            case 'int':
                parsedValue = parseInt(value, 10);
                if (isNaN(parsedValue) || (setting.min !== undefined && parsedValue < setting.min) || (setting.max !== undefined && parsedValue > setting.max)) isValid = false;
                break;
            case 'float':
                parsedValue = parseFloat(value);
                if (isNaN(parsedValue) || (setting.min !== undefined && parsedValue < setting.min) || (setting.max !== undefined && parsedValue > setting.max)) isValid = false;
                break;
            case 'string_font':
                parsedValue = String(value).trim();
                if (!/^[a-zA-Z0-9\s,-]+$/.test(parsedValue)) {
                    isValid = false;
                    if (terminalOutput) appendToTerminal(`<div class="output-error">Error: Invalid font family format for '${param}'. Use letters, numbers, spaces, commas, hyphens.</div>`, 'output-error-wrapper');
                }
                break;
            case 'array_float':
                parsedValue = value;
                if (!Array.isArray(parsedValue)) {
                    isValid = false;
                    if (terminalOutput) appendToTerminal(`<div class="output-error">Error: Invalid type for '${param}'. Expected an array. Received: ${typeof value}</div>`, 'output-error-wrapper');
                    break;
                }
                if (setting.key === 'layerOp' && parsedValue.length !== (applyingPresetContext?.layers ?? CFG.layers)) {
                    const targetLayers = applyingPresetContext?.layers ?? CFG.layers;
                    if (terminalOutput) appendToTerminal(`<div class="output-error">Error: For '${param}', array length (${parsedValue.length}) must match 'layers' count (${targetLayers}). Ensure 'layers' is set appropriately in the preset.</div>`, 'output-error-wrapper');
                    isValid = false;
                    break;
                }
                for (const item of parsedValue) {
                    if (typeof item !== 'number' || item < (setting.ele_min || 0) || item > (setting.ele_max || 1)) {
                        isValid = false;
                        if (terminalOutput) appendToTerminal(`<div class="output-error">Error: Invalid item '${item}' in array for '${param}'. Must be number between ${setting.ele_min || 0}-${setting.ele_max || 1}.</div>`, 'output-error-wrapper');
                        break;
                    }
                }
                break;
            default:
                parsedValue = String(value);
                break;
        }
        if (!isValid) {
            if (terminalOutput && !MAPPINGS[param].type.startsWith('array')) {
                appendToTerminal(`<div class="output-error">Error: Invalid value for '${param}'. Value: '${value}', Min: ${setting.min}, Max: ${setting.max}.</div>`, 'output-error-wrapper');
            }
            return false;
        }
        if (setting.key === 'minTrail' || setting.key === 'maxTrail' || setting.key === 'headGlowMin' || setting.key === 'headGlowMax') {
            let minT = (setting.key === 'minTrail') ? parsedValue : (applyingPresetContext?.minTrail ?? CFG.minTrail);
            let maxT = (setting.key === 'maxTrail') ? parsedValue : (applyingPresetContext?.maxTrail ?? CFG.maxTrail);
            let minHG = (setting.key === 'headGlowMin') ? parsedValue : (applyingPresetContext?.headGlowMin ?? CFG.headGlowMin);
            let maxHG = (setting.key === 'headGlowMax') ? parsedValue : (applyingPresetContext?.headGlowMax ?? CFG.headGlowMax);
            minT = parseFloat(minT); maxT = parseFloat(maxT);
            minHG = parseFloat(minHG); maxHG = parseFloat(maxHG);
            if (setting.key === 'minTrail' && minT > maxT) { if (terminalOutput) appendToTerminal(`<div class="output-error">Validation Error: '${param}' (${minT}) cannot be greater than effective maxTrail (${maxT}).</div>`, 'output-error-wrapper'); return false; }
            if (setting.key === 'maxTrail' && maxT < minT) { if (terminalOutput) appendToTerminal(`<div class="output-error">Validation Error: '${param}' (${maxT}) cannot be less than effective minTrail (${minT}).</div>`, 'output-error-wrapper'); return false; }
            if (setting.key === 'headGlowMin' && minHG > maxHG) { if (terminalOutput) appendToTerminal(`<div class="output-error">Validation Error: '${param}' (${minHG}) cannot be greater than effective headGlowMax (${maxHG}).</div>`, 'output-error-wrapper'); return false; }
            if (setting.key === 'headGlowMax' && maxHG < minHG) { if (terminalOutput) appendToTerminal(`<div class="output-error">Validation Error: '${param}' (${maxHG}) cannot be less than effective headGlowMin (${minHG}).</div>`, 'output-error-wrapper'); return false; }
        }
        CFG[setting.key] = parsedValue;
        if (setting.key === 'font' || setting.key === 'fontFamily' || setting.key === 'density' || setting.key === 'lineH' || setting.key === 'layers') {
            resizeRainCanvasAndStreams();
        }
        return true;
    }

    function resetRainConfigToDefaults() {
        CFG = { ...DEFAULT_CFG };
        updateRainColorsFromTheme();
        resizeRainCanvasAndStreams();
    }

    function restartRainAfterThemeChange() {
        updateRainColorsFromTheme();
    }

    let fullWelcomeMessageStringGlobal = '';
    function toggleCrtMode(activate) {
        crtModeActive = typeof activate === 'boolean' ? activate : !crtModeActive;
        document.body.classList.toggle('crt-mode', crtModeActive);
        if (typeof activate === 'boolean' && terminalOutput) {
            appendToTerminal(`<div class="output-success">Analog Channel Override: CRT Mode ${crtModeActive ? 'Engaged' : 'Disengaged'}. Frequency aligned.</div>`, 'output-success-wrapper');
        }
        if (commandInput && terminalVisible) commandInput.focus();
    }

    function toggleTerminalVisibility() {
        terminalVisible = !terminalVisible;
        if (mainContentContainer) {
            mainContentContainer.classList.toggle('hidden', !terminalVisible);
        }
        document.body.classList.toggle('terminal-hidden', !terminalVisible);
        if (terminalVisible && commandInput) {
            commandInput.focus();
            const lastMessageElement = terminalOutput.lastChild;
            if (!lastMessageElement || !lastMessageElement.textContent.includes("Terminal interface hidden")) {
                appendToTerminal(`<div>Terminal interface restored. Ctrl + \\ to hide.</div>`, 'output-text-wrapper');
            }
        } else if (!terminalVisible && terminalOutput) {
            appendToTerminal(`<div>Terminal interface hidden. Ctrl + \\ to restore.</div>`, 'output-text-wrapper');
        }
    }

    function globalKeydownHandler(e) {
        const key = e.key;
        if (e.ctrlKey && (key === '\\' || key === '|')) {
            e.preventDefault();
            toggleTerminalVisibility();
            return;
        }
        if (!terminalVisible && key !== 'Escape') { return; }
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

    async function initializeTerminalAndGraphics() {
        document.documentElement.style.setProperty('--terminal-opacity', String(initialTerminalOpacity));
        const initialTheme = Array.from(document.body.classList).find(cls => cls.startsWith('theme-')) || 'theme-green';
        document.body.classList.add(initialTheme);
        if (!getComputedStyle(document.documentElement).getPropertyValue('--terminal-base-r')) {
            document.documentElement.style.setProperty('--terminal-base-r', '17');
            document.documentElement.style.setProperty('--terminal-base-g', '24');
            document.documentElement.style.setProperty('--terminal-base-b', '39');
        }

        updateRainColorsFromTheme();
        startRainAnimation();

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
        const welcomeText = `Welcome to ${userDetails.userName}'s Terminal.\nType 'help' to see available commands.\n(Ctrl + \\ to toggle terminal visibility)\n---------------------------------------------------`;
        fullWelcomeMessageStringGlobal = `${plainNameArt}\n${welcomeText}`;

        const commandHandlerContext = {
            appendToTerminal,
            fullWelcomeMessageString: fullWelcomeMessageStringGlobal,
            userDetails,
            fullBioText,
            mainContentContainer,
            allMatrixChars: allMatrixCharsGlobal,
            resizeTerminalElement,
            defaultTerminalSize,
            getRainConfig: getRainConfigForCommand,
            updateRainConfig: updateRainConfigFromCommand,
            resetRainConfig: resetRainConfigToDefaults,
            restartMatrixRain: restartRainAfterThemeChange,
            toggleTerminal: toggleTerminalVisibility,
            initialTerminalOpacity,
            skillsData: loadedSkillsData,
            hobbiesData: loadedHobbiesData,
            manPages: loadedManPagesData
        };
        const terminalCommands = getTerminalCommands(commandHandlerContext);

        if (commandInput) {
            commandInput.addEventListener('keydown', (e) => {
                if (!terminalVisible) return;
                if (e.key === 'Enter') {
                    if (commandInput.disabled) return;
                    e.preventDefault(); const fullCommandText = commandInput.value.trim();
                    if (fullCommandText) {
                        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== fullCommandText) {
                            commandHistory.push(fullCommandText);
                        }
                        historyIndex = commandHistory.length;
                        const sanitizedCommandDisplay = fullCommandText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        appendToTerminal(`<div><span class="prompt-arrow">&gt;</span> <span class="output-command">${sanitizedCommandDisplay}</span></div>`, 'output-command-wrapper');
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
                                result.catch(err => {
                                    console.error("Error executing async command:", commandName, err);
                                    appendToTerminal(`<div class="output-error">Async Command Error: ${err.message || 'Unknown error'}</div>`, 'output-error-wrapper');
                                });
                            }
                        } else if (commandName) {
                            appendToTerminal(`<div class="output-error">Command not found: ${commandName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`, 'output-error-wrapper');
                            appendToTerminal(`<div>Type 'help' for a list of available commands.</div>`, 'output-text-wrapper');
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
                    if (!terminalVisible) return;
                    if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT') {
                        if (commandInput) commandInput.focus();
                    }
                });
            }
        }

        function displayInitialWelcomeMessage() {
            if (terminalOutput) {
                appendToTerminal(fullWelcomeMessageStringGlobal.replace(/\n/g, '<br/>'), 'output-welcome-wrapper');
            }
            if (commandInput && terminalVisible) commandInput.focus();
        }

        if (terminalOutput) displayInitialWelcomeMessage();
        document.body.classList.remove('terminal-hidden');

        window.addEventListener('resize', () => {
            resizeRainCanvasAndStreams();
        });
        document.addEventListener('keydown', globalKeydownHandler);
    }

    // --- NEW: Ensure data is loaded before the rest of the initialization proceeds ---
    await loadAllCommandData();

    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        loaderCharInterval = setInterval(animateLoaderMatrixChars, 120);
        animateLoaderMatrixChars();
        updateLoadingStatusMessage();
        statusCyclingInterval = setInterval(updateLoadingStatusMessage, 800);
    }

    if (document.readyState === 'complete') {
        handleWindowLoad();
    } else {
        window.onload = handleWindowLoad;
    }
});