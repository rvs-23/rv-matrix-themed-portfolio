# Matrix Terminal Portfolio

## 1. Project Overview

Welcome to my personal portfolio, reimagined as a Matrix-themed interactive terminal. This project serves as a showcase of my skills, and professional background, presented through a retro-futuristic interface. It departs from traditional portfolio layouts to offer a memorable user experience. This was purely built out of personal interest & an ever-_green_ love for The Matrix.

**Key Features:**

- **Interactive Terminal Interface:** Navigate through portfolio sections (WhoAmI, Skills, Contact, etc.) using familiar command-line inputs.
- **Dynamic Matrix Rain Animation:** Features the iconic falling character animation as a persistent background, built with HTML5 Canvas and customizable through presets.
- **Customizable Theming:** Alter the visual aesthetics of the terminal and effects using various color themes (`theme` command) and opacity controls (`termopacity` command).
- **Skill Tree Explorer:** Interactively explore a detailed hierarchy of technical skills using the `skilltree` command.
- **Responsive Design:** Adapts to various screen sizes for usability on desktop, tablet, and mobile devices.
- **Immersive Loading Sequence:** A themed loading animation enhances initial user engagement.
- **Keyboard Shortcuts:** Includes `Ctrl + \` to toggle terminal visibility and a Konami code easter egg for a CRT visual effect.
- **Comprehensive Command Set:** Offers a range of commands for navigation, customization, and information retrieval, complete with a `man` (manual) system.

## 2. Technical Documentation

### 2.1. Project Structure & Key Components

This portfolio is a client-side single-page application built with vanilla HTML5, CSS3, and JavaScript (ES6+ modules). The architecture emphasizes modularity and configurability, achieved through significant refactoring.

- **`index.html`**: The main HTML file. Structures the page, loads stylesheets, JavaScript modules, and defines the core layout for the terminal, canvas, and navigation elements.
- **`css/`**:
  - **`style.css`**: Contains global CSS custom variables (defaulting to the "green" theme), `@font-face` declarations, general styles for layout, components (terminal, navigation, loading screen), animations (keyframes for fades, glitches), and responsive media queries.
  - **`themes.css`**: Dedicated file for all theme-specific CSS rules (e.g., `body.theme-cyan { ... }`), allowing themes to override default styles.
- **`js/`**:
  - **`main.js`**: The primary entry point of the application.
    - Handles the `DOMContentLoaded` event.
    - Orchestrates loading of all data (configurations and assets) via `dataLoader.js`.
    - Initializes all core modules: loader screen, rain configuration, terminal controller, shortcuts, and the rain engine.
    - Assembles and provides the `commandContext` object to the command system.
    - Sets up global event listeners (e.g., window resize for rain canvas).
  - **`controller/`**: Modules responsible for managing specific aspects of the UI and application state.
    - **`dataLoader.js`**: Asynchronously fetches all necessary JSON files (configurations and assets like skills, hobbies, man pages) using the `fetch` API, with error handling and fallbacks.
    - **`loaderScreen.js`**: Manages the initial loading screen animation and its lifecycle.
    - **`terminalController.js`**: Handles all DOM interactions for the terminal (input, output, history), manages terminal state (visibility, opacity, font size, themes), processes commands, and displays the welcome message.
    - **`shortcuts.js`**: Manages global keyboard shortcuts like the Konami code (for CRT mode) and `Ctrl + \` (to toggle terminal visibility).
    - **`userConfig.json`**: Configuration for user-specific details (name, bio, links). (Data file)
    - **`terminalConfig.json`**: Configuration for terminal behavior (default size, opacity, global charsets, loading messages). (Data file)
  - **`rain/`**: Modules dedicated to the Matrix rain animation.
    - **`config.js`**: Manages the active configuration for the rain effect, loaded from `rainConfig.json`. Provides functions to get/update rain parameters.
    - **`engine.js`**: Contains the core logic for rendering and animating the Matrix rain on the HTML5 canvas, including the `Stream` class and animation loop.
    - **`rainConfig.json`**: Configuration for rain animation defaults, glyphs, and presets for the `rainpreset` command. (Data file)
  - **`commands/`**: Modules for individual terminal commands.
    - **`0_index.js`**: Central registry for all terminal commands. Imports individual command modules and exports `getAllCommands()`. Includes shared utilities like `renderTree`.
    - **`*.js` (e.g., `help.js`, `theme.js`, `skills.js`)**: Each file defines a specific terminal command, exporting a function that takes arguments and the `commandContext`.
- **`assets/`**: Static assets.
  - **`*.json` (e.g., `skills.json`, `hobbies.json`, `manPages.json`)**: Data files used by various commands.
  - **`*.ttf`, `favicon.png`**: Font files and site icon.
  - **`refactor.md`**: Document detailing an earlier codebase refactoring from a Monolith (meta-document).
- **`README.md`**: This file.
- **`package.json`**: Project metadata, scripts (lint, format), and development dependencies. Core functionality does not rely on Node.js runtime dependencies.

### 2.2. Tech Stack

- **Languages:** HTML5, CSS3, JavaScript (ES6+ modules)
- **Styling:**
  - Vanilla CSS with extensive use of CSS Custom Properties for dynamic theming.
  - Font Awesome (via CDN for icons).
  - (Tailwind CSS utility classes are minimally used in `index.html` for some structural layout, but components are primarily styled with custom CSS).
- **Graphics & Animation:**
  - HTML5 Canvas 2D API (for the Matrix digital rain effect).
  - CSS Animations and Transitions.
- **Development Tools (Dev Dependencies):**
  - ESLint (for JavaScript linting).
  - Prettier (for code formatting).

### 2.3. Dependencies

- **Runtime:** The project's core functionality relies on vanilla JavaScript and is self-contained. External runtime dependencies are limited to:
  - Font Awesome (CDN) for icons.
  - Google Fonts (CDN) for "Fira Code" and "Inter".

### 2.4. Environment Variables

No environment variables (e.g., API keys) are required as all functionality is client-side.

## 3. Installation & Setup

This is a static website and does not require a complex build or server-side setup.

### 3.1. Prerequisites

- A modern web browser (e.g., latest versions of Chrome, Firefox, Safari, Edge).
- A text editor (e.g., VS Code, Sublime Text) if you wish to view or modify the code.
- (Optional, for local development) A simple HTTP server.

### 3.2. Local Development

1.  **Obtain the Files:**
    - Clone the repository (if using Git): `git clone <repository-url>` and navigate into the folder: `cd <repository-folder>`.
    - Alternatively, download and extract the project files to a local directory.
2.  **Open in Browser:**
    - **Directly:** You can often open the `index.html` file directly in your web browser.
    - **Using a Local Server (Recommended):** To avoid potential issues with `file:///` paths and ensure proper behavior for all features:
      - If you have Python 3.x installed:
        ```bash
        # Navigate to the project's root directory in your terminal
        python -m http.server
        # Or specify a port: python -m http.server 8000
        ```
        Then open `http://localhost:8000` (or your chosen port) in your browser.
      - Using VS Code with the "Live Server" extension: Right-click `index.html` and select "Open with Live Server".

