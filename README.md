# Matrix Terminal Portfolio

## 1. Project Overview
Welcome to my personal portfolio, reimagined as a Matrix-themed interactive terminal. This project departs from traditional portfolio layouts to offer a different user experience. This was purely built out of personal interest & an ever-_green_ love for The Matrix.

**Key Features:**
- **Interactive Terminal Interface:** Navigate through portfolio sections (WhoAmI, Skills, Contact, etc.) using familiar command-line inputs.
- **Dynamic Matrix Rain Animation:** Features the iconic falling character animation as a persistent background, built with HTML5 Canvas and customizable through presets.
- **Customizable Theming:** Alter the visual aesthetics of the terminal and effects using various color themes (`theme` command) and opacity controls (`termopacity` command).
- **Skill Tree Explorer:** Interactively explore a detailed hierarchy of technical skills using the `skilltree` command.
- **Immersive Loading Sequence:** A themed loading animation enhances initial user engagement.
- **Keyboard Shortcuts:** Includes `Ctrl + \` to toggle terminal visibility and a Konami code easter egg for a CRT visual effect.
- **Comprehensive Command Set:** Offers a range of commands for navigation, customization, and information retrieval, complete with a `man` (manual) system.

---

## 2. Technical Documentation

### 2.1. Project Structure & Key Components
This portfolio is a client-side single-page application built with vanilla HTML5, CSS3, and JavaScript (ES6+ modules). The architecture emphasizes modularity and configurability.

- **`index.html`**: The main HTML file. Structures the page, loads stylesheets, JavaScript modules, and defines the core layout.
- **`public/`**: Directory for all static assets that are served directly.
  - **`config/`**: The central hub for all configuration and data.
    - **`index.js`**: The single source of truth for all application configuration (user details, terminal settings, command data, fonts).
    - **`rain.json`**: Configuration for the rain animation's defaults, glyphs, presets, and validation rules.
    - **`content/`**: Contains data files that drive specific commands (e.g., `skills.json`, `hobbies.json`, `manPages.json`).
  - **`*.ttf`, `favicon/`**: Font files and site icons.
- **`css/`**:
  - **`style.css`**: Contains global styles, `@font-face` declarations, layout, and responsive media queries.
  - **`themes.css`**: Dedicated file for all theme-specific CSS variables.
- **`js/`**:
  - **`main.js`**: The primary entry point. It loads all data, initializes all modules, assembles the `commandContext`, and sets up global event listeners.
  - **`controller/`**: Modules for managing application state and UI.
    - **`dataLoader.js`**: Imports the main JS config and asynchronously fetches all other data files from the `/public/config/` directory.
    - **`terminalController.js`**: Manages all DOM interactions and state for the terminal itself.
    - **`shortcuts.js`**: Manages global keyboard shortcuts.
    - **`loaderScreen.js`**: Manages the initial loading animation.
  - **`rain/`**:
    - **`engine.js`**: A self-contained `RainEngine` class that handles all logic, rendering, state management, and customization for the Matrix rain effect.
  - **`commands/`**:
    - **`0_index.js`**: Central registry that imports and exports all available command modules.
    - **`*.js`**: Each file is a self-contained module for a single terminal command.
- **`README.md`**: This file.
- **`package.json`**: Project metadata, scripts, and development dependencies.

### 2.2. Tech Stack
- **Languages:** HTML5, CSS3, JavaScript (ES6+ modules)
- **Styling:**
  - Vanilla CSS with extensive use of CSS Custom Properties for dynamic theming.
  - Font Awesome (via CDN for icons).
- **Graphics & Animation:**
  - HTML5 Canvas 2D API (for the Matrix digital rain effect).
  - CSS Animations and Transitions.
- **Development Tools (Dev Dependencies):**
  - Vite (for the local development server and build process).
  - ESLint (for JavaScript linting).
  - Prettier (for code formatting).

### 2.3. Dependencies
- **Runtime:** The project's core functionality is self-contained. External runtime dependencies are limited to:
  - Font Awesome (CDN) for icons.
  - Google Fonts (CDN) for "Fira Code" and "Inter".

### 2.4. Environment Variables
No environment variables are required as all functionality is client-side.

### 2.5. Matrix-rain parameters
| Name           | Type / Range                     | What it controls |
|----------------|----------------------------------|------------------|
| `speed`        | *ms per frame* (10–500)        | Lower = faster redraws. |
| `font`         | *px* (8–40)                    | Glyph size and column width. |
| `lineH`        | float (0.5–2)                  | Vertical spacing multiplier. |
| `density`      | float (0.1–2)                  | Ratio of active columns to total columns. |
| `minTrail`     | int                              | Shortest trail length for a column. |
| `maxTrail`     | int (≥ `minTrail`)               | Longest trail length. |
| `headGlowMin`  | int                              | How many leading glyphs glow at minimum. |
| `headGlowMax`  | int (≥ `headGlowMin`)            | How many leading glyphs glow at maximum. |
| `blur`         | px                               | Canvas blur applied to glowing heads. |
| `trailMutate`  | frames                           | After how many ticks the column mutates its characters. |
| `fade`         | 0–1                            | Opacity subtracted each frame; higher = faster fade. |
| `decayBase`    | 0.7–0.99                       | Per-glyph opacity multiplier along a trail; lower = quicker decay. |
| `layers`       | int (1–10)                     | Number of parallax layers. |
| `layerOp`      | float array (length =`layers`)   | Opacity multiplier per layer. |
| `delChance`    | 0–1                            | Chance a glyph is skipped entirely, producing gaps. |

---

## 3. Installation & Setup
This is a static website that uses Vite for an enhanced local development experience.
### 3.1. Prerequisites
- A modern web browser.
- Node.js and npm installed.
- A text editor (e.g., VS Code).

### 3.2. Local Development
1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start a local server (usually at `http://localhost:5173`) with hot-reloading.

