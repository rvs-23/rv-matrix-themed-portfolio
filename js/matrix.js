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
    const terminalOutput = document.getElementById('terminal-output');
    const commandInput = document.getElementById('command-input');
    const navCvLink = document.getElementById('nav-cv-link');
    const navMediumLink = document.getElementById('nav-medium-link');

    // --- Default Terminal Size (for reset) ---
    const defaultTerminalSize = {
        width: '55vw', // Must match initial CSS in style.css
        height: '50vh' // Must match initial CSS in style.css
    };

    // --- Matrix Rain Configuration ---
    const defaultRainConfig = {
        fontSize: 15,
        fontFamily: "Fira Code, monospace", // Default font
        speed: 101,
        density: 0.69,
        trailEffect: true,
        randomizeSpeed: true,
        opacity: 0.8,
        blur: 0,
        rainShadow: 2,
        glitchIntensity: 0.1,
        rainDirection: 'down' // 'down', 'up', 'random'
    };
    let rainConfigOptions = { ...defaultRainConfig };
    let rainAnimationIntervalId = null;
    let burstGlitchActive = false;
    let burstGlitchTimeoutId = null;
    let randomBurstGlitchIntervalId = null;
    let currentGlobalRainDirection = 'down'; // Used when rainDirection is 'random'
    let randomDirectionChangeIntervalId = null;

    // Available font options for the rain
    // Users must ensure these fonts are loaded (e.g., via CSS or system availability)
    const availableFonts = [
        "Fira Code, monospace",
        "Courier New, monospace",
        "Lucida Console, monospace",
        "Arial, sans-serif",
        "Verdana, sans-serif"
    ];


    // --- Other Configuration Variables ---
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
                primary: styles.getPropertyValue('--primary-color').trim() || '#0F0',
                secondary: styles.getPropertyValue('--secondary-color').trim() || '#00FFFF',
                trail: styles.getPropertyValue('--matrix-rain-trail-color').trim() || 'rgba(0,0,0,0.05)',
                glow: styles.getPropertyValue('--matrix-rain-glow-color').trim() || '#9FFF9F',
                background: styles.getPropertyValue('--background-color').trim() || '#000',
            };
        }
        return { primary: '#0F0', secondary: '#00FFFF', trail: 'rgba(0,0,0,0.05)', glow: '#9FFF9F', background: '#000' };
    }

    function getCurrentFontFamily() { // This function gets font from CSS variable, not rain config
         if (typeof getComputedStyle !== 'undefined' && document.body) return getComputedStyle(document.body).getPropertyValue('--font-mono-current').trim() || 'Fira Code, monospace';
         return 'Fira Code, monospace';
    }

    function resizeTerminalElement(width, height) {
        if (mainContentContainer) {
            mainContentContainer.style.width = width;
            mainContentContainer.style.height = height;
        }
    }
    
    function burstGlitch(duration = 750, intensityMultiplier = 3) {
        if (burstGlitchActive) return; 
        burstGlitchActive = true;

        const originalValues = {
            glitchIntensity: rainConfigOptions.glitchIntensity,
            speed: rainConfigOptions.speed,
            fontSize: rainConfigOptions.fontSize,
            blur: rainConfigOptions.blur,
            density: rainConfigOptions.density,
        };

        rainConfigOptions.glitchIntensity = Math.min(1.0, originalValues.glitchIntensity * intensityMultiplier + 0.7);
        rainConfigOptions.speed = Math.max(20, Math.round(originalValues.speed / (intensityMultiplier * 0.8)));
        rainConfigOptions.fontSize = Math.max(8, Math.min(40, originalValues.fontSize + Math.floor(Math.random() * 8 - 4)));
        rainConfigOptions.blur = Math.min(5, originalValues.blur + Math.random() * 1.5);
        rainConfigOptions.density = Math.min(3.0, Math.max(0.1, originalValues.density * 1.25));

        restartMatrixRainAnimation(); 

        burstGlitchTimeoutId = setTimeout(() => {
            rainConfigOptions.glitchIntensity = originalValues.glitchIntensity;
            rainConfigOptions.speed = originalValues.speed;
            rainConfigOptions.fontSize = originalValues.fontSize;
            rainConfigOptions.blur = originalValues.blur;
            rainConfigOptions.density = originalValues.density;

            restartMatrixRainAnimation(); 
            burstGlitchActive = false;
        }, duration);
    }

    function startRandomBurstGlitches() {
        if (randomBurstGlitchIntervalId) clearInterval(randomBurstGlitchIntervalId);

        function triggerRandomBurst() {
            burstGlitch(Math.random() * 500 + 500, Math.random() * 2 + 2); 
            const nextBurstDelay = Math.random() * (120000 - 60000) + 60000; 
            randomBurstGlitchIntervalId = setTimeout(triggerRandomBurst, nextBurstDelay);
        }
        const initialDelay = Math.random() * (90000 - 30000) + 30000;
        randomBurstGlitchIntervalId = setTimeout(triggerRandomBurst, initialDelay);
    }
    
    function scheduleRandomDirectionChange() {
        if (randomDirectionChangeIntervalId) clearInterval(randomDirectionChangeIntervalId);
        if (rainConfigOptions.rainDirection === 'random') {
            const changeDirection = () => {
                currentGlobalRainDirection = Math.random() < 0.5 ? 'down' : 'up';
                // Don't need to call restartMatrixRainAnimation here, drawMatrixRain will pick it up
                // but we might want to reset drop positions to make the change more apparent.
                // For simplicity now, it will just change direction of falling.
                // To make it more 'stormy' and reset drops:
                // setupMatrixRainDrops(); // This would reset all drops.
            };
            randomDirectionChangeIntervalId = setInterval(changeDirection, Math.random() * (20000 - 10000) + 10000); // Change every 10-20s
            currentGlobalRainDirection = Math.random() < 0.5 ? 'down' : 'up'; // Initial random direction
        }
    }


    function getRainConfig() {
        // Return availableFonts as part of the config display if needed, or handle in commands.js
        return { ...rainConfigOptions, availableFonts: [...availableFonts] };
    }

    function updateRainConfig(param, value) {
        if (rainConfigOptions.hasOwnProperty(param)) {
            let isValid = true;
            let parsedValue = value;

            switch (param) {
                case 'fontSize':
                    parsedValue = parseInt(value, 10);
                    if (isNaN(parsedValue) || parsedValue < 8 || parsedValue > 40) isValid = false;
                    break;
                case 'speed':
                    parsedValue = parseInt(value, 10);
                    if (isNaN(parsedValue) || parsedValue < 20 || parsedValue > 500) isValid = false;
                    break;
                case 'density':
                    parsedValue = parseFloat(value);
                    if (isNaN(parsedValue) || parsedValue < 0.1 || parsedValue > 3.0) isValid = false;
                    break;
                case 'opacity':
                    parsedValue = parseFloat(value);
                    if (isNaN(parsedValue) || parsedValue < 0.1 || parsedValue > 1.0) isValid = false;
                    break;
                case 'blur':
                    parsedValue = parseFloat(value);
                    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 5) isValid = false;
                    break;
                case 'rainShadow':
                    parsedValue = parseInt(value, 10);
                    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 10) isValid = false;
                    break;
                case 'glitchIntensity':
                    parsedValue = parseFloat(value);
                    if (isNaN(parsedValue) || parsedValue < 0.0 || parsedValue > 1.0) isValid = false;
                    break;
                case 'trailEffect':
                case 'randomizeSpeed':
                    if (String(value).toLowerCase() === 'true') parsedValue = true;
                    else if (String(value).toLowerCase() === 'false') parsedValue = false;
                    else isValid = false;
                    break;
                case 'fontFamily':
                    // Check if the provided font is in our curated list or a generic valid CSS font string
                    const sanitizedValue = String(value).trim();
                    if (availableFonts.includes(sanitizedValue) || /^[a-zA-Z0-9\s,-]+$/.test(sanitizedValue)) {
                        parsedValue = sanitizedValue;
                    } else {
                        isValid = false;
                        if(terminalOutput) appendToTerminal(`Font '${sanitizedValue}' not in available list or contains invalid characters. Using default.`, 'output-error');
                        // Revert to default if invalid to prevent broken state
                        parsedValue = defaultRainConfig.fontFamily;
                    }
                    break;
                case 'rainDirection':
                    const direction = String(value).toLowerCase();
                    if (['down', 'up', 'random'].includes(direction)) {
                        parsedValue = direction;
                        scheduleRandomDirectionChange(); // Restart or start the random direction change interval if mode is 'random'
                    } else {
                        isValid = false;
                    }
                    break;
                default:
                    break; 
            }

            if (!isValid && terminalOutput) { 
                appendToTerminal(`Invalid value for ${param}. Please check range or type.`, 'output-error');
                return false;
            }
            
            rainConfigOptions[param] = parsedValue;
            return true;
        }
        if (terminalOutput) appendToTerminal(`Unknown rain config parameter: ${param}`, 'output-error');
        return false;
    }

    function resetRainConfig() {
        rainConfigOptions = { ...defaultRainConfig };
        currentGlobalRainDirection = defaultRainConfig.rainDirection === 'random' ? (Math.random() < 0.5 ? 'down' : 'up') : defaultRainConfig.rainDirection;
        scheduleRandomDirectionChange();
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
        const key = e.key.toLowerCase(); 
        if (e.target === commandInput || e.target.tagName === 'A') {
            if (key === 'escape' && document.activeElement === commandInput) {
                 commandInput.blur();
            }
            return;
        }

        if (key === konamiCodeSequence[konamiCodeIndex].toLowerCase()) {
            konamiCodeIndex++;
            if (konamiCodeIndex === konamiCodeSequence.length) {
                toggleCrtMode(); konamiCodeIndex = 0;
                if (document.activeElement !== commandInput) e.preventDefault();
            }
        } else if (key === konamiCodeSequence[0].toLowerCase() && konamiCodeIndex > 0) { 
            konamiCodeIndex = 1;
        } else { konamiCodeIndex = 0; }
    }
    
    function initializeTerminalAndGraphics() {
        let columns;
        const rainDrops = []; // This will store y-positions and other per-drop states
        const fgParallaxSymbols = [];

        function setupMatrixRainDrops() {
            rainDrops.length = 0;
            const effectiveDensity = Math.max(0.1, rainConfigOptions.density);
            columns = Math.max(1, Math.floor((window.innerWidth / rainConfigOptions.fontSize) * effectiveDensity));
            const canvasHeight = matrixRainCanvas ? matrixRainCanvas.height : window.innerHeight;

            for (let x = 0; x < columns; x++) {
                let initialY;
                // Determine initial Y based on direction for a more natural start
                // This is for initial setup. Ongoing direction changes are handled in drawMatrixRain.
                const setupDirection = rainConfigOptions.rainDirection === 'random' ? currentGlobalRainDirection : rainConfigOptions.rainDirection;

                if (setupDirection === 'up') {
                    initialY = canvasHeight / rainConfigOptions.fontSize + Math.random() * (canvasHeight / rainConfigOptions.fontSize);
                } else { // 'down'
                    initialY = Math.random() * (canvasHeight / rainConfigOptions.fontSize) - (canvasHeight / rainConfigOptions.fontSize); // Start off-screen or near top
                }
                rainDrops[x] = {
                    y: initialY,
                    isLeading: true,
                    speedOffset: rainConfigOptions.randomizeSpeed ? (Math.random() - 0.5) * 0.5 : 0
                };
            }
        }


        function resizeMatrixRainCanvases() {
            if (matrixRainCanvas) {
                matrixRainCanvas.width = window.innerWidth;
                matrixRainCanvas.height = window.innerHeight;
            }
            setupMatrixRainDrops();
        }

        function resizeOtherCanvases() {
             [parallaxCanvasBg, parallaxCanvasFg].filter(Boolean).forEach(canvas => {
                if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
            });
            if (parallaxCanvasFg) initializeParallaxFgSymbols();
        }

        function drawMatrixRain() {
            if (!matrixRainCtx || !matrixRainCanvas) return;
            const themeColors = getCurrentThemeColors();
            const canvasHeight = matrixRainCanvas.height;
            const fontSize = rainConfigOptions.fontSize;

            // Determine current direction for this frame
            const frameDirection = rainConfigOptions.rainDirection === 'random' ? currentGlobalRainDirection : rainConfigOptions.rainDirection;

            matrixRainCtx.filter = 'none';
            matrixRainCtx.globalAlpha = 1.0; 

            if (rainConfigOptions.trailEffect) {
                matrixRainCtx.fillStyle = themeColors.trail; 
            } else {
                matrixRainCtx.fillStyle = themeColors.background; 
            }
            matrixRainCtx.fillRect(0, 0, matrixRainCanvas.width, matrixRainCanvas.height);

            matrixRainCtx.globalAlpha = rainConfigOptions.opacity; 
            if (rainConfigOptions.blur > 0) {
                matrixRainCtx.filter = `blur(${rainConfigOptions.blur}px)`;
            } else {
                matrixRainCtx.filter = 'none'; 
            }
            
            matrixRainCtx.font = `bold ${fontSize}px ${rainConfigOptions.fontFamily}`; // Use configured font

            for (let i = 0; i < rainDrops.length; i++) {
                let text = allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
                const drop = rainDrops[i];
                const effectiveDensity = Math.max(0.1, rainConfigOptions.density); 
                let xPos = i * (fontSize / effectiveDensity);

                if (rainConfigOptions.glitchIntensity > 0) {
                    if (Math.random() < rainConfigOptions.glitchIntensity) {
                        text = allMatrixChars[Math.floor(Math.random() * allMatrixChars.length)];
                    }
                    if (Math.random() < rainConfigOptions.glitchIntensity * 0.85) { 
                        const maxOffsetMagnitude = fontSize * (0.2 + rainConfigOptions.glitchIntensity * 0.55); 
                        xPos += (Math.random() - 0.5) * 2 * maxOffsetMagnitude; 
                    }
                }

                if (drop.isLeading) {
                    matrixRainCtx.fillStyle = themeColors.glow;
                    matrixRainCtx.shadowColor = themeColors.glow; 
                    matrixRainCtx.shadowBlur = rainConfigOptions.rainShadow; 
                    matrixRainCtx.shadowOffsetX = 0;
                    matrixRainCtx.shadowOffsetY = 0;
                    drop.isLeading = false; 
                } else {
                    matrixRainCtx.fillStyle = themeColors.primary;
                    matrixRainCtx.shadowBlur = 0; 
                    matrixRainCtx.shadowColor = 'transparent'; 
                }
                matrixRainCtx.fillText(text, xPos, drop.y * fontSize);
                
                const currentDropSpeed = 1 + (rainConfigOptions.randomizeSpeed ? drop.speedOffset : 0);
                
                if (frameDirection === 'up') {
                    drop.y -= currentDropSpeed;
                    if (drop.y * fontSize < 0 && Math.random() > 0.975) { // Reset when it goes off top
                        drop.y = canvasHeight / fontSize; // Start from bottom
                        drop.isLeading = true; 
                        if(rainConfigOptions.randomizeSpeed) { 
                            drop.speedOffset = (Math.random() - 0.5) * 0.5;
                        }
                    }
                } else { // 'down'
                    drop.y += currentDropSpeed;
                    if (drop.y * fontSize > canvasHeight && Math.random() > 0.975) { // Reset when it goes off bottom
                        drop.y = 0; // Start from top
                        drop.isLeading = true; 
                        if(rainConfigOptions.randomizeSpeed) { 
                            drop.speedOffset = (Math.random() - 0.5) * 0.5;
                        }
                    }
                }
            }
            
            matrixRainCtx.shadowBlur = 0;
            matrixRainCtx.shadowColor = 'transparent';
            matrixRainCtx.filter = 'none';
            matrixRainCtx.globalAlpha = 1.0; 
        }


        function restartMatrixRainAnimation() {
            if (rainAnimationIntervalId) clearInterval(rainAnimationIntervalId);
            if (matrixRainCtx) {
                if (matrixRainCanvas.width !== window.innerWidth || matrixRainCanvas.height !== window.innerHeight) {
                    resizeMatrixRainCanvases(); 
                } else {
                    setupMatrixRainDrops(); 
                }
                rainAnimationIntervalId = setInterval(drawMatrixRain, rainConfigOptions.speed);
            }
            scheduleRandomDirectionChange(); // Ensure random direction logic is active if needed
        }
        
        function drawParallaxBackground() {
            if (!parallaxCtxBg || !parallaxCanvasBg) return;
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
            if (!parallaxCtxFg || !parallaxCanvasFg) return;
            parallaxCtxFg.clearRect(0, 0, parallaxCanvasFg.width, parallaxCanvasFg.height);
            const themeColors = getCurrentThemeColors();
            const currentTermFont = getCurrentFontFamily(); 
            fgParallaxSymbols.forEach(s => {
                parallaxCtxFg.font = `${s.size}px ${currentTermFont}`; // Use terminal font for consistency
                parallaxCtxFg.fillStyle = themeColors.primary + '55'; 
                const targetX = s.x - (mouseX - parallaxCanvasFg.width / 2) * s.parallaxFactor;
                const targetY = s.y - (mouseY - parallaxCanvasFg.height / 2) * s.parallaxFactor;
                s.x += s.vx + (targetX - s.x) * 0.01; s.y += s.vy + (targetY - s.y) * 0.01;
                if (s.x < -s.size) s.x = parallaxCanvasFg.width + s.size; if (s.x > parallaxCanvasFg.width + s.size) s.x = -s.size;
                if (s.y < -s.size) s.y = parallaxCanvasFg.height + s.size; if (s.y > parallaxCanvasFg.height + s.size) s.y = -s.size;
                parallaxCtxFg.fillText(s.char, s.x, s.y);
            });
        }

        // Initial setup
        currentGlobalRainDirection = rainConfigOptions.rainDirection === 'random' ? (Math.random() < 0.5 ? 'down' : 'up') : rainConfigOptions.rainDirection;
        resizeOtherCanvases();
        restartMatrixRainAnimation(); 
        startRandomBurstGlitches(); 


        function masterAnimationLoop() {
            if (parallaxCtxBg) drawParallaxBackground();
            if (parallaxCtxFg) drawParallaxForeground();
            requestAnimationFrame(masterAnimationLoop);
        }
        if (parallaxCtxBg || parallaxCtxFg) {
            requestAnimationFrame(masterAnimationLoop);
        }

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
            userDetails, fullBioText, mainContentContainer, allMatrixChars,
            resizeTerminalElement, defaultTerminalSize,
            getRainConfig, updateRainConfig, resetRainConfig, restartMatrixRain: restartMatrixRainAnimation,
            // burstGlitch is NOT passed to command context as the command is removed
        };
        const terminalCommands = getTerminalCommands(commandHandlerContext);


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
            if(mainContentContainer) {
                mainContentContainer.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT') { 
                        if(commandInput) commandInput.focus();
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
            resizeOtherCanvases(); 
            resizeMatrixRainCanvases(); 
        });
        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        document.addEventListener('keydown', globalKeydownHandler);
    }
});
