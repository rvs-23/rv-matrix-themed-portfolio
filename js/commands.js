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
        stopAsciiNnVis
    } = context;

    const skillsData = {
        name: "Core Competencies",
        aliases: ["core", "all", "root"],
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
        'help': () => {
            let commandList = [ // Removed 'sudo' from this list
                { cmd: "about", display: "about", desc: "Display information about me." },
                { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
                { cmd: "contact", display: "contact", desc: "Show contact information." },
                { cmd: "date", display: "date", desc: "Display current date and time." },
                { cmd: "download cv", display: "download cv", desc: "Download my CV." },
                { cmd: "easter.egg", display: "easter.egg", desc: "???" },
                { cmd: "nnvis [--layers n1 n2...]", display: "nnvis [--layers n1 n2...]", desc: "Visualize an ASCII neural network." },
                { cmd: "projects", display: "projects", desc: "Show my featured projects (placeholder)." },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., skilltree ai" },
                { cmd: "theme <name|mode>", display: "theme <name|mode>", desc: "Themes: amber, cyan, green, purple, twilight, light, dark." },
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
            let layerConfig = null; // Default config will be used in matrix.js if null
            if (args.length > 0 && args[0].toLowerCase() === '--layers') {
                layerConfig = args.slice(1).map(num => parseInt(num, 10)).filter(num => !isNaN(num) && num > 0);
                if (layerConfig.length === 0) {
                    appendToTerminal("Invalid layer configuration. Usage: nnvis --layers n1 n2 ... (e.g., nnvis --layers 3 5 2)", 'output-error');
                    layerConfig = null; // Fallback to default
                } else {
                     appendToTerminal(`Configuring network with layers: ${layerConfig.join(', ')}`, 'output-text');
                }
            }

            if (typeof context.startAsciiNnVis === 'function') {
                context.startAsciiNnVis(layerConfig); // Pass the config
            } else {
                appendToTerminal("ASCII Neural Network Visualization module not loaded.", 'output-error');
            }
        },
        'projects': () => {
            appendToTerminal("Project showcase under development. Check GitHub!");
            appendToTerminal(`Visit: <a href="https://github.com/${context.userDetails.githubUser}" target="_blank" rel="noopener noreferrer">github.com/${context.userDetails.githubUser}</a>`);
        },
        'skills': () => {
            appendToTerminal(`Key Areas: Languages & Frameworks (Python, TypeScript, SQL, Spark), AI/ML (Regression, Classification, GenAI, XAI, NLP/DL Basics), Data Science & Analysis (Stats, Viz, OR), Platforms & Tools (Palantir Foundry, REST APIs, Git).\nType 'skilltree' for a detailed breakdown.`.replace(/\n/g, '<br/>'));
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
                 appendToTerminal("Hint: Navigate deeper using aliases (e.g., `skilltree lang`) or full paths (e.g., `skilltree \"AI & ML > GenAI\"`).", "output-text");
            }
        },
        'sudo': (args) => { // Simplified sudo: always deny
            const attemptedCommand = args.join(' ');
            appendToTerminal(`Access Denied. User ${context.userDetails.userName} not authorized for 'sudo${attemptedCommand ? ' ' + attemptedCommand : ''}'. This incident will be logged.`, 'output-error');
        },
        'theme': (args) => {
            const themeNameInput = args[0] ? args[0].toLowerCase() : null;
            const darkThemes = ['amber', 'cyan', 'green', 'purple', 'twilight'];
            const validSpecificThemes = [...darkThemes];

            const currentFontClass = Array.from(document.body.classList).find(cls => cls.startsWith('font-'));
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
            } else {
                appendToTerminal(`Usage: theme <${validSpecificThemes.sort().join('|')}|light|dark>`, 'output-error');
                document.body.classList.add('theme-green');
            }
            if (currentFontClass) {
                document.body.classList.add(currentFontClass);
            } else {
                document.body.classList.add('font-fira');
            }
        },
        'whoami': () => {
            appendToTerminal(context.userDetails.userName);
        }
    };

    return terminalCommands;
}
