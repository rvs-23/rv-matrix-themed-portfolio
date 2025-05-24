
# Matrix Terminal Portfolio

## 1. Project Overview

This project is a unique, Matrix-themed personal portfolio website designed to showcase skills and projects in an interactive, terminal-based interface. It aims to provide a memorable and engaging user experience, distinct from traditional portfolio layouts.

**Key Features:**

* **Interactive Terminal:** A fully functional terminal interface where users can type commands to navigate sections (About, Skills, Projects, Contact), change themes, and discover easter eggs.
* **Matrix Rain Animation:** A dynamic, falling green character animation in the background, reminiscent of the iconic Matrix digital rain.
* **Parallax Background Effects:** Subtle parallax effects on background grid and symbol layers that respond to mouse movement, adding depth.
* **Theming:** Customizable color themes (including light/dark modes) for the terminal and overall aesthetic.
* **Skill Tree Explorer:** An interactive command (`skilltree`) to navigate a detailed hierarchy of technical skills.
* **Responsive Design:** Adapts to various screen sizes, ensuring usability on desktop and mobile devices.
* **Loading Animation:** A themed loading sequence to enhance the initial immersion.

## 2. Technical Documentation

### 2.1. Architecture

The portfolio is a client-side single-page application built with vanilla HTML, CSS, and JavaScript.

**Core Components:**

1.  **`index.html`**: The main entry point, structuring the page and linking assets.
2.  **`css/style.css`**: Handles all styling, including themes, animations, and responsive layout. It uses CSS custom properties extensively for theming.
3.  **`js/matrix.js`**:
    * **Loading Screen Module:** Manages the initial "decryption" animation and transition to the main interface.
    * **Canvas Animation Module:** Controls the Matrix rain and parallax background effects using HTML5 Canvas 2D rendering contexts. It handles character generation, movement, and responsiveness to mouse/window events.
    * **Terminal I/O Module:** Manages the command input field, processes user input, displays output in the terminal area, and handles command history (up/down arrows).
    * **Core Initialization (`initializeTerminalAndGraphics`)**: Sets up event listeners, initializes canvas states, and orchestrates the startup of different visual and interactive components.
    * **Helper Functions**: Provides utility functions for tasks like getting current theme colors and the active font family.
4.  **`js/commands.js`**:
    * **Command Definitions (`getTerminalCommands`)**: Contains the logic for all available terminal commands (e.g., `about`, `skills`, `skilltree`, `theme`, `easter.egg`). Each command is a function that typically interacts with the `appendToTerminal` function (passed via context from `matrix.js`).
    * **Skills Data (`skillsData`)**: A hierarchical JavaScript object defining the skill tree structure, including categories, sub-categories, individual skills, and aliases for navigation.
    * **`renderSkillTree` Function**: A recursive helper function to format and display the `skillsData` in an ASCII tree style.
    * **`activateTerminalGlitchAndQuote` Function**: Handles the logic for the `easter.egg` command's visual glitch and quote display.

For a more detailed breakdown of component interactions and future scalability notes, please refer to [ARCHITECTURE.md](ARCHITECTURE.md).

### 2.2. Tech Stack

* **Languages:**
    * HTML5
    * CSS3
    * JavaScript (ES6+)
* **Styling:**
    * Vanilla CSS with CSS Custom Properties for theming.
    * Tailwind CSS (v3.x via CDN for utility classes, primarily in `index.html`).
* **Graphics:**
    * HTML5 Canvas 2D API (for Matrix rain and parallax effects).
* **Fonts & Icons:**
    * Google Fonts (Fira Code, Inter) via CDN.
    * Font Awesome (v6.x via CDN for icons).