### 3.3. Production Deployment

Deploying this portfolio involves hosting static files (`.html`, `.css`, `.js`, assets).

1.  Ensure all file paths within `index.html` (for CSS, JS, and assets) are relative and correct.
2.  Upload the entire project folder to a static web hosting provider (e.g., GitHub Pages, Vercel, Netlify, AWS S3).

## 4. Contribution Guide

While this is a personal portfolio, maintaining good coding practices is beneficial (note to self).

### 4.1. Code Style Conventions

- **JavaScript:**
  - Follows standard ESLint rules and Prettier for formatting.
  - JSDoc comments are used for documenting functions.
  - `const` and `let` are preferred over `var`.
  - Clear, descriptive names for variables and functions.
- **CSS:**
  - Organized logically (globals, layout, components, themes).
  - Extensive use of CSS Custom Properties.
- **HTML:**
  - Semantic and accessible HTML.

### 4.2. Branching Strategy (Git Workflow Example)

- **`main`:** Latest stable, deployed version.
- **Feature Branches (`feature/<feature-name>`):** Branched from `develop` for new features.
- **Pull Requests (PRs):** From feature branches into `develop`, ideally reviewed.

### 4.3. Testing Protocols

- **Manual Testing:** Thoroughly test all commands, theme changes, opacity adjustments, rain presets, animations, and responsiveness across different browsers and devices.
- Use browser developer tools for debugging and performance checks.