### 3.3. Production Deployment
1.  Run the build command:
    ```bash
    npm run build
    ```
    This will create a `dist` folder with optimized, static files.
2.  Upload the contents of the `dist` folder to any static web hosting provider (e.g., GitHub Pages, Vercel, Netlify).

---

## 4. Contribution Guide
### 4.1. Code Style Conventions
- **JavaScript:** Follows standard ESLint rules and Prettier for formatting. JSDoc comments are used for documenting functions.
- **CSS:** Organized logically (globals, layout, components, themes). Extensive use of CSS Custom Properties.
- **HTML:** Semantic and accessible HTML.

### 4.2. Branching Strategy
- **`main`:** Latest stable, deployed version.
- **Feature Branches:** Create branches for new features or fixes and merge via Pull Requests.

### 4.3. Testing Protocols
Use this checklist to ensure the portfolio is stable, functional, and visually correct before deploying.

- [ ] **`help`**: Lists all current themes, including `ghost`, `abyss`, and `cyborg`.
- [ ] **`theme <name>`**: Both terminal and rain colors update correctly for several themes.
- [ ] **`rainpreset <name>`**: Rain style changes correctly, and the preset's description is displayed. Test with `default` and at least two others.
- [ ] **`whoami` / `contact` / `skills`**: All personal information is correct and links are clickable and valid.
- [ ] **`resize term <values>` & `reset`**: Terminal resizes correctly and resets to the configured default.
- [ ] **`download cv`**: Triggers the CV download.
- [ ] **`easter.egg`**: The glitch effect runs and displays a quote.
- [ ] **Invalid Command**: An unknown command (e.g., `reboot`) shows the "Command not found" error.
- [ ] **Command History**: Up and Down arrow keys cycle through previous commands.
- [ ] **Autocomplete**: Tab key correctly completes commands (e.g., `th` -> `theme`) and suggests arguments (e.g., `theme ` -> cycles themes).
- [ ] **Shortcuts**: `Ctrl + \` toggles the terminal visibility.
- [ ] **Konami Code**: The sequence toggles CRT mode.
- [ ] **Desktop Window Resizing**: The terminal and rain effect adapt gracefully when the browser window is manually resized.
- [ ] **Mobile Simulation (DevTools)**: The layout is clean on various device sizes (iPhone, Pixel, etc.).
- [ ] **Virtual Keyboard**: The view adjusts on mobile to keep the input visible when the keyboard is active.
- [ ] **No Console Errors**: The developer console (F12) is free of red errors on load and during use.
- [ ] **All Links Valid**: Every external link (navbar, `contact` output) has been manually clicked and verified.

---

## 5. User Guide
### 5.1. Terminal Command Cheatsheet
The following commands are available. For detailed info, use `man <command_name>`.

| Command                        | Description                                                    |
| :----------------------------- | :------------------------------------------------------------- |
| `whoami`                       | Display operator identification and detailed profile.          |
| `clear`                        | Clear terminal output.                                         |
| `contact`                      | Show contact information.                                      |
| `date [timezone]`        | Display date/time.                                             |
| `download cv`                  | Initiate download of my CV.                                    |
| `easter.egg`                   | ???                                                            |
| `help`                         | Display this list of available commands.                       |
| `hobbies`                      | List my hobbies and interests.                                 |
| `man <command>`                | Show detailed manual for a command.                            |
| `rainpreset <name>`            | Apply a new style to the background rain.                      |
| `resize term <W> <H> \| reset` | Resize terminal. E.g., `resize term 60vw 70vh`.                |
| `skills`                       | List my key skills (summary).                                  |
| `skilltree [path]`             | Explore skills. E.g., `skilltree se`.                          |
| `sudo <command>`               | Attempt superuser command (humorous).                          |
| `termopacity <val> \| reset` | Set terminal background opacity (0-100).                       |
| `termtext <size>`              | Set terminal font size. E.g., `large`, `12px`.                 |
| `theme <name>`                 | Change the color scheme.                                       |
| `toggleterm`                   | Hide or show the terminal window (`Ctrl + \`).                 |
| `screenshot`                   | Save a PNG of the rain canvas.                                 |

### 5.2. Customization Options
- **Themes:** `abyss`, `amber`, `crimson`, `cyan`, `cyborg`, `forest`, `ghost`, `goldenglitch`, `green` (default), `inferno`, `purple`, `reloaded`, `retroarcade`, `synthwavegrid`, `twilight`, `voidblue`.
- **Rain Presets:** `default`, `comet`, `storm`, `whisper`, `pulse`, `ancient`, `emberfall`.
- **CRT Effect (Easter Egg):** `ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, B, A`.

### 5.3. Accessibility Notes
- **Keyboard Navigation:** The application is fully navigable via keyboard.
- **Visuals & Contrast:** Multiple theme options offer different contrast levels.
- **Animation Control:** Terminal visibility can be toggled to hide the main interface.

---

## 6. License & Credits
This project is licensed under the **MIT License**.

**AI Assistance Disclaimer:**
A significant portion of the code in this project (JavaScript, CSS, HTML structure) was developed with the assistance of AI models. Human guidance by myself (rvs-23) was provided for the overall design, feature requests, integration, iterative refinement, and the extensive refactoring effort.