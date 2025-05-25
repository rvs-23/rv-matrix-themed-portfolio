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
 * @param {function} context.startAsciiNnVis - Function to start ASCII NN visualization.
 * @param {function} context.stopAsciiNnVis - Function to stop ASCII NN visualization.
 * @param {function} context.resizeTerminalElement - Function to resize the terminal.
 * @param {function} context.getRainConfig - Function to get current rain config.
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
        startAsciiNnVis,
        stopAsciiNnVis,
        resizeTerminalElement,
        getRainConfig,      // New context function
        updateRainConfig,   // New context function
        resetRainConfig,    // New context function
        restartMatrixRain   // New context function
    } = context;

    const skillsData = {
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
            context.mainContentContainer.style.position = '';
            terminalOutput.innerHTML = '';
            context.appendToTerminal(context.fullWelcomeMessageString.replace(/\n/g, '<br/>'), 'output-welcome');
            const quotes = [
                 "Wake up, you…",
                 "The Matrix has you.",
                 "Follow the white rabbit.",
                 "Choice is an illusion created between those with power and those without.",
                 "The body cannot live without the mind.",
                 `Statistics ≠ destiny, ${userDetails.userName}.`,
                 "Code is just another form of déjà-vu.",
                 "Data bends − people break.",
                 "It’s not the algorithm that scares them, it’s the accuracy.",
                 "Wake up, the bugs in your dreams are trying to unit test your sould.",
                 "Don't think you are. Know you are. That's why you version control your skincare routing.",
                 "Free your mind.",
		 "A mind that won't question is more predictable than any ML algorithm",
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
            if (typeof context.stopAsciiNnVis === 'function') context.stopAsciiNnVis();
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
                    appendToTerminal("CV link not configured.", 'output-error'); return;
                }
                appendToTerminal(`Attempting to download CV...`);
                const linkEl = document.createElement('a');
                linkEl.href = context.userDetails.cvLink;
                linkEl.download = `${context.userDetails.userName.replace(/\s+/g, "_")}_CV.pdf`;
                document.body.appendChild(linkEl);
                linkEl.click();
                document.body.removeChild(linkEl);
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
        'examples': () => {
            const exampleList = [
                { cmd: "help", desc: "Displays all available commands." },
                { cmd: "about", desc: "Shows a short bio." },
                { cmd: "skilltree se", desc: "Shows skills under Software Engineering." },
                { cmd: "theme light", desc: "Changes the terminal to light mode." },
                { cmd: "nnvis 2 4 3", desc: "Starts an ASCII neural network with layers 2, 4, 3." },
                { cmd: "resize term 60vw 55vh", desc: "Resizes terminal to 60% viewport width, 55% viewport height." },
                { cmd: "rainconfig", desc: "Shows current Matrix rain settings." },
                { cmd: "rainconfig fontSize 12", desc: "Sets rain character size to 12px." },
                { cmd: "rainconfig speed 40", desc: "Makes rain fall faster." },
                { cmd: "rainconfig trailEffect false", desc: "Turns off rain trail effect." },
                { cmd: "rainconfig reset", desc: "Resets rain settings to default." },
                { cmd: "clear", desc: "Clears the terminal screen." },
            ];
            let output = "Example Commands & Expected Outcomes:\n\n";
            const padChar = "&nbsp;";
            const maxCmdLength = Math.max(...exampleList.map(item => item.cmd.length));

            exampleList.forEach(item => {
                const fixedCmd = item.cmd.padEnd(maxCmdLength, ' ').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                output += `${padChar.repeat(2)}<span class="output-command">${fixedCmd.replace(/ /g, padChar)}</span>${padChar.repeat(3)}- ${item.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;")}\n`;
            });
            appendToTerminal(output.trim().replace(/\n/g, '<br/>'));
        },
        'help': () => {
            let commandList = [
                { cmd: "about", display: "about", desc: "Display information about me." },
                { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
                { cmd: "contact", display: "contact", desc: "Show contact information." },
                { cmd: "date", display: "date", desc: "Display current date and time." },
                { cmd: "download cv", display: "download cv", desc: "Download my CV." },
                { cmd: "easter.egg", display: "easter.egg", desc: "???" },
                { cmd: "examples", display: "examples", desc: "Show example commands." },
                { cmd: "nnvis [n1 n2...]", display: "nnvis [n1 n2...]", desc: "Visualize an ASCII neural network. E.g. `nnvis 3 5 2`" },
                { cmd: "projects", display: "projects", desc: "Show my featured projects (placeholder)." },
                { cmd: "rainconfig [param] [val]", display: "rainconfig [param] [val]", desc: "Configure Matrix rain. No args for current. `reset` for defaults." },
                { cmd: "resize term <W> <H>", display: "resize term <W> <H>", desc: "Resize terminal. W/H in px, %, vw, vh. E.g. `resize term 600px 70vh`" },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., skilltree se" },
                { cmd: "theme [name|mode]", display: "theme [name|mode]", desc: "Themes: amber, cyan, green, purple, twilight, crimson, forest, light, dark." },
                { cmd: "whoami", display: "whoami", desc: "Display current user." },
            ];
            // Dynamically calculate padding for alignment
            const basePad = "  "; // Initial indent
            const descSeparator = " - ";
            let maxDisplayLength = 0;
            commandList.forEach(item => {
                if (item.display.length > maxDisplayLength) {
                    maxDisplayLength = item.display.length;
                }
            });

            let helpOutput = "Available commands:\n";
            commandList.forEach(item => {
                const displayPart = item.display.replace(/ /g, "&nbsp;");
                const paddingLength = maxDisplayLength - item.display.length;
                const padding = "&nbsp;".repeat(paddingLength);
                helpOutput += `${basePad}${displayPart}${padding}${descSeparator.replace(/ /g, "&nbsp;")}${item.desc}\n`;
            });
            appendToTerminal(helpOutput.trim().replace(/\n/g, '<br/>'));
        },
        'nnvis': (args) => {
            let layerConfig = null;
            let potentialLayers = [];

            if (args.length > 0) {
                if (args[0].toLowerCase() === '--layers') {
                    potentialLayers = args.slice(1);
                } else {
                    potentialLayers = args;
                }
                layerConfig = potentialLayers.map(num => parseInt(num, 10)).filter(num => !isNaN(num) && num > 0 && num < 15);

                if (potentialLayers.length > 0 && layerConfig.length === 0) {
                    appendToTerminal("Invalid layer configuration. Numbers must be positive integers (1-14). Usage: nnvis [n1 n2 ...] (e.g., nnvis 3 5 2)", 'output-error');
                    return;
                } else if (layerConfig.length > 0) {
                     appendToTerminal(`Configuring network with layers: ${layerConfig.join(', ')}`, 'output-text');
                }
            }
            if (typeof context.startAsciiNnVis === 'function') {
                context.startAsciiNnVis(layerConfig);
            } else {
                appendToTerminal("ASCII Neural Network Visualization module not loaded.", 'output-error');
            }
        },
        'projects': () => {
            appendToTerminal("Project showcase under development. Check GitHub!");
            appendToTerminal(`Visit: <a href="https://github.com/${context.userDetails.githubUser}" target="_blank" rel="noopener noreferrer">github.com/${context.userDetails.githubUser}</a>`);
        },
        'rainconfig': (args) => {
            if (!getRainConfig || !updateRainConfig || !resetRainConfig || !restartMatrixRain) {
                appendToTerminal("Rain configuration module not available.", "output-error");
                return;
            }

            if (args.length === 0) {
                const currentConfig = getRainConfig();
                let output = "Current Matrix Rain Configuration:\n";
                for (const key in currentConfig) {
                    output += `  ${key}: ${JSON.stringify(currentConfig[key])}\n`;
                }
                appendToTerminal(output.replace(/\n/g, "<br/>"));
                return;
            }

            if (args[0].toLowerCase() === 'reset') {
                resetRainConfig();
                restartMatrixRain();
                appendToTerminal("Matrix rain configuration reset to defaults.", "output-success");
                return;
            }

            if (args.length === 2) {
                const param = args[0];
                let value = args[1];
                const currentConfig = getRainConfig();

                if (!currentConfig.hasOwnProperty(param)) {
                    appendToTerminal(`Invalid parameter: ${param}. Valid parameters are: ${Object.keys(currentConfig).join(', ')}`, "output-error");
                    return;
                }

                // Type conversion and validation
                if (typeof currentConfig[param] === 'number') {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                        appendToTerminal(`Invalid value for ${param}. Expected a number.`, "output-error");
                        return;
                    }
                    // Add specific range checks
                    if (param === 'fontSize' && (numValue < 8 || numValue > 40)) {
                        appendToTerminal(`fontSize must be between 8 and 40.`, "output-error"); return;
                    }
                    if (param === 'speed' && (numValue < 20 || numValue > 500)) {
                        appendToTerminal(`speed must be between 20 and 500.`, "output-error"); return;
                    }
                    if (param === 'density' && (numValue < 0.1 || numValue > 3.0)) {
                         appendToTerminal(`density must be between 0.1 and 3.0.`, "output-error"); return;
                    }
                    value = numValue;
                } else if (typeof currentConfig[param] === 'boolean') {
                    if (value.toLowerCase() === 'true') value = true;
                    else if (value.toLowerCase() === 'false') value = false;
                    else {
                        appendToTerminal(`Invalid value for ${param}. Expected true or false.`, "output-error");
                        return;
                    }
                } else if (typeof currentConfig[param] === 'string') {
                    // For fontFamily, remove quotes if user added them, but the value itself is a string
                    value = value.replace(/^["']|["']$/g, "");
                     if (param === 'fontFamily' && !/^[a-zA-Z0-9\s,-]+$/.test(value)) {
                        appendToTerminal(`Invalid characters in fontFamily.`, "output-error"); return;
                    }
                }

                if (updateRainConfig(param, value)) {
                    restartMatrixRain();
                    appendToTerminal(`${param} set to ${value}. Matrix rain updated.`, "output-success");
                } else {
                    appendToTerminal(`Failed to update ${param}.`, "output-error"); // Should not happen if validation passes
                }
            } else {
                appendToTerminal("Usage: rainconfig [parameter value] OR rainconfig reset OR rainconfig", "output-error");
                appendToTerminal("Example: rainconfig fontSize 12  OR  rainconfig trailEffect false");
            }
        },
        'resize': (args) => {
            if (args[0] && args[0].toLowerCase() === 'term' && args.length === 3) {
                const width = args[1];
                const height = args[2];
                const validUnits = /^\d+(\.\d+)?(px|%|vw|vh)$/;
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
                appendToTerminal('Usage: resize term &lt;width&gt; &lt;height&gt;', 'output-error');
                appendToTerminal('Example: resize term 700px 60vh  OR  resize term 80% 75%');
            }
        },
        'skills': () => {
            appendToTerminal(`Key Areas: Software Engineering (Languages, Frameworks, Frontend, Backend, DevOps), AI/ML (Regression, Classification, GenAI, XAI, NLP/DL Basics), Data Science & Analysis (Stats, Viz, OR), Platforms & Tools (Palantir Foundry, REST APIs, Git).\nType 'skilltree' for a detailed breakdown.`.replace(/\n/g, '<br/>'));
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
                 outputArray.push("    └── (End of this skill branch. Explore other paths!)");
            } else if (targetNode === skillsData && (!targetNode.children || targetNode.children.length === 0 )) {
                outputArray.push("  (No skill categories defined under root)");
            }

            appendToTerminal(outputArray.join('\n').replace(/\n/g, '<br/>'));
            if (!pathArg) {
                 appendToTerminal("Hint: Navigate deeper using aliases (e.g., `skilltree se`) or full paths (e.g., `skilltree \"AI & ML > GenAI\"`).", "output-text");
            }
        },
        'sudo': (args) => {
            appendToTerminal(`Access Denied. User not authorized to 'sudo'. This incident will be logged.`, 'output-error');
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
                appendToTerminal(`Available modes: light, dark`);
            };

            if (!themeNameInput) {
                showThemeUsage();
                return;
            }

            if (allValidOptions.includes(themeNameInput)) {
                document.body.className = '';

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
                } else {
                    document.body.classList.add('font-fira');
                }
            } else {
                appendToTerminal(`Error: Theme "${themeNameInput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}" not found.`, 'output-error');
                showThemeUsage();
                if (currentThemeClass) document.body.classList.add(currentThemeClass);
                else document.body.classList.add('theme-green');

                if (currentFontClass) document.body.classList.add(currentFontClass);
                else document.body.classList.add('font-fira');
            }
        },
        'whoami': () => {
            appendToTerminal(context.userDetails.userName);
        }
    };

    return terminalCommands;
}
