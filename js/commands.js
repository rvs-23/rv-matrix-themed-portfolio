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
        resizeTerminalElement // Added for resizing
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
                "Wake up, Neo...", "The Matrix has you.", "Follow the white rabbit.", "There is no spoon.",
                "I know kung fu.", "Choice is an illusion created between those with power and those without.",
                "The body cannot live without the mind.", "Ever have that feeling where you're not sure if you're awake or dreaming?"
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
                { cmd: "contact", desc: "Displays contact information." },
                { cmd: "skills", desc: "Lists a summary of key skills." },
                { cmd: "skilltree", desc: "Shows the top-level skill categories." },
                { cmd: "skilltree se", desc: "Shows skills under Software Engineering." },
                { cmd: "skilltree ai > nlp", desc: "Shows skills under NLP Basics." },
                { cmd: "skilltree tools", desc: "Shows skills under Platforms & Tools." },
                { cmd: "theme", desc: "Shows available themes and usage." },
                { cmd: "theme light", desc: "Changes the terminal to light mode." },
                { cmd: "theme forest", desc: "Changes the terminal to the forest theme." },
                { cmd: "date", desc: "Displays the current date and time." },
                { cmd: "download cv", desc: "Initiates download of the CV." },
                { cmd: "whoami", desc: "Displays your username." },
                { cmd: "nnvis 2 4 3", desc: "Starts an ASCII neural network with layers 2, 4, 3." },
                { cmd: "resize term 700px 60vh", desc: "Resizes terminal to 700px width and 60vh height." },
                { cmd: "resize term 90% 80%", desc: "Resizes terminal to 90% viewport width and 80% viewport height." },
                { cmd: "clear", desc: "Clears the terminal screen." },
                { cmd: "easter.egg", desc: "Triggers a hidden Matrix quote." },
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
                { cmd: "resize term <W> <H>", display: "resize term <W> <H>", desc: "Resize terminal. W/H can be px, %, vw, vh. E.g. `resize term 600px 70vh`" },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., skilltree se" },
                { cmd: "theme [name|mode]", display: "theme [name|mode]", desc: "Themes: amber, cyan, green, purple, twilight, crimson, forest, light, dark." },
                { cmd: "whoami", display: "whoami", desc: "Display current user." },
            ];
            commandList.sort((a, b) => a.display.localeCompare(b.display));

            let helpOutput = "Available commands:\n";
            const padChar = "&nbsp;";
            const maxLength = Math.max(...commandList.map(item => item.display.length));
            const spacesBeforeDash = 3;
            commandList.forEach(item => {
                const fixedDisplay = item.display.padEnd(maxLength, ' ');
                helpOutput += `${padChar.repeat(2)}${fixedDisplay.replace(/ /g, padChar)}${padChar.repeat(spacesBeforeDash)}-${padChar}${item.desc}\n`;
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
        'resize': (args) => {
            if (args[0] && args[0].toLowerCase() === 'term' && args.length === 3) {
                const width = args[1];
                const height = args[2];
                // Basic validation for common CSS units. More robust validation could be added.
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
                appendToTerminal(`Usage: theme &lt;name|mode&gt;`, 'output-text'); // Changed to output-text for less aggressive styling
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
                // Reapply current theme if an invalid one was entered
                if (currentThemeClass) document.body.classList.add(currentThemeClass);
                else document.body.classList.add('theme-green'); // Fallback if no theme was set

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
