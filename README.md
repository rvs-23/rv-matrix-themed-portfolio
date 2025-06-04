# Matrix Terminal Portfolio

## 1. Project Overview

Welcome to my personal portfolio, reimagined as a Matrix-themed interactive terminal. This project serves as a unique showcase of my skills, projects, and professional background, presented through an retro-futuristic interface. It departs from traditional portfolio layouts to offer a memorable user experience.

**Key Features:**

- **Interactive Terminal Interface:** Navigate through portfolio sections (About, Skills, Contact, etc.) using familiar command-line inputs.
- **Dynamic Matrix Rain Animation:** Features the iconic falling green character animation as a persistent background, built with HTML5 Canvas.
- **Customizable Theming:** Alter the visual aesthetics of the terminal and effects using various color themes and opacity controls.
- **Skill Tree Explorer:** Interactively explore a detailed hierarchy of technical skills using the `skilltree` command.
- **Responsive Design:** Adapts to various screen sizes for usability on desktop, tablet, and mobile devices.
- **Immersive Loading Sequence:** A themed loading animation enhances the initial user engagement.
- **Accessibility Considerations:** Includes features like keyboard navigation and theme options to improve user experience for a wider audience.

## 2. Technical Documentation

### 2.1. Project Structure & Key Components

This portfolio is a client-side single-page application built with vanilla HTML5, CSS3, and JavaScript (ES6+).

- **`index.html`**: The main HTML file that structures the page, loads stylesheets, scripts, and defines the core layout for the terminal and canvas elements.
- **`css/style.css`**: Contains all custom styling for the application, including layout, terminal appearance, animations, responsive design, and theme definitions (primarily using CSS custom properties).
- **`js/matrix-rain.js`**: Manages the core client-side logic. This includes:
  - **DOM Initialization:** Setting up references to key HTML elements.
  - **Loading Screen Management:** Controlling the initial "decryption" animation and transition.
  - **Matrix Rain Animation:** Driving the HTML5 Canvas-based digital rain effect, including character generation, rendering, and behavior.
  - **Terminal I/O & State:** Handling command input, processing, history, and managing terminal visibility state.
  - **Global Event Listeners:** Managing window resize events, keyboard shortcuts (e.g., for terminal toggle, Konami code).
  - **Core Initialization (`initializeTerminalAndGraphics`):** Orchestrating the setup of all visual and interactive components.
- **`js/commands.js`**: Defines the logic and output for all available terminal commands (e.g., `about`, `skills`, `theme`, `termopacity`).
  - **Command Definitions:** Each command is a function that typically interacts with the `appendToTerminal` function (passed via context from `matrix-rain.js`) to display its output.
  - **Skills Data Management:** Includes the `skillsData` object defining the skill tree structure and the `renderSkillTree` helper function for its display.
  - **Easter Egg Logic:** Contains functionality for specific interactive surprises.

### 2.2. Tech Stack

- **Languages:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:**
  - Vanilla CSS with extensive use of CSS Custom Properties for dynamic theming.
  - Tailwind CSS (v3.x via CDN, primarily for utility classes in `index.html`).
  - Font Awesome (via CDN for icons).
- **Graphics & Animation:**
  - HTML5 Canvas 2D API (for the Matrix digital rain effect).
  - CSS Animations and Transitions.
