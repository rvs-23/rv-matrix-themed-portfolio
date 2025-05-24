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
 * @returns {object} The terminalCommands object.
 */
function getTerminalCommands(context) {
    const {
        appendToTerminal,
        fullWelcomeMessageString,
        userDetails,
        fullBioText, // Now receiving this from matrix.js
        mainContentContainer,
        allMatrixChars,
    } = context;

    const skillsData = {
        name: "Core Competencies",
        aliases: ["core", "all", "root"],
        children: [
            {
                name: "Software Engineering (Full-Stack)",
                aliases: ["se", "software", "fullstack", "swe", "software-engineering"],
                children: [
                    { name: "Languages", aliases: ["langs"], children: [
                        {name: "JavaScript (ES6+)"}, {name: "Python"}, {name: "Java"}, {name: "SQL"}, {name: "HTML5"}, {name: "CSS3"}, {name: "TypeScript"}, {name: "Bash"}, {name: "C++ (Foundational)"}
                    ]},
                    { name: "Front-End", aliases: ["fe", "frontend"], children: [
                        {name: "React"}, {name: "Next.js"}, {name: "Vue.js"}, {name: "Angular (Conceptual)"}, {name: "Svelte (Conceptual)"}, {name: "Redux"}, {name: "Zustand"}, {name: "Tailwind CSS"}, {name: "Material-UI"}, {name: "Webpack"}, {name: "Vite"}, {name: "WebSockets"}, {name: "HTML Canvas"}
                    ]},
                    { name: "Back-End", aliases: ["be", "backend"], children: [
                        {name: "Node.js (Express.js, NestJS)"}, {name: "Python (Django, Flask, FastAPI)"}, {name: "Java (Spring Boot)"}, {name: "RESTful APIs"}, {name: "GraphQL"}, {name: "Microservices"}, {name: "Serverless (AWS Lambda, Google Cloud Functions)"}, {name: "Authentication (OAuth, JWT)"}
                    ]},
                    { name: "Databases", aliases: ["db"], children: [
                        {name: "PostgreSQL"}, {name: "MongoDB"}, {name: "MySQL"}, {name: "Redis"}, {name: "Elasticsearch"}, {name: "Firebase"}, {name: "DynamoDB"}, {name: "SQLAlchemy"}, {name: "Prisma ORM"}, {name: "Database Design & Normalization"}
                    ]},
                    { name: "DevOps & Cloud", aliases: ["devops", "cloud"], children: [
                        {name: "Docker"}, {name: "Kubernetes (k8s)"}, {name: "AWS (EC2, S3, RDS, Lambda, EKS, ECS, VPC, IAM, CloudFormation)"}, {name: "GCP (Compute Engine, GKE, Cloud SQL, Cloud Functions)"}, {name: "Azure (Conceptual)"}, {name: "Terraform"}, {name: "Ansible"}, {name: "CI/CD (Jenkins, GitHub Actions, GitLab CI)"}
                    ]},
                    { name: "Version Control", children: [{name: "Git"}, {name: "GitHub"}, {name: "GitLab"}, {name: "Bitbucket"}] },
                    { name: "Testing", children: [
                        {name: "Jest"}, {name: "Mocha"}, {name: "Chai"}, {name: "React Testing Library"}, {name: "Cypress"}, {name: "PyTest"}, {name: "JUnit"}, {name: "Unit, Integration, E2E Testing"}
                    ]},
                    { name: "Architecture & Design", aliases: ["arch"], children: [
                        {name: "Design Patterns (GoF)"}, {name: "SOLID Principles"}, {name: "System Design"}, {name: "Scalability & Performance"}, {name: "Security Best Practices"}, {name: "API Design & Management"}
                    ]},
                    { name: "Agile & Methodologies", children: [{name: "Scrum"}, {name: "Kanban"}, {name: "TDD"}, {name: "BDD"}, {name: "JIRA"}, {name: "Confluence"}] }
                ]
            },
            {
                name: "Artificial Intelligence",
                aliases: ["ai", "artificial-intelligence"],
                children: [
                    { name: "Machine Learning", aliases: ["ml"], children: [
                        {name: "Supervised Learning (Regression, Classification - SVM, Decision Trees, Random Forests, XGBoost, LightGBM)"},
                        {name: "Unsupervised Learning (Clustering - K-Means, DBSCAN; Dimensionality Reduction - PCA, t-SNE)"},
                        {name: "Reinforcement Learning (Q-Learning, Deep Q-Networks - Conceptual)"}
                    ]},
                    { name: "Deep Learning", aliases: ["dl", "deeplearning"], children: [
                        {name: "Neural Networks (ANN, CNN, RNN, LSTM, GRU, Transformers - BERT, GPT conceptual)"},
                        {name: "Frameworks (TensorFlow, PyTorch, Keras, Hugging Face Transformers)"},
                        {name: "Computer Vision (Image Classification, Object Detection, Segmentation using DL)"},
                        {name: "NLP with Deep Learning (Sequence-to-Sequence, Attention Mechanisms)"}
                    ]},
                    { name: "Natural Language Processing (NLP)", aliases: ["nlp"], children: [
                        {name: "Text Preprocessing"}, {name: "Feature Extraction (TF-IDF, Word Embeddings - Word2Vec, GloVe, FastText)"},
                        {name: "Sentiment Analysis"}, {name: "Topic Modeling (LDA)"}, {name: "Named Entity Recognition (NER)"},
                        {name: "Text Summarization"}, {name: "Question Answering Systems"}, {name: "Libraries (NLTK, spaCy, Gensim)"}
                    ]},
                    { name: "AI Ethics & Explainability", aliases: ["xai", "responsible-ai"], children: [
                        {name: "Bias Detection & Mitigation"}, {name: "Fairness in AI"},
                        {name: "Interpretability Methods (LIME, SHAP)"}, {name: "Privacy-Preserving ML (Federated Learning - Conceptual)"}
                    ]}
                ]
            },
            {
                name: "Data Science",
                aliases: ["ds", "datasci", "data-science"],
                children: [
                    { name: "Data Analysis & Manipulation", aliases: ["analysis"], children: [{name: "Pandas"}, {name: "NumPy"}, {name: "SciPy"}, {name: "Polars (Exploratory)"}, {name: "SQL for Data Analysis"}] },
                    { name: "Data Visualization", aliases: ["viz"], children: [
                        {name: "Matplotlib"}, {name: "Seaborn"}, {name: "Plotly"}, {name: "Bokeh"}, {name: "Dash / Streamlit (for interactive dashboards)"}, {name: "Geospatial Visualization (GeoPandas - Conceptual)"}
                    ]},
                    { name: "Statistical Modeling & Inference", aliases: ["stats"], children: [
                        {name: "Descriptive & Inferential Statistics"}, {name: "Hypothesis Testing"}, {name: "A/B Testing Design & Analysis"},
                        {name: "Regression Models (Linear, Logistic)"}, {name: "Time Series Analysis (ARIMA, Prophet)"}, {name: "Bayesian Methods (Conceptual)"}
                    ]},
                    { name: "Experimentation & Reporting", children: [{name: "Jupyter Notebooks"}, {name: "Google Colab"}, {name: "Reproducible Research"}, {name: "Communicating Insights"}, {name: "Storytelling with Data"}] }
                ]
            },
            {
                name: "Data Engineering",
                aliases: ["de", "dataeng", "data-engineering"],
                children: [
                    { name: "Data Pipelines & ETL", aliases: ["pipelines", "etl"], children: [
                        {name: "Apache Airflow"}, {name: "Luigi (Conceptual)"}, {name: "AWS Glue"}, {name: "Azure Data Factory (Conceptual)"}, {name: "Google Cloud Dataflow (Conceptual)"}, {name: "Data Warehousing (Redshift, BigQuery, Snowflake - Design & Use)"}, {name: "Data Integration"}
                    ]},
                    { name: "Big Data Processing", aliases: ["bigdata"], children: [
                        {name: "Apache Spark (Core, SQL, Streaming)"}, {name: "Apache Kafka (Data Ingestion, Streaming)"}, {name: "Apache Flink (Conceptual)"}, {name: "Hadoop Ecosystem (HDFS, MapReduce, Hive - Conceptual)"}
                    ]},
                    { name: "Data Storage & Management", aliases: ["storage"], children: [
                        {name: "Data Lakes (AWS S3, Azure Blob, GCS)"}, {name: "Delta Lake"}, {name: "Database Optimization & Performance Tuning"}, {name: "Data Governance & Quality Frameworks"}, {name: "Data Modeling (Relational, NoSQL)"}
                    ]},
                    { name: "Streaming Technologies", aliases: ["stream"], children: [{name: "Real-time Data Processing Architectures"}, {name: "Kafka Streams"}, {name: "Spark Streaming"}, {name: "Change Data Capture (CDC - Conceptual)"}] },
                    { name: "MLOps (Infrastructure Focus)", aliases: ["mlops"], children: [{name: "Model Deployment Infrastructure"}, {name: "Monitoring Pipelines"}, {name: "Scalable Serving"}, {name: "Kubeflow"}, {name: "MLflow"}, {name: "Feature Stores (Conceptual)"}] }
                ]
            },
            {
                name: "Cross-Functional Skills",
                aliases: ["softskills", "general", "core"],
                children: [
                    { name: "Problem Solving & Analytical Thinking" },
                    { name: "Algorithm Design & Data Structures" },
                    { name: "System Design & Architecture (Foundational)" },
                    { name: "Excellent Communication (Verbal & Written)" },
                    { name: "Teamwork & Collaboration in Agile Environments" },
                    { name: "Project Management Basics & SDLC" },
                    { name: "Critical Thinking & Decision Making" },
                    { name: "Adaptability & Continuous Learning Mindset" },
                    { name: "Business Acumen (Domain Understanding)"}
                ]
            }
        ]
    };

    /** Renders the skill tree, handling nodes that might be strings. */
    function renderSkillTree(node, indent = '', isLast = true, outputArray = []) {
        if (!node || typeof node.name === 'undefined') {
            // This check should ideally not be hit if skillsData is well-formed
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

    /** Activates the terminal glitch easter egg and displays a quote. */
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
        const charWidth = (fontSize * 0.6) || 7;
        const overlayHeight = overlay.clientHeight > 0 ? overlay.clientHeight : 300;
        const overlayWidth = overlay.clientWidth > 0 ? overlay.clientWidth : 500;
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
            if (document.contains(overlay)) overlay.remove();
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
        setTimeout(() => { // Fallback for safety
            if (document.contains(overlay)) {
                 clearInterval(glitchInterval);
                 finalizeEasterEgg();
            }
        }, (maxGlitchIntervals * 80) + 500);
    }

    const terminalCommands = {
        'about': () => {
            // Uses fullBioText from the context passed by matrix.js
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
                    appendToTerminal("CV link not configured.", 'output-error'); return;
                }
                appendToTerminal(`Attempting to download CV...`);
                const linkEl = document.createElement('a'); // Changed variable name from 'l'
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
            let commandList = [ // REMOVED: open command; MODIFIED: theme command description
                { cmd: "about", display: "about", desc: "Display information about me." },
                { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
                { cmd: "contact", display: "contact", desc: "Show contact information." },
                { cmd: "date", display: "date", desc: "Display current date and time." },
                { cmd: "download cv", display: "download cv", desc: "Download my CV." },
                { cmd: "easter.egg", display: "easter.egg", desc: "???" },
                { cmd: "projects", display: "projects", desc: "Show my featured projects (placeholder)." },
                { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
                { cmd: "skilltree [path]", display: "skilltree [path]", desc: "Explore skills. E.g., skilltree ai" },
                { cmd: "sudo", display: "sudo", desc: "Attempt superuser command." },
                { cmd: "whoami", display: "whoami", desc: "Display current user." },
                // Theme command will be added last after sorting
            ];
            // Sort alphabetically first
            commandList.sort((a, b) => a.display.localeCompare(b.display));

            // Define and add the theme command (to be moved to the end)
            const themeCommandHelp = { cmd: "theme <name|mode>", display: "theme <name|mode>", desc: "Themes: amber, cyan, green, purple, twilight, light, dark." };
            commandList.push(themeCommandHelp); // Add it, it will be the last due to push

            let helpOutput = "Available commands:\n";
            const padChar = "&nbsp;";
            const maxLength = Math.max(...commandList.map(item => item.display.length));
            const spacesBeforeDash = 3;
            commandList.forEach(item => {
                const fixedDisplay = item.display.padEnd(maxLength, ' ');
                helpOutput += `${padChar.repeat(2)}${fixedDisplay}${padChar.repeat(spacesBeforeDash)}-${padChar}${item.desc}\n`;
            });
            appendToTerminal(helpOutput.trim().replace(/\n/g, '<br/>'));
        },
        'projects': () => {
            appendToTerminal("Project showcase under development. Check GitHub!");
            appendToTerminal(`Visit: <a href="https://github.com/${context.userDetails.githubUser}" target="_blank" rel="noopener noreferrer">github.com/${context.userDetails.githubUser}</a>`);
        },
        'skills': () => {
            appendToTerminal(`Core Areas: Full-Stack Development, Artificial Intelligence, Data Science, Data Engineering.\nKey Technologies: JavaScript (React, Node.js), Python (TensorFlow, PyTorch, Pandas, Django/Flask), Java (Spring Boot), SQL/NoSQL, Docker, Kubernetes, AWS/GCP.\nType 'skilltree' for a detailed breakdown.`.replace(/\n/g, '<br/>'));
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
                outputArray.push("    (No further sub-categories or specific skills listed here.)");
            } else if (targetNode === skillsData && (!targetNode.children || targetNode.children.length === 0 )) {
                outputArray.push("  (No skill categories defined under root)");
            }

            appendToTerminal(outputArray.join('\n').replace(/\n/g, '<br/>'));
            if (!pathArg) {
                 appendToTerminal("Hint: Navigate deeper using aliases (e.g., `skilltree se`) or full paths (e.g., `skilltree \"Artificial Intelligence > NLP\"`).", "output-text");
            }
        },
        'sudo': () => {
            appendToTerminal(`Access Denied. User ${context.userDetails.userName} not authorized for sudo. Incident logged.`, 'output-error');
        },
        // MODIFIED: Unified theme command
        'theme': (args) => {
            const themeNameInput = args[0] ? args[0].toLowerCase() : null;
            // MODIFIED: Alphabetized darkThemes for help message consistency
            const darkThemes = ['amber', 'cyan', 'green', 'purple', 'twilight'];
            const validSpecificThemes = [...darkThemes]; // All manually set-able themes

            document.body.className = ''; // Clear all body classes

            if (themeNameInput === 'light') {
                document.body.classList.add('theme-light');
                appendToTerminal('Theme set to light mode.', 'output-success');
            } else if (themeNameInput === 'dark') {
                document.body.classList.add('theme-green'); // Default dark
                appendToTerminal('Theme set to dark mode (default: green).', 'output-success');
            } else if (validSpecificThemes.includes(themeNameInput)) {
                document.body.classList.add(`theme-${themeNameInput}`);
                appendToTerminal(`Theme set to ${themeNameInput}.`, 'output-success');
            } else {
                appendToTerminal(`Usage: theme <${darkThemes.sort().join('|')}|light|dark>`, 'output-error');
                document.body.classList.add('theme-green'); // Fallback to default
                document.body.classList.add('font-fira');
                return;
            }
            document.body.classList.add('font-fira'); // Always re-apply default font
        },
        'whoami': () => {
            appendToTerminal(context.userDetails.userName);
        }
    };

    return terminalCommands;
}