## 5. User Guide

### 5.1. Terminal Command Cheatsheet

The following commands are available in the terminal. Type a command and press Enter. For detailed info, use `man <command_name>`.

| Command                        | Description                                                                                                                                                    |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whoami`                       | Display operator identification and detailed profile.                                                                                                          |
| `clear`                        | Clear terminal output (retains welcome message).                                                                                                               |
| `contact`                      | Show contact information (Email, LinkedIn, GitHub, Medium).                                                                                                    |
| `date [timezone_alias]`        | Display date/time. Optional: `utc`, `est`, `ist`, etc.                                                                                                         |
| `download cv`                  | Initiate download of my CV.                                                                                                                                    |
| `easter.egg`                   | ??? (Triggers a hidden terminal glitch animation and a Matrix-related quote).                                                                                  |
| `help`                         | Display this list of available commands.                                                                                                                       |
| `hobbies`                      | List my hobbies and interests.                                                                                                                                 |
| `man <command>`                | Show detailed manual for a command.                                                                                                                            |
| `rainpreset <name>`            | Apply rain preset. Available: `default`, `comet`, `storm`, `whisper`, `pulse`, `ancient`.                                                                      |
| `resize term <W> <H> \| reset` | Resize terminal. E.g., `resize term 60vw 70vh` or `reset`.                                                                                                     |
| `skills`                       | List my key skills (summary).                                                                                                                                  |
| `skilltree [path]`             | Explore skills. E.g., `skilltree se` or `skilltree ai > genai`.                                                                                                |
| `sudo <command>`               | Attempt superuser command (humorous denial).                                                                                                                   |
| `termopacity <value> \| reset` | Set terminal background opacity (0-100 or 0.0-1.0).                                                                                                            |
| `termtext <size>`              | Set terminal font size. E.g., `13px`, `small`, `default`, `large`.                                                                                             |
| `theme <name>`                 | Themes: `amber`, `crimson`, `cyan`, `forest`, `goldenglitch`, `green` (default), `purple`, `reloaded`, `retroarcade`, `synthwavegrid`, `twilight`, `voidblue`. |
| `toggleterm`                   | Hide or show the terminal window (Shortcut: `Ctrl + \`).                                                                                                       |

_Note: For `skilltree` paths containing spaces, enclose the path in double quotes if the alias is not used._

### 5.2. Customization Options

- **Themes:** Use `theme <name>` (see list above).
- **Terminal Opacity:** Use `termopacity <value>` (e.g., `termopacity 80` or `termopacity 0.8`). `termopacity reset` restores default.
- **Terminal Font Size:** Use `termtext <size>` (e.g., `termtext large`, `termtext 12px`).
- **Terminal Visibility:** Use `toggleterm` or `Ctrl + \`.
- **Rain Animation Presets:** Use `rainpreset <name>` to change the style of the background Matrix rain.
- **CRT Effect (Easter Egg):** Trigger the Konami code (`ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, B, A`) for a CRT monitor visual effect. Toggle on/off.

### 5.3. Accessibility Notes

- **Keyboard Navigation:**
  - Terminal input is focusable; command history via Up/Down arrows.
  - Links are standard `<a>` tags, accessible via Tab/Enter.
- **Visuals & Contrast:**
  - Matrix rain is decorative. Multiple theme options offer different contrast levels.
- **Animation Control:**
  - Terminal visibility can be toggled (`toggleterm`, `Ctrl + \`). A global "disable all animations" is not currently implemented.

## 6. License & Credits

This project is licensed under the **MIT License**.

**AI Assistance Disclaimer:**

A significant portion of the code in this project (JavaScript, CSS, HTML structure) was developed with the assistance of AI models like Google's Gemini and OpenAI's o-series. Human guidance by myself (rvs-23) was provided for the overall design, feature requests, integration, iterative refinement, and the extensive refactoring effort documented in `refactor.md`.

**Code & Implementation Inspiration Credits:**

- Initial inspiration and structural ideas from [Rezmason's Matrix Portfolio](https://github.com/Rezmason/matrix/tree/master).
- Matrix Rain Analysis: [Carl Newton's Digital Rain Analysis](https://carlnewton.github.io/digital-rain-analysis/).

---