- **Development Environment:**
  - Standard web browser with developer tools.
  - Local HTTP server for development (e.g., Live Server extension in VS Code, Python's `http.server`).

### 2.3. Dependencies

This project is self-contained regarding its core functionality, relying on vanilla JavaScript. External dependencies are limited to:

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
2.  Upload the entire project folder to a static web hosting provider. Common choices include:

    - GitHub Pages
    - Vercel
    - AWS S3 (with static website hosting enabled)
    - Firebase Hosting
    - etc.

    Most of these platforms offer straightforward deployment via Git integration or drag-and-drop.

### 3.4. Troubleshooting Common Setup Errors

- **Canvas Rendering Issues (No Animations):**
  - Open the browser's developer console (usually F12) and check for JavaScript errors. Errors in `matrix-rain.js` can prevent canvas initialization.
  - Ensure your browser has JavaScript enabled and supports HTML5 Canvas.
- **Styling Issues (Page Looks Unstyled):**
  - Confirm the link to `css/style.css` is correct in `index.html`.
  - Check the developer console for errors related to loading the CSS file or CDN links (Tailwind, Font Awesome).
  - Clear your browser cache thoroughly (hard refresh: Ctrl+Shift+R or Cmd+Shift+R) to ensure you're not viewing an outdated version.
- **Terminal Commands Not Working:**
  - Check the developer console for JavaScript errors, particularly in `js/commands.js` (command definitions) or `js/matrix-rain.js` (command input handling).

## 4. Contribution Guide (If Applicable)

While this is a personal portfolio, maintaining good coding practices is beneficial. If contributions were to be considered:

### 4.1. Code Style Conventions

- **JavaScript:**
  - Adhere to a consistent style (e.g., ESLint with a common configuration like Airbnb or StandardJS, Prettier for formatting).
  - Utilize JSDoc for documenting functions, especially complex logic or public APIs.
  - Prefer `const` and `let` over `var`.
  - Employ clear, descriptive names for variables and functions.
- **CSS:**
  - Organize CSS logically (e.g., global styles, layout, components, themes).
  - Leverage CSS Custom Properties for theming and maintainability.
  - Comment complex selectors or non-obvious styling choices.
- **HTML:**
  - Write semantic and accessible HTML.
  - Ensure proper indentation and readability.

### 4.2. Branching Strategy (Git Workflow Example)

A simple Gitflow-like strategy is recommended:

- **`main`:** This branch should always reflect the latest stable, deployed version.
- **`develop`:** This branch serves as the primary integration branch for ongoing development. New features are merged here first.
- **Feature Branches (`feature/<feature-name>`):** Create new branches from `develop` for each new feature or significant change (e.g., `feature/new-command-xyz`).
- **Pull Requests (PRs):** Once a feature is complete, create a PR from the feature branch into `develop`. PRs should ideally be reviewed before merging.
- **Releases:** When `develop` is stable and ready for a new release, merge it into `main` and consider tagging the release (e.g., `v1.1.0`).

### 4.3. Testing Protocols

- **Manual Testing:** Thoroughly test all commands, theme changes, opacity adjustments, animations, and responsiveness across different browsers (Chrome, Firefox, Safari, Edge) and devices (desktop, tablet, mobile).
- **End-to-End (E2E) Tests (Future Consideration):** Tools like Cypress or Playwright could simulate user interactions for verifying complete flows, although this might be overkill for a personal portfolio unless significant new interactive features are added.

## 5. User Guide

### 5.1. Terminal Command Cheatsheet

The following commands are available in the terminal. Type a command and press Enter.

| Command                      | Description                                                                                                               |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `about`                      | Display detailed information about me.                                                                                    |
| `clear`                      | Clear the terminal output (retains the welcome message).                                                                  |
| `contact`                    | Show contact information (Email, LinkedIn, GitHub, Medium).                                                               |
| `date`                       | Display the current local date and time.                                                                                  |
| `download cv`                | Initiate download of my CV.                                                                                               |
| `easter.egg`                 | ??? (Triggers a hidden terminal glitch animation and a Matrix-related quote).                                             |
| `help`                       | Display this list of available commands.                                                                                  |
| `rainpreset <name>`          | Apply a predefined visual preset to the Matrix rain animation. Use `help` to see available preset names.                  |
| `resize term <W> <H>\|reset` | Resize terminal dimensions. E.g., `resize term 60vw 70vh` or `resize term reset`.                                         |
| `skills`                     | List a summary of my key skills.                                                                                          |
| `skilltree [path]`           | Interactively explore the detailed skill tree. E.g., `skilltree ai` or `skilltree "se > lang"`.                           |
| `sudo`                       | Attempt a superuser command (humorous denial).                                                                            |
| `termopacity <value>`        | Set terminal background opacity. `<value>` can be 0-100 (e.g., `75`) or 0.0-1.0 (e.g., `0.75`). `reset` restores default. |
| `termtext <size>`            | Set terminal font size. E.g., `termtext 13px`, `small`, `default`, `large`.                                               |
| `theme <name>`               | Change terminal theme. Use `help` to see available theme names (e.g., `amber`, `cyan`, `dark`).                           |
| `toggleterm`                 | Hide or show the terminal window. Shortcut: `Ctrl + \` (Backslash).                                                       |
| `whoami`                     | Display the current user's name.                                                                                          |

_Note: For `skilltree` paths containing spaces, enclose the path in double quotes._

### 5.2. Customization Options

- **Themes:** Use the `theme <name>` command to change the visual style. Available themes include `amber`, `cyan`, `green` (default), `purple`, `twilight`, `crimson`, `forest`, `electricecho`, `goldenglitch`. The `dark` option reverts to the default green theme.
- **Terminal Opacity:** Use `termopacity <value>` to adjust the terminal background's transparency (e.g., `termopacity 80`).
- **Terminal Font Size:** Use `termtext <size>` to change the font size of the terminal text (e.g., `termtext large`, `termtext 12px`).
- **Terminal Visibility:** Use `toggleterm` or `Ctrl + \` to show/hide the terminal window.
- **CRT Effect:** Trigger the Konami code (`Up, Up, Down, Down, Left, Right, Left, Right, B, A`) for a CRT monitor visual effect.

### 5.3. Accessibility Notes

- **Keyboard Navigation:**
  - The terminal input field is focusable and supports standard keyboard input.
  - Command history is navigable using the Up and Down arrow keys.
  - Links in terminal output and the navigation bar are standard `<a>` tags, accessible via Tab and Enter keys.
- **Screen Reader Support:**
  - Content is primarily text-based.
  - ARIA labels (`aria-label`) are used on navigation icons for better screen reader context.
  - The dynamic nature of terminal output might pose challenges; future enhancements could explore ARIA live regions for better announcements.
- **Visuals & Contrast:**
  - The Matrix rain animation is decorative; core information is text-based.
  - Multiple theme options are provided, some offering different contrast levels.
- **Animation Control:**
  - The terminal visibility can be toggled (`toggleterm` or `Ctrl + \`), effectively hiding the main content container if animations within it are distracting. A global "disable all animations" toggle is not currently implemented but could be a future enhancement.

## 6. License & Credits

## This project is licensed under the **MIT License**. See the `LICENSE` file for more details (if one is included in your project structure, otherwise, you can add a simple MIT License text).

**AI Assistance Disclaimer:**

Approximately 90% of the code in this project (JavaScript, CSS, HTML structure) was developed with the significant assistance of Google's Gemini and OpenAI's GPT o3 series. Human(Rv) guidance was provided for the overall design, feature requests, integration, and iterative refinement.

**Code & Inspiration Credits:**

- Initial inspiration + structural ideas from [Rezmason's Matrix Portfolio](https://github.com/Rezmason/matrix/tree/master).
- Matrix Rain Analysis: [Carl Newton's Digital Rain Analysis](https://carlnewton.github.io/digital-rain-analysis/).

---
