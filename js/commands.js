/**
 * @file commands.js
 * Defines terminal commands, skill tree data, and related logic for the Matrix Terminal Portfolio.
 */

/**
 * Defines and returns the command definitions for the terminal.
 * @param {object} context - An object containing necessary functions and data from matrix.js.
 * @param {function} context.appendToTerminal - Function to append output to the terminal.
 * @param {string} context.fullWelcomeMessageString - The full welcome message string.
 * @param {object} context.userDetails - Object containing user details like userName, cvLink, etc.
 * @param {string} context.fullBioText - The complete bio text with newlines.
 * @param {HTMLElement} context.mainContentContainer - Reference to the main terminal container.
 * @param {string} context.allMatrixChars - String of all characters for glitch effects.
 * @param {function} context.resizeTerminalElement - Function to resize the terminal.
 * @param {object} context.defaultTerminalSize - Object containing default width and height for terminal.
 * @param {function} context.getRainConfig - Function to get current rain config (includes availableFonts).
 * @param {function} context.updateRainConfig - Function to update rain config.
 * @param {function} context.resetRainConfig - Function to reset rain config.
 * @param {function} context.restartMatrixRain - Function to apply rain config changes.
 * @returns {object} The terminalCommands object.
 */
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
        getRainConfig,
        updateRainConfig,
        resetRainConfig,
        restartMatrixRain,
    } = context;

    // New default rain config values (can be fetched from context.getRainConfig() if needed for base)
    // For preset calculations, we use the new global defaults.
    const newDefaultConfig = { // Mirrored from matrix.js for clarity in preset design
        fontSize: 15,
        speed: 101,
        density: 0.69,
        trailEffect: true,
        randomizeSpeed: true,
        opacity: 0.8,
        blur: 0.25,
        rainShadow: 2,
        glitchIntensity: 0.1,
        fontFamily: "Fira Code, monospace"
    };


    const skillsData = { // Skill data remains unchanged
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

    async function activateTerminalGlitchAndQuote() {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput || !context.mainContentContainer) return;
        context.appendToTerminal("Initiating system override...", "output-error");
        await new Promise(resolve => setTimeout(resolve, 300));

        const overlay = document.createElement('div');
        overlay.className = 'terminal-glitch-overlay';
        const originalPosition = context.mainContentContainer.style.position;
        context.mainContentContainer.style.position = 'relative'; 
        context.mainContentContainer.appendChild(overlay);

        const computedStyle = getComputedStyle(terminalOutput);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
        const fontSize = parseFloat(computedStyle.fontSize) || 11; 
        const charWidth = (fontSize * 0.6); 
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
            context.appendToTerminal(context.fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome');
            const quotes = [ 
                 "Wake up, you…", "The Matrix has you.", "Follow the white rabbit.",
                 "Choice is an illusion created between those with power and those without.",
                 "The body cannot live without the mind.", `Statistics ≠ destiny, ${userDetails.userName}.`,
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

    const terminalCommands = {
        'about': () => {
            appendToTerminal(context.fullBioText.replace(/\n/g, '<br/>'));
        },
        'clear': () => {
            const terminalOutput = document.getElementById('terminal-output');
            if (!terminalOutput) return;
            terminalOutput.innerHTML = '';
            appendToTerminal(context.fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome');
        },
        'contact': () => {
            let contactDetails = `Email: <a href="mailto:${context.userDetails.emailAddress}">${context.userDetails.emailAddress}</a>\nLinkedIn: <a href="https://www.linkedin.com/in/${context.userDetails.linkedinUser}" target="_blank" rel="noopener noreferrer">${context.userDetails.linkedinUser}</a>\nGitHub: <a href="https://github.com/${context.userDetails.githubUser}" target="_blank" rel="noopener noreferrer">${context.userDetails.githubUser}</a>`;
            if (context.userDetails.mediumUser) {
                contactDetails += `\nMedium: <a href="https://medium.com/@${context.userDetails.mediumUser}" target="_blank" rel="noopener noreferrer">@${context.userDetails.mediumUser}</a>`;
            }
            appendToTerminal(contactDetails.replace(/\n/g, '<br/>'));
        },
        'date': () => {
            appendToTerminal(new Date().toLocaleString());
        },
        'download': (args) => {
            if (args[0] && args[0].toLowerCase() === 'cv') {
                if (!context.userDetails.cvLink || context.userDetails.cvLink === "path/to/your/resume.pdf") {
                    appendToTerminal("CV link not configured or is a placeholder.", 'output-error'); return;
                }
                appendToTerminal(`Attempting to prepare CV for viewing/download...`);

                let finalCvLink = context.userDetails.cvLink;
                const gDriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//;
                const match = context.userDetails.cvLink.match(gDriveRegex);

                if (match && match[1]) {
                    const fileId = match[1];
                    finalCvLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    appendToTerminal(`Using Google Drive direct download link format.`);
                } else {
                    appendToTerminal(`Using provided link directly. Behavior depends on link type.`);
                }

                const linkEl = document.createElement('a');
                linkEl.href = finalCvLink;
                linkEl.download = `${context.userDetails.userName.replace(/\s+/g, "_")}_CV.pdf`;
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
            let commandList = [
                { cmd: "about", display: "about", desc: "Display information about me." },
                { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
                { cmd: "contact", display: "contact", desc: "Show contact information." },
                { cmd: "date", display: "date", desc: "Display current date and time." },
                { cmd: "download cv", display: "download cv", desc: "Download my CV." },
                { cmd: "easter.egg", display: "easter.egg", desc: "???" },
                { cmd: "projects", display: "projects", desc: "Show my featured projects." },
                { cmd: "rainconfig [param] [val]", display: "rainconfig [param] [val]", desc: "Configure Matrix rain. Params: fontSize, speed, density, trailEffect, randomizeSpeed, opacity, blur, rainShadow, glitchIntensity, fontFamily. No args for current. `reset` for defaults." }, // rainDirection removed from help
                { cmd: "rainpreset <name>", display: "rainpreset <name>", desc: "Apply rain preset (calm, standard, storm, glitched)." },
                { cmd: "resize term <W> <H>|reset", display: "resize term <W> <H>|reset", desc: "Resize terminal or reset. E.g. `resize term 600px 70vh` or `resize term reset`" },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., skilltree se" },
                { cmd: "theme [name|mode]", display: "theme [name|mode]", desc: "Themes: amber, cyan, green, purple, twilight, crimson, forest, light, dark." },
                { cmd: "whoami", display: "whoami", desc: "Display current user." },
                { cmd: "sudo", display: "sudo", desc: "Attempt superuser command (humorous)." },
            ];
            const basePad = "  "; 
            const descSeparator = " - "; 
            let maxDisplayLength = 0;
            commandList.forEach(item => {
                if (item.display.length > maxDisplayLength) {
                    maxDisplayLength = item.display.length;
                }
            });

            let helpOutput = "Available commands:\n";
            commandList.forEach(item => {
                const displayPart = item.display.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");
                const paddingLength = maxDisplayLength - item.display.length; 
                const padding = "&nbsp;".repeat(paddingLength); 
                const descPart = item.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                helpOutput += `${basePad}${displayPart}${padding}${descSeparator.replace(/ /g, "&nbsp;")}${descPart}\n`;
            });
            appendToTerminal(helpOutput.trim().replace(/\n/g, '<br/>'));
        },
        'projects': () => {
            appendToTerminal("Project showcase under development. Check GitHub for now!");
            appendToTerminal(`Visit: <a href="https://github.com/${context.userDetails.githubUser}" target="_blank" rel="noopener noreferrer">github.com/${context.userDetails.githubUser}</a>`);
        },
        'rainconfig': (args) => {
            if (!getRainConfig || !updateRainConfig || !resetRainConfig || !restartMatrixRain) {
                appendToTerminal("Rain configuration module not available.", "output-error");
                return;
            }
            const currentFullConfig = getRainConfig(); 

            if (args.length === 0) { 
                let output = "Current Matrix Rain Configuration:\n";
                const order = ['fontSize', 'speed', 'density', 'trailEffect', 'randomizeSpeed', 'opacity', 'blur', 'rainShadow', 'glitchIntensity', 'fontFamily']; // rainDirection removed
                order.forEach(key => {
                    if (currentFullConfig.hasOwnProperty(key) && key !== 'availableFonts') { 
                         output += `  ${key}: ${JSON.stringify(currentFullConfig[key])}\n`;
                    }
                });
                for (const key in currentFullConfig) {
                    if (!order.includes(key) && currentFullConfig.hasOwnProperty(key) && key !== 'availableFonts') {
                         output += `  ${key}: ${JSON.stringify(currentFullConfig[key])}\n`;
                    }
                }
                output += "\nAvailable Fonts for 'fontFamily' (ensure they are loaded in your browser/CSS):\n";
                currentFullConfig.availableFonts.forEach(font => {
                    output += `  - "${font}"\n`;
                });
                // Rain direction options removed from output

                appendToTerminal(output.replace(/\n/g, "<br/>"));
                return;
            }

            if (args[0].toLowerCase() === 'reset') {
                resetRainConfig();
                restartMatrixRain();
                appendToTerminal("Matrix rain configuration reset to defaults.", "output-success");
                return;
            }

            if (args.length >= 2) {
                const param = args[0];
                let value = args.slice(1).join(" "); 
                
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                
                // rainDirection specific logic removed here, updateRainConfig will handle unknown params if any slip through

                if (updateRainConfig(param, value)) {
                    restartMatrixRain(); 
                    appendToTerminal(`${param.replace(/</g, "&lt;").replace(/>/g, "&gt;")} set to ${String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;")}. Matrix rain updated.`, "output-success");
                } 
            } else {
                appendToTerminal("Usage: rainconfig [parameter value] OR rainconfig reset OR rainconfig", "output-error");
                appendToTerminal("Example: rainconfig opacity 0.5 OR rainconfig fontFamily \"Courier New, monospace\"");
            }
        },
        'rainpreset': (args) => {
            if (!args || args.length === 0) {
                appendToTerminal("Usage: rainpreset <preset_name>", "output-error");
                appendToTerminal("Available presets: calm, standard, storm, glitched", "output-text");
                return;
            }
            const presetName = args[0].toLowerCase();
            let presetConfig = null;
        
            const baseSpeed = newDefaultConfig.speed; 
        
            switch (presetName) {
                case 'calm':
                    presetConfig = {
                        speed: Math.min(500, Math.max(20, Math.round(baseSpeed / 0.4))), 
                        density: 0.3, opacity: 0.5, blur: 1, glitchIntensity: 0,
                        rainShadow: 3, randomizeSpeed: false, trailEffect: true,
                        // fontSize and fontFamily will use current global defaults unless specified here
                    };
                    break;
                case 'standard': // Adjusted to match classic Matrix rain look
                    presetConfig = {
                        speed: 90, // Slightly faster than default
                        density: 0.75, // Denser
                        opacity: 0.85, // Slightly more opaque
                        blur: 0.1, // Very slight blur for softness, but still sharp
                        glitchIntensity: 0.08, // Very subtle glitches
                        rainShadow: 3, // A bit more glow
                        randomizeSpeed: true, 
                        trailEffect: true,
                        fontFamily: "Fira Code, monospace", // Explicitly classic font
                        fontSize: 15, // Explicitly standard size
                    };
                    break;
                case 'storm':
                    presetConfig = {
                        speed: Math.min(500, Math.max(20, Math.round(baseSpeed / 1.8))), 
                        density: 0.85, opacity: 0.9, blur: 0.15, glitchIntensity: 0.35, 
                        rainShadow: 8, randomizeSpeed: true, trailEffect: true,
                    };
                    break;
                case 'glitched':
                    presetConfig = {
                        speed: Math.floor(Math.random() * (baseSpeed / 0.6 - baseSpeed / 1.8 + 1) + baseSpeed / 1.8),
                        density: 0.65, opacity: 0.85, blur: 1.0, glitchIntensity: 0.7, 
                        rainShadow: Math.floor(Math.random() * (8 - 4 + 1) + 4), 
                        randomizeSpeed: true, trailEffect: true,
                    };
                    break;
                default:
                    appendToTerminal(`Unknown preset: ${presetName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`, "output-error");
                    appendToTerminal("Available presets: calm, standard, storm, glitched", "output-text");
                    return;
            }
        
            if (presetConfig) {
                let successCount = 0;
                let appliedSettings = "Applying preset '" + presetName + "':\n";
                // Apply all settings from the preset, overriding current ones
                for (const param in presetConfig) {
                    if (updateRainConfig(param, presetConfig[param])) {
                        appliedSettings += `  ${param}: ${presetConfig[param]}\n`;
                        successCount++;
                    } else {
                        appliedSettings += `  ${param}: [Failed to apply]\n`;
                    }
                }
                // For params not in preset, they retain their current values (or could be reset to default if desired)
                // For now, only preset values are changed.

                if (successCount > 0) {
                    restartMatrixRain(); 
                    appendToTerminal(appliedSettings.replace(/\n/g, "<br/>"), "output-text");
                    appendToTerminal(`Rain preset '${presetName}' applied.`, "output-success");
                } else {
                    appendToTerminal(`No settings were applied for preset '${presetName}'.`, "output-error");
                }
            }
        },        
        'resize': (args) => {
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
        'skills': () => {
            appendToTerminal(`Key Areas: Software Engineering (Languages, Frameworks, Frontend, Backend, DevOps), AI/ML (Regression, Classification, GenAI, XAI, NLP/DL Basics), Data Science & Analysis (Stats, Viz, OR), Platforms & Tools (Palantir Foundry, REST APIs, Git).\nType 'skilltree' for a detailed breakdown or 'skilltree [path]' to explore specific areas (e.g., 'skilltree ai').`.replace(/\n/g, '<br/>'));
        },
        'skilltree': (args) => {
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
        'sudo': (args) => {
            appendToTerminal(`Access Denied. User '${context.userDetails.userName}' is not authorized to use 'sudo'. This incident will be logged (not really).`, 'output-error');
        },
        'theme': (args) => {
            const themeNameInput = args[0] ? args[0].toLowerCase() : null;
            const darkThemes = ['amber', 'cyan', 'green', 'purple', 'twilight', 'crimson', 'forest'];
            const validSpecificThemes = [...darkThemes]; 
            const allValidOptions = [...validSpecificThemes, 'light', 'dark']; 

            const currentThemeClass = Array.from(document.body.classList).find(cls => cls.startsWith('theme-'));
            const currentFontClass = Array.from(document.body.classList).find(cls => cls.startsWith('font-')); 

            const showThemeUsage = () => {
                appendToTerminal(`Usage: theme &lt;name|mode&gt;`, 'output-text');
                appendToTerminal(`Available themes: ${validSpecificThemes.sort().join(', ')}`);
                appendToTerminal(`Available modes: light, dark (dark mode defaults to 'green' theme).`);
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
                if (themeNameInput === 'light' && document.body.classList.contains('crt-mode')) {
                    document.body.classList.remove('crt-mode'); 
                    appendToTerminal('CRT mode disabled for light theme compatibility.', 'output-text');
                }


                if (themeNameInput === 'light') {
                    document.body.classList.add('theme-light');
                    appendToTerminal('Theme set to light mode.', 'output-success');
                } else if (themeNameInput === 'dark') { 
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
        'whoami': () => {
            appendToTerminal(context.userDetails.userName);
        }
    };

    return terminalCommands;
}