* **Development Environment:**
    * A modern web browser with developer tools.
    * A simple HTTP server for local development (e.g., Live Server extension in VS Code, Python's `http.server`).

### 2.3. Dependencies

This project primarily uses vanilla JavaScript and relies on CDN-hosted libraries for styling and icons. There are no `npm` package dependencies or a build step required for the core functionality.

* **Tailwind CSS:** `https://cdn.tailwindcss.com`
* **Font Awesome:** `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css`
* **Google Fonts:** `https://fonts.googleapis.com/...` (specific URL in `index.html`)

### 2.4. Environment Variables

No environment variables (e.g., API keys) are required for the current version of this project. All functionality is client-side.

## 3. Installation & Setup

This is a static website and does not require a complex build process.

### 3.1. Prerequisites

* A modern web browser (e.g., Chrome, Firefox, Safari, Edge - latest versions recommended).
* A text editor for viewing or modifying code (e.g., VS Code, Sublime Text).
* (Optional) A local HTTP server for development to avoid potential issues with `file:///` paths if more complex features are added later.

### 3.2. Local Development

1.  **Clone the repository (if applicable) or download the files:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```
    If you have the files directly, simply navigate to the project folder.

2.  **Open `index.html` in your browser:**
    * You can usually double-click the `index.html` file.
    * Alternatively, if you have a local server (like Python's built-in server or VS Code's Live Server extension):
        * Using Python (Python 3.x):
            ```bash
            # Navigate to the project root directory in your terminal
            python -m http.server 8000
            ```
            Then open `http://localhost:8000` in your browser.
        * Using VS Code Live Server: Right-click `index.html` and select "Open with Live Server".

### 3.3. Production Deployment

Deploying this portfolio is straightforward as it consists of static files (`.html`, `.css`, `.js`).

1.  Ensure all file paths in `index.html` (for CSS and JS) are correct relative to the root.
2.  Upload the entire project folder (containing `index.html`, `css/style.css`, `js/matrix.js`, `js/commands.js`, and any other assets) to a static web hosting provider. Examples include:
    * GitHub Pages
    * Netlify
    * Vercel
    * AWS S3 (with static website hosting enabled)
    * Firebase Hosting
    * Traditional web hosting services

    Most of these platforms offer simple drag-and-drop or Git-based deployment.

### 3.4. Troubleshooting Common Setup Errors

* **404 Errors (File Not Found):**
    * Verify that the paths to `css/style.css`, `js/matrix.js`, and `js/commands.js` in your `index.html` are correct relative to the `index.html` file's location.
    * Ensure all files have been uploaded correctly to your hosting provider if deploying.
    * Check for typos in filenames or directory names.
* **Canvas Rendering Issues (No Animations):**
    * Open your browser's developer console (usually F12) and check for JavaScript errors. Errors in `matrix.js` or `commands.js` can prevent canvas initialization or drawing.
    * Ensure your browser supports HTML5 Canvas and has JavaScript enabled.
    * Very old browsers might have limited Canvas support.
* **Styling Issues (Page Looks Unstyled):**
    * Confirm the link to `css/style.css` is correct in `index.html`.
    * Check the developer console for errors related to loading the CSS file.
    * Clear your browser cache to ensure you're not seeing an outdated version.
* **Terminal Commands Not Working:**
    * Check the developer console for JavaScript errors, particularly in `matrix.js` (command input handling) or `commands.js` (command definitions).
    * Ensure both `matrix.js` and `commands.js` are loaded correctly, with `commands.js` typically loaded after `matrix.js` or its functions made available appropriately.

## 4. Contribution Guide

While this is a personal portfolio, adopting good practices is beneficial. If contributions were to be accepted:

### 4.1. Code Style Conventions

* **JavaScript:**
    * Follow a consistent style guide (e.g., Airbnb JavaScript Style Guide, StandardJS).
    * Use a linter like ESLint and a formatter like Prettier to enforce style.
    * Use JSDoc for documenting functions and complex logic.
    * Prefer `const` and `let` over `var`.
    * Use clear, descriptive variable and function names.
* **CSS:**
    * Organize CSS logically (e.g., global styles, layout, components, themes, utilities).
    * Use CSS Custom Properties for theming and maintainability.
    * Comment complex selectors or non-obvious styles.
* **HTML:**
    * Write semantic HTML.
    * Ensure proper indentation and readability.

### 4.2. Branching Strategy (Git Workflow)

A simple Gitflow is recommended:

* **`main` (or `master`):** This branch always reflects the production-ready, deployed version.
* **`develop`:** This branch is for ongoing development. New features are merged here.
* **Feature Branches (`feature/<feature-name>`):** Create new branches off `develop` for each new feature or significant change (e.g., `feature/new-command-xyz`).
* **Pull Requests (PRs):** When a feature is complete, create a PR from the feature branch to `develop`. PRs should be reviewed before merging.
* **Releases:** When `develop` is stable and ready for a new release, merge it into `main` and tag the release.

### 4.3. Testing Protocols

* **Manual Testing:** Thoroughly test all commands, theme changes, animations, and responsiveness across different browsers (Chrome, Firefox, Safari, Edge) and devices (desktop, tablet, mobile).
* **Unit Tests (Future Consideration):**
    * Use a framework like Jest or Mocha to test individual functions, especially in `commands.js` (command logic, `skilltree` navigation) and helper functions in `matrix.js`.
    * Mock dependencies like `appendToTerminal` to verify calls and outputs.
* **End-to-End (E2E) Tests (Future Consideration):**
    * Use tools like Cypress or Playwright to simulate user interactions and verify complete flows (e.g., typing a command and checking the output, theme switching).
* **Visual Regression Testing (Advanced):** For canvas animations and complex visual effects, tools like Percy or Applitools could be considered for detecting unintended visual changes, though this is typically for larger projects.

## 5. User Guide

### 5.1. Terminal Command Cheatsheet

The following commands are available in the terminal. Type a command and press Enter.

| Command                 | Description                                                                 |
| :---------------------- | :-------------------------------------------------------------------------- |
| `about`                 | Display information about me.                                               |
| `clear`                 | Clear terminal (keeps welcome message).                                     |
| `contact`               | Show contact information (Email, LinkedIn, GitHub, Medium).                 |
| `date`                  | Display current date and time.                                              |
| `download cv`           | Download my CV.                                                             |
| `easter.egg`            | ??? (Triggers a hidden terminal glitch animation and a Matrix quote).       |
| `help`                  | Display this list of available commands.                                    |
| `projects`              | Show my featured projects (currently a placeholder).                        |
| `skills`                | List my key skills (summary).                                               |
| `skilltree [path]`      | Explore detailed skills. E.g., `skilltree ai` or `skilltree "se > frontend"` |
| `sudo`                  | Attempt superuser command (humorous denial).                                |
| `theme <name\|mode>`    | Change terminal theme. `<name>` can be `amber`, `cyan`, `green`, `purple`, `twilight`. `<mode>` can be `light` or `dark`. |
| `whoami`                | Display current user (your name).                                           |

*Note: For `skilltree`, paths with spaces should be enclosed in quotes, e.g., `skilltree "Software Engineering > Front-End"`.*

### 5.2. Customization Options

* **Themes:** Use the `theme` command to change the visual style of the terminal and background effects.
    * Available specific themes: `amber`, `cyan`, `green` (default), `purple`, `twilight`.
    * General modes: `light`, `dark` (reverts to default green).
    * Example: `theme twilight` or `theme light`.
* **Font:** The terminal uses "Fira Code" by default. Font customization via commands has been removed for a consistent classic feel.

### 5.3. Accessibility Notes

* **Keyboard Navigation:**
    * The terminal input field (`#command-input`) is focusable and supports standard keyboard input.
    * Command history can be navigated using the Up and Down arrow keys.
    * Links in the terminal output and navigation bar are standard `<a>` tags and should be keyboard accessible (Tab to focus, Enter to activate).
* **Screen Reader Support:**
    * Content is primarily text-based, which is generally screen-reader friendly.
    * ARIA labels (`aria-label`) are used on navigation icons for better context.
    * The dynamic nature of the terminal output might pose challenges. Future improvements could involve using ARIA live regions (`aria-live`) for terminal updates, though this needs careful implementation to avoid being overly verbose.
* **Visuals:**
    * The Matrix rain and parallax effects are purely decorative. The core information is accessible via the terminal text.
    * Theme options, including a `light` mode, are provided to improve contrast and readability for different user preferences.
* **WCAG 2.1 Considerations (Ongoing):**
    * **Contrast:** While dark themes are thematic, the `light` theme aims to provide better contrast. Color choices for themes should aim for WCAG AA contrast ratios for text.
    * **Focus Indicators:** Standard browser focus indicators are used. Custom focus indicators could enhance visibility if needed.
    * **Animation Control:** Currently, there's no direct toggle to disable animations. This could be a future enhancement for users sensitive to motion.

## 6. License
This project is licensed under the MIT License.

