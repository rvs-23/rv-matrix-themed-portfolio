function getTerminalCommands(context) {
    const {
        appendToTerminal,
        fullWelcomeMessageString,
        userDetails,
        fullBioText,
        mainContentContainer,
        allMatrixChars, 
        resizeTerminalElement,
        defaultTerminalSize,
        getRainConfig,    // Used for easter egg font and potentially by presets if needed
        updateRainConfig, // Crucial for presets
        resetRainConfig,  // For the 'default' preset
        restartMatrixRain, 
    } = context;

    // --- SKILLS DATA ---
    const skillsData = { /* ... (Your existing skillsData object - keep as is) ... */
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
                    { name: "DevOps" , aliases: ["devops", "ci/cd"]},
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
    function renderSkillTree(node, indent = '', isLast = true, outputArray = []) { /* ... (Your existing renderSkillTree - keep as is) ... */
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

    // --- EASTER EGG (Font Update) ---
    async function activateTerminalGlitchAndQuote() {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput || !context.mainContentContainer) return;
        context.appendToTerminal("Initiating system override...", "output-error");
        await new Promise(resolve => setTimeout(resolve, 300));

        const overlay = document.createElement('div');
        overlay.className = 'terminal-glitch-overlay';
        
        // --- Start Easter Egg Font Fix ---
        // Get current rain font family from CFG to apply to glitch text
        const currentRainConfig = context.getRainConfig ? context.getRainConfig() : {};
        const glitchFontFamily = currentRainConfig.fontFamily || "MatrixA, MatrixB, monospace"; // Fallback
        overlay.style.fontFamily = glitchFontFamily;
        // --- End Easter Egg Font Fix ---

        const originalPosition = context.mainContentContainer.style.position;
        context.mainContentContainer.style.position = 'relative';
        context.mainContentContainer.appendChild(overlay);

        const computedStyle = getComputedStyle(terminalOutput);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
        const glitchFontSize = parseFloat(computedStyle.fontSize) || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--terminal-font-size')) || 11;
        const charWidth = (glitchFontSize * 0.6);
        const overlayHeight = overlay.clientHeight > 0 ? overlay.clientHeight : context.mainContentContainer.clientHeight;
        const overlayWidth = overlay.clientWidth > 0 ? overlay.clientWidth : context.mainContentContainer.clientWidth;

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
            overlay.textContent = glitchText; // Characters will now render with TTF via overlay style
            glitchIntervalCount++;
            if (glitchIntervalCount >= maxGlitchIntervals) {
                 clearInterval(glitchInterval);
                 finalizeEasterEgg();
            }
        }, 80);

        function finalizeEasterEgg() { /* ... (rest of finalizeEasterEgg same as before) ... */
            if (context.mainContentContainer.contains(overlay)) {
                context.mainContentContainer.removeChild(overlay);
            }
            context.mainContentContainer.style.position = originalPosition;
            terminalOutput.innerHTML = '';
            context.appendToTerminal(context.fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome');
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
            context.appendToTerminal(`\n\n<span style="font-size: 1.1em; text-align: center; display: block; padding: 1em 0;">"${randomQuote}"</span>\n\n`, 'output-success');
            const commandInput = document.getElementById('command-input');
            if(commandInput) commandInput.focus();
        }
        setTimeout(() => {
            if (context.mainContentContainer.contains(overlay)) {
                 clearInterval(glitchInterval);
                 finalizeEasterEgg();
            }
        }, (maxGlitchIntervals * 80) + 500);
    }

    // --- RAIN PRESETS DEFINITIONS (using friendly names from MAPPINGS in matrix.js) ---
    const rainPresets = {
        'default': { // Special case: calls reset function
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
            config: { // Uses friendly names from MAPPINGS in matrix.js
                speed: 50, fontSize: 20, density: 0.35,
                minTrail: 60, maxTrail: 90,       // Ensure maxTrail is applied/considered first by update logic
                headGlowMin: 7, headGlowMax: 13,  // Ensure headGlowMax is applied/considered first
                glowBlur: 7,
                fadeSpeed: 0.07, decayRate: 0.965, trailMutationSpeed: 220,
                layers: 4, eraserChance: 0.02,
                fontFamily: "MatrixA, MatrixB, monospace" // Example, can be omitted to use current
            }
        },
        'storm': {
            description: "Very fast, dense, and chaotic code rain with quick fades.",
            config: {
                speed: 30, fontSize: 15, density: 1.15, lineHeight: 0.85,
                minTrail: 10, maxTrail: 25,
                headGlowMin: 2, headGlowMax: 4,
                glowBlur: 2,
                fadeSpeed: 0.28, decayRate: 0.87, trailMutationSpeed: 35,
                layers: 2, eraserChance: 0.1
            }
        },
        'whisper': {
            description: "Subtle, dense, micro-rain with very slow character churn.",
            config: {
                speed: 110, fontSize: 12, lineHeight: 0.8, density: 0.95,
                minTrail: 30, maxTrail: 50,
                headGlowMin: 1, headGlowMax: 2,
                glowBlur: 1,
                fadeSpeed: 0.09, decayRate: 0.94, trailMutationSpeed: 280,
                fontFamily: "MatrixA, monospace", 
                layers: 3, eraserChance: 0.01
            }
        },
        'pulse': {
            description: "Layered rain with prominent erasing streams creating dynamic gaps.",
            config: {
                speed: 85, fontSize: 18, density: 0.5,
                minTrail: 20, maxTrail: 35,      // Fixed: min <= max
                headGlowMin: 3, headGlowMax: 5,   // Fixed: min <= max
                glowBlur: 4,
                fadeSpeed: 0.17, decayRate: 0.91, trailMutationSpeed: 160,
                layers: 5, 
                layerOp: [1, 0.8, 0.6, 0.35, 0.15], // Must match 'layers: 5'
                eraserChance: 0.18
            }
        },
        'ancient': {
            description: "Larger, slower, more persistent glyphs with a classic feel.",
            config: {
                speed: 140, fontSize: 23, density: 0.45,
                minTrail: 40, maxTrail: 70,
                headGlowMin: 2, headGlowMax: 5,
                glowBlur: 3,
                fadeSpeed: 0.05, decayRate: 0.95, trailMutationSpeed: 300,
                layers: 3, eraserChance: 0.03,
                fontFamily: "MatrixA, MatrixB, monospace" // Different emphasis
            }
        }
    };

    // --- TERMINAL COMMANDS ---
    const terminalCommands = {
        // ... (about, clear, contact, date, download, easter.egg - keep as is) ...
        'about': () => appendToTerminal(fullBioText.replace(/\n/g, '<br/>')),
        'clear': () => {
            const terminalOutput = document.getElementById('terminal-output');
            if (terminalOutput) terminalOutput.innerHTML = '';
            appendToTerminal(fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome');
        },
        'contact': () => {
            let contactDetails = `Email: <a href="mailto:${userDetails.emailAddress}">${userDetails.emailAddress}</a>\nLinkedIn: <a href="https://www.linkedin.com/in/${userDetails.linkedinUser}" target="_blank" rel="noopener noreferrer">${userDetails.linkedinUser}</a>\nGitHub: <a href="https://github.com/${userDetails.githubUser}" target="_blank" rel="noopener noreferrer">${userDetails.githubUser}</a>`;
            if (userDetails.mediumUser) {
                contactDetails += `\nMedium: <a href="https://medium.com/@${userDetails.mediumUser}" target="_blank" rel="noopener noreferrer">@${userDetails.mediumUser}</a>`;
            }
            appendToTerminal(contactDetails.replace(/\n/g, '<br/>'));
        },
        'date': () => appendToTerminal(new Date().toLocaleString()),
        'download': (args) => {
            if (args[0] && args[0].toLowerCase() === 'cv') {
                if (!userDetails.cvLink || userDetails.cvLink === "path/to/your/resume.pdf") {
                    return appendToTerminal("CV link not configured or is a placeholder.", 'output-error');
                }
                appendToTerminal(`Attempting to prepare CV for viewing/download...`);
                let finalCvLink = userDetails.cvLink;
                const gDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//;
                const match = userDetails.cvLink.match(gDriveRegex);
                if (match && match[1]) {
                    finalCvLink = `https://drive.google.com/uc?export=download&id=${match[1]}`;
                    appendToTerminal(`Using Google Drive direct download link format.`);
                } else {
                    appendToTerminal(`Using provided link directly. Behavior depends on link type.`);
                }
                const linkEl = document.createElement('a');
                linkEl.href = finalCvLink;
                linkEl.download = `${userDetails.userName.replace(/\s+/g, "_")}_CV.pdf`;
                linkEl.target = '_blank';
                linkEl.rel = 'noopener noreferrer';
                document.body.appendChild(linkEl);
                linkEl.click();
                document.body.removeChild(linkEl);
                appendToTerminal(`If your browser blocked the pop-up or download didn't start, check your browser settings. You can also use the CV link in the navigation bar.`, 'output-text');
            } else {
                appendToTerminal(`Usage: download cv`, 'output-error');
            }
        },
        'easter.egg': () => {
            activateTerminalGlitchAndQuote().catch(err => {
                console.error("Easter egg error:", err);
                appendToTerminal("Easter egg malfunction. Please check console.", "output-error");
            });
        },
        'help': () => {
            const presetNames = Object.keys(rainPresets).map(p => p.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ');
            let commandList = [
                { cmd: "about", display: "about", desc: "Display information about me." },
                { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
                { cmd: "contact", display: "contact", desc: "Show contact information." },
                { cmd: "date", display: "date", desc: "Display current date and time." },
                { cmd: "download cv", display: "download cv", desc: "Download my CV." },
                { cmd: "easter.egg", display: "easter.egg", desc: "???" },
                { cmd: "projects", display: "projects", desc: "Show my featured projects." },
                { cmd: "rainpreset <name>", display: "rainpreset <name>", desc: `Apply rain preset. Available: ${presetNames}.` },
                { cmd: "resize term <W> <H>|reset", display: "resize term <W> <H>|reset", desc: "Resize terminal. E.g. `resize term 60vw 70vh` or `reset`." },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., `skilltree se`." },
                { cmd: "termtext <size>", display: "termtext <size>", desc: "Set terminal font size. E.g., `termtext 12px`, `small`, `medium`, `large`." },
                { cmd: "theme <name>", display: "theme <name>", desc: "Themes: amber, cyan, green, purple, twilight, crimson, forest, electricecho, goldenglitch, dark (default green)." },
                { cmd: "whoami", display: "whoami", desc: "Display current user." },
                { cmd: "sudo", display: "sudo", desc: "Attempt superuser command (humorous)." },
            ];
            const basePad = "  ";
            const descSeparator = " - ";
            let maxDisplayLength = 0;
            commandList.forEach(item => { if (item.display.length > maxDisplayLength) maxDisplayLength = item.display.length; });
            let helpOutput = "Available commands:\n";
            commandList.forEach(item => {
                const displayPart = item.display.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");
                const padding = "&nbsp;".repeat(maxDisplayLength - item.display.length);
                const descPart = item.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                helpOutput += `${basePad}${displayPart}${padding}${descSeparator.replace(/ /g, "&nbsp;")}${descPart}\n`;
            });
            appendToTerminal(helpOutput.trim().replace(/\n/g, '<br/>'));
        },
        'projects': () => { /* ... (same as before) ... */
            appendToTerminal("Project showcase under development. Check GitHub for now!");
            appendToTerminal(`Visit: <a href="https://github.com/${userDetails.githubUser}" target="_blank" rel="noopener noreferrer">github.com/${userDetails.githubUser}</a>`);
        },
        'rainpreset': (args) => {
            if (!args || args.length === 0) {
                appendToTerminal("Usage: rainpreset <preset_name>", "output-error");
                appendToTerminal(`Available presets: ${Object.keys(rainPresets).map(p => p.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(', ')}`, "output-text");
                return;
            }
            const presetName = args[0].toLowerCase();
            const presetData = rainPresets[presetName];

            if (!presetData) {
                appendToTerminal(`Unknown preset: '${presetName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}'. Type 'help' for options.`, "output-error");
                return;
            }

            if (presetName === 'default' && typeof presetData.action === 'function') {
                const message = presetData.action(); // Calls resetRainConfig() via context
                appendToTerminal(message, "output-success");
            } else if (presetData.config && typeof context.updateRainConfig === 'function') {
                appendToTerminal(`Applying preset '${presetName}'... (${presetData.description || ''})`, "output-text");
                
                let successCount = 0;
                let errorCount = 0;
                
                // Define an order for applying settings to help with dependencies
                // Max values first, then min values, then others.
                const applyOrder = [
                    'layers', // Apply layers first if layerOp depends on it
                    'maxTrail', 'headGlowMax', 
                    'minTrail', 'headGlowMin', 
                ];
                const appliedParams = new Set();

                // Apply ordered parameters first
                for (const param of applyOrder) {
                    if (presetData.config.hasOwnProperty(param)) {
                        if (context.updateRainConfig(param, presetData.config[param], presetData.config)) {
                            successCount++;
                        } else {
                            errorCount++;
                            // Error message is handled by updateRainConfig
                        }
                        appliedParams.add(param);
                    }
                }

                // Apply remaining parameters
                for (const param in presetData.config) {
                    if (!appliedParams.has(param)) {
                         // Pass the full preset config as the third argument for context-aware validation
                        if (context.updateRainConfig(param, presetData.config[param], presetData.config)) {
                            successCount++;
                        } else {
                            errorCount++;
                            // Error message is handled by updateRainConfig
                        }
                    }
                }

                if (successCount > 0 && errorCount === 0) {
                    appendToTerminal(`Rain preset '${presetName}' applied successfully.`, "output-success");
                } else if (successCount > 0 && errorCount > 0) {
                    appendToTerminal(`Rain preset '${presetName}' partially applied with ${errorCount} error(s). Check messages above.`, "output-warning");
                } else if (errorCount > 0) {
                    appendToTerminal(`Failed to apply preset '${presetName}' due to ${errorCount} error(s).`, "output-error");
                } else {
                     appendToTerminal(`Preset '${presetName}' processed, but no settings were changed (or all failed silently).`, "output-text"); // Should not happen if validation works
                }
            } else {
                 appendToTerminal(`Preset '${presetName}' is misconfigured or the update function is unavailable.`, "output-error");
            }
        },
        'resize': (args) => { /* ... (same as before) ... */
            if (args[0] && args[0].toLowerCase() === 'term') {
                if (args.length === 2 && args[1].toLowerCase() === 'reset') {
                    if (typeof resizeTerminalElement === 'function' && defaultTerminalSize) {
                        resizeTerminalElement(defaultTerminalSize.width, defaultTerminalSize.height);
                        appendToTerminal(`Terminal resized to default: ${defaultTerminalSize.width} width, ${defaultTerminalSize.height} height.`, 'output-success');
                    } else {
                        appendToTerminal('Terminal reset function or default sizes not available.', 'output-error');
                    }
                } else if (args.length === 3) {
                    const width = args[1];
                    const height = args[2];
                    const validUnits = /^\d+(\.\d+)?(px|%|vw|vh)$/i;
                    if (validUnits.test(width) && validUnits.test(height)) {
                        if (typeof resizeTerminalElement === 'function') {
                            resizeTerminalElement(width, height);
                            appendToTerminal(`Terminal resized to ${width} width, ${height} height.`, 'output-success');
                        } else {
                            appendToTerminal('Terminal resize function not available.', 'output-error');
                        }
                    } else {
                        appendToTerminal('Invalid size units. Use px, %, vw, or vh (e.g., 600px, 80%, 70vw, 60vh).', 'output-error');
                    }
                } else {
                    appendToTerminal('Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset', 'output-error');
                    appendToTerminal('Example: resize term 700px 60vh  OR  resize term reset');
                }
            } else {
                appendToTerminal('Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset', 'output-error');
            }
        },
        'skills': () => { /* ... (same as before) ... */
            appendToTerminal(`Key Areas: Software Engineering (Languages, Frameworks, Frontend, Backend, DevOps), AI/ML (Regression, Classification, GenAI, XAI, NLP/DL Basics), Data Science & Analysis (Stats, Viz, OR), Platforms & Tools (Palantir Foundry, REST APIs, Git).\nType 'skilltree' for a detailed breakdown or 'skilltree [path]' to explore specific areas (e.g., 'skilltree ai').`.replace(/\n/g, '<br/>'));
        },
        'skilltree': (args) => { /* ... (same as before) ... */
            const pathArg = args.join(' ').trim();
            let targetNode = skillsData;
            let displayPath = skillsData.name;

            if (pathArg) {
                const pathParts = pathArg.includes('>') ? pathArg.split('>').map(p => p.trim().toLowerCase()) : [pathArg.trim().toLowerCase()];
                let currentNode = skillsData;
                let currentPathForDisplayArray = [];
                let pathFound = true;

                for (const part of pathParts) {
                    if (!part) continue;
                    let foundNodeInChildren = null;
                    if (currentNode.children) {
                        foundNodeInChildren = currentNode.children.find(child =>
                            child.name.toLowerCase() === part ||
                            child.name.split('(')[0].trim().toLowerCase() === part ||
                            (child.aliases && child.aliases.map(a => a.toLowerCase()).includes(part))
                        );
                    }

                    if (foundNodeInChildren) {
                        currentNode = foundNodeInChildren;
                        currentPathForDisplayArray.push(currentNode.name);
                    } else {
                        const errorPathTrail = currentPathForDisplayArray.length > 0 ? currentPathForDisplayArray.join(' > ') + ' > ' : '';
                        appendToTerminal(`Path segment not found: "${part.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" in "${errorPathTrail.replace(/</g, "&lt;").replace(/>/g, "&gt;")}${part.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`, 'output-error');
                        pathFound = false;
                        break;
                    }
                }
                if (pathFound) {
                    targetNode = currentNode;
                    displayPath = skillsData.name + (currentPathForDisplayArray.length > 0 ? " > " + currentPathForDisplayArray.join(' > ') : "");
                } else {
                    return;
                }
            }

            const outputArray = [`Displaying Skills: ${displayPath.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`];
            if (targetNode.children && targetNode.children.length > 0) {
                targetNode.children.forEach((child, index) => {
                    renderSkillTree(child, '  ', index === targetNode.children.length - 1, outputArray);
                });
            } else if (targetNode !== skillsData) {
                 outputArray.push("    └── (End of this skill branch. Explore other paths or type `skilltree` to see all top categories!)");
            } else if (targetNode === skillsData && (!targetNode.children || targetNode.children.length === 0 )) {
                outputArray.push("  (No skill categories defined under root)");
            }

            appendToTerminal(outputArray.join('\n').replace(/\n/g, '<br/>'));
            if (!pathArg && skillsData.children && skillsData.children.length > 0) {
                 appendToTerminal("Hint: Navigate deeper using aliases (e.g., `skilltree se`) or full paths (e.g., `skilltree \"AI & ML > GenAI\"`).", "output-text");
            }
        },
        'sudo': (args) => { /* ... (same as before) ... */
            appendToTerminal(`Access Denied. User '${userDetails.userName}' is not authorized to use 'sudo'. This incident will be logged (not really).`, 'output-error');
        },
        'termtext': (args) => { /* ... (same as before, from previous turn's full code) ... */
            if (!args || args.length === 0) {
                appendToTerminal('Usage: termtext <size>', 'output-error');
                appendToTerminal('Examples: termtext 12px, termtext small, termtext medium, termtext large', 'output-text');
                const currentSize = getComputedStyle(document.documentElement).getPropertyValue('--terminal-font-size');
                appendToTerminal(`Current terminal font size: ${currentSize || 'default (11px)'}`, 'output-text');
                return;
            }
            const inputSize = args[0].toLowerCase();
            let newSize = '';

            if (inputSize === 'small') newSize = '9px';
            else if (inputSize === 'medium') newSize = '11px'; 
            else if (inputSize === 'large') newSize = '14px';
            else if (/^\d+(\.\d+)?px$/i.test(inputSize) || /^\d+(\.\d+)?em$/i.test(inputSize) || /^\d+(\.\d+)?rem$/i.test(inputSize)) {
                const sizeValue = parseFloat(inputSize);
                if (inputSize.endsWith('px') && (sizeValue < 6 || sizeValue > 24)) {
                     appendToTerminal('Pixel size out of reasonable range (6px-24px).', 'output-error'); return;
                }
                newSize = inputSize;
            } else {
                appendToTerminal('Invalid size. Use "small", "medium", "large", or a value like "10px", "1.2em".', 'output-error');
                return;
            }

            document.documentElement.style.setProperty('--terminal-font-size', newSize);
            appendToTerminal(`Terminal font size set to ${newSize}.`, 'output-success');
        },
        'theme': (args) => { /* ... (same as before, from previous turn's full code) ... */
            const themeNameInput = args[0] ? args[0].toLowerCase() : null;
            const darkThemes = ['amber', 'cyan', 'green', 'purple', 'twilight', 'crimson', 'forest', 'electricecho', 'goldenglitch'];
            const validSpecificThemes = [...darkThemes];
            const allValidOptions = [...validSpecificThemes, 'dark']; 

            const currentThemeClass = Array.from(document.body.classList).find(cls => cls.startsWith('theme-'));
            const currentFontClass = Array.from(document.body.classList).find(cls => cls.startsWith('font-'));

            const showThemeUsage = () => {
                appendToTerminal(`Usage: theme &lt;name&gt;`, 'output-text');
                appendToTerminal(`Available themes: ${validSpecificThemes.sort().join(', ')}, dark (default green).`);
                appendToTerminal(`Current theme: ${currentThemeClass ? currentThemeClass.replace('theme-','') : 'green'}`);
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
                
                if (themeNameInput === 'dark') {
                    document.body.classList.add('theme-green');
                    appendToTerminal('Theme set to dark mode (default: green).', 'output-success');
                } else if (validSpecificThemes.includes(themeNameInput)) {
                    document.body.classList.add(`theme-${themeNameInput}`);
                    appendToTerminal(`Theme set to ${themeNameInput}.`, 'output-success');
                }

                if (currentFontClass) {
                    document.body.classList.add(currentFontClass);
                }
                if (typeof restartMatrixRain === 'function') { 
                    restartMatrixRain();
                }

            } else {
                appendToTerminal(`Error: Theme "${themeNameInput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" not found.`, 'output-error');
                showThemeUsage();
            }
        },
        'whoami': () => { /* ... (same as before) ... */
            appendToTerminal(userDetails.userName);
        }
    };

    return terminalCommands;
}