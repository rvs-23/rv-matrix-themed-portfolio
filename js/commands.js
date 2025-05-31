/**
 * @file commands.js
 * Defines terminal commands, their logic, and output formatting for the Matrix Terminal Portfolio.
 */

/**
 * @function getTerminalCommands
 * @description Initializes and returns an object containing all terminal command functions.
 * @param {object} context - An object containing functions and data from matrix-rain.js
 * (e.g., appendToTerminal, userDetails, theme functions).
 * @returns {object} An object where keys are command names and values are their corresponding functions.
 */
function getTerminalCommands(context) {
    const {
        appendToTerminal,
        fullWelcomeMessageString,
        userDetails,
        fullBioText, // Raw text for about, will be formatted
        resizeTerminalElement,
        defaultTerminalSize,
        getRainConfig,
        updateRainConfig,
        resetRainConfig,
        restartMatrixRain,
        toggleTerminal,
        initialTerminalOpacity // For resetting opacity
    } = context;

    // --- SKILLS DATA (remains the same structurally) ---
    const skillsData = { /* ... (same as before, no changes needed here for this request) ... */
        name: "Core Competencies",
        aliases: ["core", "all", "root"],
        children: [
            {
                name: "Software Engineering",
                aliases: ["se", "swe", "software"],
                children: [
                    {
                        name: "Languages & Frameworks",
                        aliases: ["lang", "frameworks"],
                        children: [
                            {
                                name: "Python",
                                children: [
                                    { name: "NumPy" },
                                    { name: "Pandas" },
                                    { name: "Scikit-Learn" },
                                    { name: "Matplotlib" }
                                ]
                            },
                            { name: "TypeScript" },
                            { name: "SQL" },
                            { name: "Apache Spark" }
                        ]
                    },
                    { name: "Front-End Development", aliases: ["frontend", "ui", "ux"] },
                    { name: "Back-End Development", aliases: ["backend", "server"] },
                    { name: "DevOps", aliases: ["devops", "ci/cd"] },
                ]
            },
            {
                name: "Artificial Intelligence & Machine Learning",
                aliases: ["ai", "ml"],
                children: [
                    {
                        name: "Core Machine Learning",
                        aliases: ["coreml"],
                        children: [
                            { name: "Regression" },
                            { name: "Classification" }
                        ]
                    },
                    {
                        name: "Generative AI",
                        aliases: ["genai"],
                        children: [
                            { name: "LLMs (Large Language Models)" },
                            { name: "RAG (Retrieval Augmented Generation)" }
                        ]
                    },
                    {
                        name: "Explainable AI",
                        aliases: ["xai"],
                        children: [
                            { name: "Explainability (SHAP)" },
                            { name: "Interpretable models" }
                        ]
                    },
                    { name: "NLP Basics", aliases: ["nlp"] },
                    { name: "Deep Learning Basics", aliases: ["dl"] }
                ]
            },
            {
                name: "Data Science & Analysis",
                aliases: ["ds", "analysis", "datasci"],
                children: [
                    {
                        name: "Statistical Foundations",
                        aliases: ["stats"],
                        children: [
                            { name: "Descriptive & Inferential Statistics" }
                        ]
                    },
                    {
                        name: "Data Visualization",
                        aliases: ["viz"],
                        children: [
                            { name: "Matplotlib" },
                            { name: "Seaborn" },
                            { name: "Streamlit" }
                        ]
                    },
                    { name: "Operational Research", aliases: ["or"] }
                ]
            },
            {
                name: "Platforms & Tools",
                aliases: ["platforms", "tools"],
                children: [
                    {
                        name: "Palantir Foundry",
                        aliases: ["foundry"],
                        children: [
                            { name: "Workshop" },
                            { name: "Ontology" },
                            { name: "Pipeline Builder" },
                            { name: "Code Repo" },
                            { name: "AIP suite" },
                            { name: "Contour" }
                        ]
                    },
                    { name: "REST APIs" },
                    { name: "Git" }
                ]
            }
        ]
    };
    function renderSkillTree(node, indent = '', isLast = true, outputArray = []) {
        if (!node || typeof node.name === 'undefined') {
            console.error("Error in renderSkillTree: Node or node.name is undefined. Node:", node);
            outputArray.push(`${indent}${isLast ? '└── ' : '├── '}[Error: Malformed skill data]`);
            return outputArray;
        }
        const sanitizedNodeName = node.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        outputArray.push(`${indent}${isLast ? '└── ' : '├── '}${sanitizedNodeName}`);
        const newIndent = indent + (isLast ? '    ' : '│   ');
        if (node.children && node.children.length > 0) {
            node.children.forEach((child, index) => {
                renderSkillTree(child, newIndent, index === node.children.length - 1, outputArray);
            });
        }
        return outputArray;
    }

    async function activateTerminalGlitchAndQuote() { /* ... (same as before, no changes needed here) ... */
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput || !context.mainContentContainer) return;
        context.appendToTerminal("<div class='output-error'>Initiating system override...</div>", "output-error-wrapper");
        await new Promise(resolve => setTimeout(resolve, 300));

        const overlay = document.createElement('div');
        overlay.className = 'terminal-glitch-overlay';

        const currentRainConfig = context.getRainConfig ? context.getRainConfig() : {};
        const glitchFontFamily = currentRainConfig.fontFamily || "MatrixA, MatrixB, monospace";
        overlay.style.fontFamily = glitchFontFamily;

        const originalPosition = context.mainContentContainer.style.position;
        context.mainContentContainer.style.position = 'relative';
        context.mainContentContainer.appendChild(overlay);

        const computedStyle = getComputedStyle(terminalOutput);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
        const glitchFontSize = parseFloat(computedStyle.fontSize) || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--terminal-font-size')) || 12.5;
        const charWidth = (glitchFontSize * 0.6);
        // Ensure overlay has dimensions, fallback to mainContentContainer if not yet rendered
        const overlayRect = overlay.getBoundingClientRect();
        const containerRect = context.mainContentContainer.getBoundingClientRect();

        const overlayHeight = overlayRect.height > 0 ? overlayRect.height : containerRect.height;
        const overlayWidth = overlayRect.width > 0 ? overlayRect.width : containerRect.width;


        const lines = Math.max(1, Math.floor(overlayHeight / lineHeight));
        const charsPerLine = Math.max(1, Math.floor(overlayWidth / charWidth));
        let glitchIntervalCount = 0;
        const maxGlitchIntervals = 25;

        let glitchInterval = setInterval(() => {
            let glitchText = '';
            for (let i = 0; i < lines; i++) {
                for (let j = 0; j < charsPerLine; j++) {
                    glitchText += context.allMatrixChars[Math.floor(Math.random() * context.allMatrixChars.length)];
                }
                glitchText += '\n';
            }
            overlay.textContent = glitchText;
            glitchIntervalCount++;
            if (glitchIntervalCount >= maxGlitchIntervals) {
                clearInterval(glitchInterval);
                finalizeEasterEgg();
            }
        }, 80);

        function finalizeEasterEgg() {
            if (context.mainContentContainer.contains(overlay)) {
                context.mainContentContainer.removeChild(overlay);
            }
            context.mainContentContainer.style.position = originalPosition;
            terminalOutput.innerHTML = '';
            context.appendToTerminal(context.fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome-wrapper');
            const quotes = [
                "Wake up, you…", "The Matrix has you.", "Follow the white rabbit.",
                "Choice is an illusion created between those with power and those without.",
                "The body cannot live without the mind.", `Statistics ≠ destiny, ${context.userDetails.userName}.`,
                "Code is just another form of déjà-vu.", "Data bends − people break.",
                "It’s not the algorithm that scares them, it’s the accuracy.",
                "Wake up, the bugs in your dreams are trying to unit test your soul.",
                "Don't think you are. Know you are. That's why you version control your skincare routine.",
                "Free your mind.", "A mind that won't question is more predictable than any ML algorithm",
                "You are not the anomaly. You are the expected exception."
            ];

            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            context.appendToTerminal(`<div><br/><span style="font-size: 1.1em; text-align: center; display: block; padding: 1em 0;">"${randomQuote}"</span><br/></div>`, 'output-success-wrapper');
            const commandInput = document.getElementById('command-input');
            if (commandInput) commandInput.focus();
        }
        setTimeout(() => {
            if (context.mainContentContainer.contains(overlay)) { // Check if overlay still exists
                clearInterval(glitchInterval);
                finalizeEasterEgg();
            }
        }, (maxGlitchIntervals * 80) + 500); // Add a buffer
    }


    const rainPresets = {
        'default': {
            description: "Resets rain to its original default configuration.",
            action: () => {
                if (typeof context.resetRainConfig === 'function') {
                    context.resetRainConfig();
                    return "Rain configuration reset to defaults.";
                }
                return "Error: Reset function not available.";
            }
        },
        'comet': {
            description: "Fewer, long, bright-headed streams with slow fades.",
            config: { speed: 50, fontSize: 20, density: 0.35, minTrail: 60, maxTrail: 90, headGlowMin: 7, headGlowMax: 13, glowBlur: 7, fadeSpeed: 0.07, decayRate: 0.965, trailMutationSpeed: 220, layers: 4, eraserChance: 0.02, fontFamily: "MatrixA, MatrixB, monospace" }
        },
        'storm': {
            description: "Very fast, dense, and chaotic code rain with quick fades.",
            config: { speed: 30, fontSize: 15, density: 1.15, lineHeight: 0.85, minTrail: 10, maxTrail: 25, headGlowMin: 2, headGlowMax: 4, glowBlur: 2, fadeSpeed: 0.28, decayRate: 0.87, trailMutationSpeed: 35, layers: 2, eraserChance: 0.1 }
        },
        'whisper': {
            description: "Subtle, dense, micro-rain with very slow character churn.",
            config: { speed: 110, fontSize: 12, lineHeight: 0.8, density: 0.95, minTrail: 30, maxTrail: 50, headGlowMin: 1, headGlowMax: 2, glowBlur: 1, fadeSpeed: 0.09, decayRate: 0.94, trailMutationSpeed: 280, fontFamily: "MatrixA, monospace", layers: 3, eraserChance: 0.01 }
        },
        'pulse': {
            description: "Layered rain with prominent erasing streams creating dynamic gaps.",
            config: { speed: 85, fontSize: 18, density: 0.5, minTrail: 20, maxTrail: 35, headGlowMin: 3, headGlowMax: 5, glowBlur: 4, fadeSpeed: 0.17, decayRate: 0.91, trailMutationSpeed: 160, layers: 5, layerOp: [1, 0.8, 0.6, 0.35, 0.15], eraserChance: 0.18 }
        },
        'ancient': {
            description: "Larger, slower, more persistent glyphs with a classic feel.",
            config: { speed: 140, fontSize: 23, density: 0.45, minTrail: 40, maxTrail: 70, headGlowMin: 2, headGlowMax: 5, glowBlur: 3, fadeSpeed: 0.05, decayRate: 0.95, trailMutationSpeed: 300, layers: 3, eraserChance: 0.03, fontFamily: "MatrixA, MatrixB, monospace" }
        }
    };

    // --- TERMINAL COMMANDS (MODIFIED for aesthetic output) ---
    const terminalCommands = {
        /**
         * @command about
         * @description Displays detailed information about the user/portfolio owner.
         * Output is formatted with a title, subtitle, and distinct sections for bio, focus, and digital presence.
         */
        'about': () => {
            // fullBioText is "Name: ...\nTitle: ...\nBio: ...\nFocus: ...\nDigital Self: ..."
            const parts = {};
            fullBioText.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    parts[key.trim().toLowerCase()] = valueParts.join(':').trim();
                }
            });

            const name = parts.name || userDetails.userName;
            const title = parts.title || userDetails.userTitle;
            const bio = parts.bio || "No bio information available.";
            const focus = parts.focus || "No focus areas specified.";
            const digitalSelf = parts['digital self'] || `GitHub: <a href="https://github.com/${userDetails.githubUser}" target="_blank" rel="noopener noreferrer">${userDetails.githubUser}</a>`;

            /**
             * @documentation A_NOTE_ON_HTML_STRING_CONSTRUCTION_AND_SPACING
             *
             * Problem:
             * Unexpected large vertical gaps can appear between logically distinct blocks of HTML
             * (e.g., between different <div class="output-section"> elements) when the HTML
             * is generated from JavaScript template literals or string concatenations.
             *
             * Cause:
             * Whitespace characters (including newlines and spaces) in the JavaScript string
             * that fall *between* the closing tag of one HTML block element and the opening tag
             * of the next can be interpreted by the browser as text nodes.
             *
             * For example, in a template literal:
             * ```javascript
             * const html = `
             * <div>Block 1</div>  // Notice the newline and indentation after this closing tag
             * <div>Block 2</div>
             * `;
             * ```
             * The newline and subsequent indentation spaces between `</div>` and `<div>` can
             * create a text node. This text node, even if visually empty of characters,
             * will occupy vertical space equivalent to the `line-height` of its parent container.
             * If the parent container has a `line-height` (e.g., 1.25 to 1.5), this "invisible"
             * text node can create a noticeable vertical gap that CSS margins on the block
             * elements themselves don't seem to explain.
             *
             * Solution:
             * Ensure that when constructing HTML strings in JavaScript, there is absolutely NO
             * whitespace (no newlines, no spaces) between the closing tag of one block-level
             * element and the opening tag of the immediately following sibling block-level element
             * if you do not intend for there to be space influenced by line-height.
             *
             * Example of a fix:
             * ```javascript
             * // Direct concatenation or single-line template parts
             * const section1 = '<div class="output-section">...Content1...</div>';
             * const section2 = '<div class="output-section">...Content2...</div>';
             * const htmlOutput = section1 + section2; // No whitespace between section1 and section2
             *
             * // Or, within a single template literal, ensure tags are adjacent:
             * const htmlOutput_alternative = `<div class="output-section">...Content1...</div><div class="output-section">...Content2...</div>`;
             * ```
             * This was particularly relevant for the 'about' command, where multiple output sections
             * were defined in a multi-line template literal, causing spaces between them.
             * The fix involved making the concatenation of these sections' HTML direct and without
             * intervening whitespace/newlines in the generated string.
             */
            const identificationHtml = `<div class="output-section"><div class="output-section-title"><i class="fas fa-user-secret"></i> IDENTIFICATION</div><div class="output-line"><span class="output-line-label">Name:</span> ${name}</div><div class="output-line"><span class="output-line-label">Title:</span> ${title}</div></div>`;
            const bioHtml = `<div class="output-section"><div class="output-section-title"><i class="fas fa-brain"></i> BIO</div><div class="output-line">${bio.replace(/\n/g, '<br/>')}</div></div>`;
            const focusHtml = `<div class="output-section"><div class="output-section-title"><i class="fas fa-crosshairs"></i> FOCUS</div><div class="output-line">${focus.replace(/\n/g, '<br/>')}</div></div>`;
            const digitalSelfHtml = `<div class="output-section"><div class="output-section-title"><i class="fas fa-link"></i> DIGITAL SELF</div><div class="output-line">${digitalSelf}</div></div>`;

            const htmlOutput = identificationHtml + bioHtml + focusHtml + digitalSelfHtml;

            context.appendToTerminal(htmlOutput, 'output-about-wrapper');
        },

        /**
         * @command clear
         * @description Clears the terminal output, keeping the initial welcome message.
         */
        'clear': () => {
            const terminalOutput = document.getElementById('terminal-output');
            if (terminalOutput) terminalOutput.innerHTML = '';
            appendToTerminal(fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome-wrapper');
        },

        /**
         * @command contact
         * @description Displays contact information: Email, LinkedIn, GitHub, and Medium (if available).
         * Each contact method is presented as a labeled link.
         */
        'contact': () => {
            let contactHtml = `<div class="output-section-title"><i class="fas fa-address-book"></i> CONTACT CHANNELS</div>`;
            contactHtml += `<div class="output-line"><span class="output-line-label">Email:</span> <a href="mailto:${userDetails.emailAddress}">${userDetails.emailAddress}</a></div>`;
            contactHtml += `<div class="output-line"><span class="output-line-label">LinkedIn:</span> <a href="https://www.linkedin.com/in/${userDetails.linkedinUser}" target="_blank" rel="noopener noreferrer">${userDetails.linkedinUser}</a></div>`;
            contactHtml += `<div class="output-line"><span class="output-line-label">GitHub:</span> <a href="https://github.com/${userDetails.githubUser}" target="_blank" rel="noopener noreferrer">${userDetails.githubUser}</a></div>`;
            if (userDetails.mediumUser) {
                contactHtml += `<div class="output-line"><span class="output-line-label">Medium:</span> <a href="https://medium.com/@${userDetails.mediumUser}" target="_blank" rel="noopener noreferrer">@${userDetails.mediumUser}</a></div>`;
            }
            appendToTerminal(`<div class="output-section">${contactHtml}</div>`, 'output-contact-wrapper');
        },

        /**
         * @command date
         * @description Displays the current local date and time.
         */
        'date': () => {
            const currentDate = new Date().toLocaleString();
            const htmlOutput = `
                <div class="output-line">
                    <span class="output-line-label"><i class="fas fa-clock" style="margin-right: 0.3em;"></i> Timestamp:</span> ${currentDate}
                </div>`;
            appendToTerminal(htmlOutput, 'output-date-wrapper');
        },

        'download': (args) => { /* ... (same functionality, can wrap output for consistency if desired) ... */
            if (args[0] && args[0].toLowerCase() === 'cv') {
                if (!userDetails.cvLink || userDetails.cvLink === "path/to/your/resume.pdf") {
                    return appendToTerminal("<div class='output-error'>CV link not configured or is a placeholder.</div>", 'output-error-wrapper');
                }
                appendToTerminal("<div>Attempting to prepare CV for viewing/download...</div>", 'output-text-wrapper');
                let finalCvLink = userDetails.cvLink;
                const gDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//;
                const match = userDetails.cvLink.match(gDriveRegex);
                if (match && match[1]) {
                    finalCvLink = `https://drive.google.com/uc?export=download&id=${match[1]}`;
                    appendToTerminal(`<div>Using Google Drive direct download link format.</div>`, 'output-text-wrapper');
                } else {
                    appendToTerminal(`<div>Using provided link directly. Behavior depends on link type.</div>`, 'output-text-wrapper');
                }
                const linkEl = document.createElement('a');
                linkEl.href = finalCvLink;
                linkEl.download = `${userDetails.userName.replace(/\s+/g, "_")}_CV.pdf`;
                linkEl.target = '_blank';
                linkEl.rel = 'noopener noreferrer';
                document.body.appendChild(linkEl);
                linkEl.click();
                document.body.removeChild(linkEl);
                appendToTerminal(`<div>If your browser blocked the pop-up or download didn't start, check your browser settings. You can also use the CV link in the navigation bar.</div>`, 'output-text-wrapper');
            } else {
                appendToTerminal("<div class='output-error'>Usage: download cv</div>", 'output-error-wrapper');
            }
        },
        'easter.egg': () => {
            activateTerminalGlitchAndQuote().catch(err => {
                console.error("Easter egg error:", err);
                appendToTerminal("<div class='output-error'>Easter egg malfunction. Please check console.</div>", "output-error-wrapper");
            });
        },
        'help': () => { /* ... (same functionality, can wrap output for consistency if desired) ... */
            const presetNames = Object.keys(rainPresets).map(p => p.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ');
            let commandList = [
                { cmd: "about", display: "about", desc: "Display information about me." },
                { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
                { cmd: "contact", display: "contact", desc: "Show contact information." },
                { cmd: "date", display: "date", desc: "Display current date and time." },
                { cmd: "download cv", display: "download cv", desc: "Download my CV." },
                { cmd: "easter.egg", display: "easter.egg", desc: "???" },
                { cmd: "rainpreset <name>", display: "rainpreset <name>", desc: `Apply rain preset. Available: ${presetNames}.` },
                { cmd: "resize term <W> <H>|reset", display: "resize term <W> <H>|reset", desc: "Resize terminal. E.g. `resize term 60vw 70vh` or `reset`." },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., `skilltree se`." },
                { cmd: "sudo", display: "sudo", desc: "Attempt superuser command (humorous)." },
                { cmd: "termopacity <0-100>", display: "termopacity <value>", desc: "Set terminal background opacity (0-100 or 0.0-1.0)." },
                { cmd: "termtext <size>", display: "termtext <size>", desc: "Set terminal font size. E.g., `termtext 13px`, `small`, `default`, `large`." },
                { cmd: "theme <name>", display: "theme <name>", desc: "Themes: amber, cyan, green, purple, twilight, crimson, forest, electricecho, goldenglitch, dark (default green)." },
                { cmd: "toggleterm", display: "toggleterm", desc: "Hide or show the terminal window (Shortcut: Ctrl + \\)." },
                { cmd: "whoami", display: "whoami", desc: "Display current user." },
            ];
            const basePad = "  "; // HTML space: &nbsp;
            const descSeparator = " - ";
            let maxDisplayLength = 0;
            commandList.forEach(item => { if (item.display.length > maxDisplayLength) maxDisplayLength = item.display.length; });

            let helpOutput = `<div class="output-section-title" style="border-left: none; padding-left:0;"><i class="fas fa-question-circle"></i> AVAILABLE COMMANDS</div>`;
            commandList.forEach(item => {
                const displayPart = item.display.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");
                const padding = "&nbsp;".repeat(maxDisplayLength - item.display.length);
                const descPart = item.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                helpOutput += `<div>${basePad.replace(/ /g, "&nbsp;")}${displayPart}${padding}${descSeparator.replace(/ /g, "&nbsp;")}${descPart}</div>`;
            });
            appendToTerminal(helpOutput, 'output-help-wrapper');
        },
        'rainpreset': (args) => { /* ... (same functionality, can wrap output for consistency if desired) ... */
            if (!args || args.length === 0) {
                appendToTerminal("<div class='output-error'>Usage: rainpreset &lt;preset_name&gt;</div>", "output-error-wrapper");
                appendToTerminal(`<div>Available presets: ${Object.keys(rainPresets).map(p => p.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ')}</div>`, "output-text-wrapper");
                return;
            }
            const presetName = args[0].toLowerCase();
            const presetData = rainPresets[presetName];

            if (!presetData) {
                appendToTerminal(`<div class='output-error'>Unknown preset: '${presetName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}'. Type 'help' for options.</div>`, "output-error-wrapper");
                return;
            }

            if (presetName === 'default' && typeof presetData.action === 'function') {
                const message = presetData.action();
                appendToTerminal(`<div class='output-success'>${message}</div>`, "output-success-wrapper");
            } else if (presetData.config && typeof context.updateRainConfig === 'function') {
                appendToTerminal(`<div>Applying preset '${presetName}'... (${presetData.description || ''})</div>`, "output-text-wrapper");
                let successCount = 0; let errorCount = 0;
                const applyOrder = ['layers', 'maxTrail', 'headGlowMax', 'minTrail', 'headGlowMin',];
                const appliedParams = new Set();
                for (const param of applyOrder) {
                    if (presetData.config.hasOwnProperty(param)) {
                        if (context.updateRainConfig(param, presetData.config[param], presetData.config)) successCount++; else errorCount++;
                        appliedParams.add(param);
                    }
                }
                for (const param in presetData.config) {
                    if (!appliedParams.has(param)) {
                        if (context.updateRainConfig(param, presetData.config[param], presetData.config)) successCount++; else errorCount++;
                    }
                }
                if (successCount > 0 && errorCount === 0) appendToTerminal(`<div class='output-success'>Rain preset '${presetName}' applied successfully.</div>`, "output-success-wrapper");
                else if (successCount > 0 && errorCount > 0) appendToTerminal(`<div class='output-warning'>Rain preset '${presetName}' partially applied with ${errorCount} error(s). Check messages above.</div>`, "output-warning-wrapper");
                else if (errorCount > 0) appendToTerminal(`<div class='output-error'>Failed to apply preset '${presetName}' due to ${errorCount} error(s).</div>`, "output-error-wrapper");
                else appendToTerminal(`<div>Preset '${presetName}' processed, but no settings were changed.</div>`, "output-text-wrapper");
            } else {
                appendToTerminal(`<div class='output-error'>Preset '${presetName}' is misconfigured or the update function is unavailable.</div>`, "output-error-wrapper");
            }
        },
        'resize': (args) => { /* ... (same functionality, can wrap output for consistency if desired) ... */
            if (args[0] && args[0].toLowerCase() === 'term') {
                if (args.length === 2 && args[1].toLowerCase() === 'reset') {
                    if (typeof resizeTerminalElement === 'function' && defaultTerminalSize) {
                        resizeTerminalElement(defaultTerminalSize.width, defaultTerminalSize.height);
                        appendToTerminal(`<div class='output-success'>Terminal resized to default: ${defaultTerminalSize.width} width, ${defaultTerminalSize.height} height.</div>`, 'output-success-wrapper');
                    } else {
                        appendToTerminal("<div class='output-error'>Terminal reset function or default sizes not available.</div>", 'output-error-wrapper');
                    }
                } else if (args.length === 3) {
                    const width = args[1]; const height = args[2];
                    const validUnits = /^\d+(\.\d+)?(px|%|vw|vh)$/i;
                    if (validUnits.test(width) && validUnits.test(height)) {
                        if (typeof resizeTerminalElement === 'function') {
                            resizeTerminalElement(width, height);
                            appendToTerminal(`<div class='output-success'>Terminal resized to ${width} width, ${height} height.</div>`, 'output-success-wrapper');
                        } else {
                            appendToTerminal("<div class='output-error'>Terminal resize function not available.</div>", 'output-error-wrapper');
                        }
                    } else {
                        appendToTerminal("<div class='output-error'>Invalid size units. Use px, %, vw, or vh (e.g., 600px, 80%, 70vw, 60vh).</div>", 'output-error-wrapper');
                    }
                } else {
                    appendToTerminal("<div class='output-error'>Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset</div>", 'output-error-wrapper');
                }
            } else {
                appendToTerminal("<div class='output-error'>Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset</div>", 'output-error-wrapper');
            }
        },

        /**
         * @command skills
         * @description Displays a summary of key skill areas, formatted with categories and lists.
         */
        'skills': () => {
            // This provides a summary. `skilltree` gives the detailed view.
            // We can take the top-level categories from skillsData for a nicer summary.
            let htmlOutput = `<div class="output-section-title"><i class="fas fa-cogs"></i> CORE SKILLSET MATRIX</div>`;
            if (skillsData.children && skillsData.children.length > 0) {
                skillsData.children.forEach(category => {
                    htmlOutput += `<div class="output-skills-category">${category.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
                    htmlOutput += `<ul class="output-skills-list">`;
                    if (category.children && category.children.length > 0) {
                        category.children.slice(0, 3).forEach(subCategory => { // Show a few sub-categories
                            htmlOutput += `<li>${subCategory.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
                        });
                        if (category.children.length > 3) {
                            htmlOutput += `<li>... and more (use 'skilltree ${category.aliases[0] || category.name.toLowerCase().split(' ')[0]}')</li>`;
                        }
                    } else {
                        htmlOutput += `<li>(Details via 'skilltree')</li>`;
                    }
                    htmlOutput += `</ul>`;
                });
            } else {
                htmlOutput += `<div class="output-line">No skill categories defined.</div>`;
            }
            htmlOutput += `<br/><div>Type 'skilltree' for a detailed breakdown or 'skilltree [path]' to explore specific areas (e.g., 'skilltree ai').</div>`;
            appendToTerminal(htmlOutput, 'output-skills-wrapper');
        },
        'skilltree': (args) => { /* ... (same functionality, output is already tree-like, can wrap for consistency) ... */
            const pathArg = args.join(' ').trim();
            let targetNode = skillsData;
            let displayPath = skillsData.name;

            if (pathArg) {
                const pathParts = pathArg.includes('>') ? pathArg.split('>').map(p => p.trim().toLowerCase()) : [pathArg.trim().toLowerCase()];
                let currentNode = skillsData; let currentPathForDisplayArray = []; let pathFound = true;
                for (const part of pathParts) {
                    if (!part) continue;
                    let foundNodeInChildren = null;
                    if (currentNode.children) {
                        foundNodeInChildren = currentNode.children.find(child => child.name.toLowerCase() === part || child.name.split('(')[0].trim().toLowerCase() === part || (child.aliases && child.aliases.map(a => a.toLowerCase()).includes(part)));
                    }
                    if (foundNodeInChildren) { currentNode = foundNodeInChildren; currentPathForDisplayArray.push(currentNode.name); }
                    else {
                        const errorPathTrail = currentPathForDisplayArray.length > 0 ? currentPathForDisplayArray.join(' > ') + ' > ' : '';
                        appendToTerminal(`<div class='output-error'>Path segment not found: "${part.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" in "${errorPathTrail.replace(/</g, "&lt;").replace(/>/g, "&gt;")}${part.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"</div>`, 'output-error-wrapper');
                        pathFound = false; break;
                    }
                }
                if (pathFound) { targetNode = currentNode; displayPath = skillsData.name + (currentPathForDisplayArray.length > 0 ? " > " + currentPathForDisplayArray.join(' > ') : ""); }
                else return;
            }

            const outputArray = [`<div class="output-section-title" style="border-left: none; padding-left:0;"><i class="fas fa-sitemap"></i> Skill Pathway: ${displayPath.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`];
            if (targetNode.children && targetNode.children.length > 0) {
                targetNode.children.forEach((child, index) => renderSkillTree(child, '  ', index === targetNode.children.length - 1, outputArray));
            } else if (targetNode !== skillsData) {
                outputArray.push("    └── (End of this skill branch. Explore other paths or type `skilltree` to see all top categories!)");
            } else if (targetNode === skillsData && (!targetNode.children || targetNode.children.length === 0)) {
                outputArray.push("  (No skill categories defined under root)");
            }

            appendToTerminal(outputArray.join('\n').replace(/\n/g, '<br/>'), 'output-skilltree-wrapper');
            if (!pathArg && skillsData.children && skillsData.children.length > 0) {
                appendToTerminal("<div>Hint: Navigate deeper using aliases (e.g., `skilltree se`) or full paths (e.g., `skilltree \"AI & ML > GenAI\"`).</div>", "output-text-wrapper");
            }
        },
        'sudo': (args) => {
            appendToTerminal(`<div class="output-error"><i class="fas fa-user-shield" style="margin-right: 0.3em;"></i> Access Denied. User '${userDetails.userName}' is not authorized for 'sudo'. This incident will be logged (not really).</div>`, 'output-error-wrapper');
        },

        /**
         * @command termopacity
         * @description Sets the opacity of the terminal background.
         * @param {string[]} args - The first argument is the opacity value (0-100 or 0.0-1.0).
         * 'reset' will restore the theme's default opacity.
         */
        'termopacity': (args) => {
            if (!args || args.length === 0) {
                const currentOpacity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--terminal-opacity').trim()) * 100;
                appendToTerminal("<div class='output-error'>Usage: termopacity &lt;value&gt; (0-100 or 0.0-1.0) or 'termopacity reset'</div>", 'output-error-wrapper');
                appendToTerminal(`<div>Current terminal opacity: ${currentOpacity.toFixed(0)}%</div>`, 'output-text-wrapper');
                return;
            }

            const input = args[0].toLowerCase();
            let newOpacity;

            if (input === 'reset') {
                newOpacity = initialTerminalOpacity; // Use the initial opacity passed from matrix-rain.js
                document.documentElement.style.setProperty('--terminal-opacity', String(newOpacity));
                appendToTerminal(`<div class='output-success'>Terminal opacity reset to default (${(newOpacity * 100).toFixed(0)}%).</div>`, 'output-success-wrapper');
                return;
            }

            let parsedInput = parseFloat(input);
            if (isNaN(parsedInput)) {
                appendToTerminal("<div class='output-error'>Invalid opacity value. Must be a number (e.g., 75 or 0.75) or 'reset'.</div>", 'output-error-wrapper');
                return;
            }

            if (parsedInput > 1 && parsedInput <= 100) { // Assume it's a percentage
                newOpacity = parsedInput / 100;
            } else if (parsedInput >= 0 && parsedInput <= 1) { // Assume it's a decimal
                newOpacity = parsedInput;
            } else {
                appendToTerminal("<div class='output-error'>Opacity value out of range. Must be between 0-100 (for percentage) or 0.0-1.0 (for decimal).</div>", 'output-error-wrapper');
                return;
            }

            // Clamp value just in case
            newOpacity = Math.max(0, Math.min(1, newOpacity));

            document.documentElement.style.setProperty('--terminal-opacity', String(newOpacity));
            appendToTerminal(`<div class='output-success'>Terminal opacity set to ${(newOpacity * 100).toFixed(0)}%.</div>`, 'output-success-wrapper');
        },

        'termtext': (args) => { /* ... (same functionality, can wrap output for consistency if desired) ... */
            if (!args || args.length === 0) {
                appendToTerminal("<div class='output-error'>Usage: termtext &lt;size&gt;</div>", 'output-error-wrapper');
                appendToTerminal("<div>Examples: termtext 13px, termtext small, termtext default, termtext large</div>", 'output-text-wrapper');
                const currentSize = getComputedStyle(document.documentElement).getPropertyValue('--terminal-font-size');
                appendToTerminal(`<div>Current terminal font size: ${currentSize || 'default (12.5px)'}</div>`, 'output-text-wrapper');
                return;
            }
            const inputSize = args[0].toLowerCase(); let newSize = '';
            if (inputSize === 'small') newSize = '10.5px';
            else if (inputSize === 'default') newSize = '12.5px';
            else if (inputSize === 'large') newSize = '15px';
            else if (/^\d+(\.\d+)?px$/i.test(inputSize) || /^\d+(\.\d+)?em$/i.test(inputSize) || /^\d+(\.\d+)?rem$/i.test(inputSize)) {
                const sizeValue = parseFloat(inputSize);
                if (inputSize.endsWith('px') && (sizeValue < 7 || sizeValue > 28)) {
                    appendToTerminal("<div class='output-error'>Pixel size out of reasonable range (7px-28px).</div>", 'output-error-wrapper'); return;
                }
                newSize = inputSize;
            } else {
                appendToTerminal("<div class='output-error'>Invalid size. Use 'small', 'default', 'large', or a value like '10px', '1.2em'.</div>", 'output-error-wrapper'); return;
            }
            document.documentElement.style.setProperty('--terminal-font-size', newSize);
            appendToTerminal(`<div class='output-success'>Terminal font size set to ${newSize}.</div>`, 'output-success-wrapper');
        },

        /**
         * @command theme
         * @description Changes the color theme of the portfolio.
         * Also updates CSS variables for terminal base background color components (--terminal-base-r,g,b).
         * @param {string[]} args - The first argument is the theme name.
         */
        'theme': (args) => {
            const themeNameInput = args[0] ? args[0].toLowerCase() : null;
            const darkThemes = ['amber', 'cyan', 'green', 'purple', 'twilight', 'crimson', 'forest', 'electricecho', 'goldenglitch'];
            const validSpecificThemes = [...darkThemes]; // No light themes defined in current CSS structure
            const allValidOptions = [...validSpecificThemes, 'dark']; // 'dark' reverts to green

            const showThemeUsage = () => {
                const currentThemeClass = Array.from(document.body.classList).find(cls => cls.startsWith('theme-')) || 'theme-green';
                appendToTerminal("<div class='output-error'>Usage: theme &lt;name&gt;</div>", 'output-error-wrapper');
                appendToTerminal(`<div>Available themes: ${validSpecificThemes.sort().join(', ')}, dark (reverts to green).</div>`, 'output-text-wrapper');
                appendToTerminal(`<div>Current theme: ${currentThemeClass.replace('theme-', '')}</div>`, 'output-text-wrapper');
            };

            if (!themeNameInput) {
                showThemeUsage();
                return;
            }

            if (allValidOptions.includes(themeNameInput)) {
                document.body.classList.forEach(className => {
                    if (className.startsWith('theme-')) {
                        document.body.classList.remove(className);
                    }
                });

                let targetThemeClass = '';
                if (themeNameInput === 'dark') {
                    targetThemeClass = 'theme-green'; // Default dark is green
                } else {
                    targetThemeClass = `theme-${themeNameInput}`;
                }
                document.body.classList.add(targetThemeClass);

                // After adding the class, read the new --terminal-base-r,g,b values set by the theme's CSS
                // and apply them. The CSS itself should define these for each theme.
                // No need to explicitly set them here if CSS is correctly structured.
                // The `restartMatrixRain` function will call `updateRainColorsFromTheme`
                // which reads the new `--primary-color` for the rain and updates `--primary-color-rgb`.

                appendToTerminal(`<div class='output-success'>Theme set to ${targetThemeClass.replace('theme-', '')}.</div>`, 'output-success-wrapper');

                if (typeof restartMatrixRain === 'function') {
                    restartMatrixRain(); // This updates rain colors and --primary-color-rgb
                }

            } else {
                appendToTerminal(`<div class='output-error'>Error: Theme "${themeNameInput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" not found.</div>`, 'output-error-wrapper');
                showThemeUsage();
            }
        },
        'toggleterm': () => {
            if (typeof toggleTerminal === 'function') {
                toggleTerminal();
            } else {
                appendToTerminal("<div class='output-error'>Error: Terminal toggle functionality is not available.</div>", "output-error-wrapper");
            }
        },

        /**
         * @command whoami
         * @description Displays the current user's configured name.
         */
        'whoami': () => {
            const htmlOutput = `<div class="output-line"><span class="output-line-label"><i class="fas fa-fingerprint" style="margin-right: 0.3em;"></i> User:</span> ${userDetails.userName}</div>`;
            appendToTerminal(htmlOutput, 'output-whoami-wrapper');
        }
    };

    return terminalCommands;
}