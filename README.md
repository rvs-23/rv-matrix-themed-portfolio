# Matrix Terminal Portfolio

## 1. Project Overview

Welcome to my personal portfolio, reimagined as a Matrix-themed interactive terminal. This project departs from traditional portfolio layouts to offer a different user experience. This was purely built out of personal interest & an ever-_green_ love for The Matrix.

**Key Features:**

- **Interactive Terminal Interface:** Navigate through portfolio sections (WhoAmI, Skills, Contact, etc.) using familiar command-line inputs.
- **Dynamic Matrix Rain Animation:** Features the iconic falling character animation as a persistent background, built with HTML5 Canvas and customizable through presets.
- **Customizable Theming:** Alter the visual aesthetics of the terminal and effects using various color themes (`theme` command) and terminal appearance controls (`term` command).
- **Skill Tree Explorer:** Interactively explore a detailed hierarchy of technical skills using the `skilltree` command.
- **Immersive Loading Sequence:** A themed loading animation enhances initial user engagement.
- **Keyboard Shortcuts:** Includes `Ctrl + \` to toggle terminal visibility and a Konami code easter egg for a CRT visual effect.
- **Consolidated Command Set:** Clean command hierarchy — `rain` for all rain settings, `term` for all terminal settings. Complete with a `man` (manual) system.
- **Fuzzy "Did You Mean?" Suggestions:** Mistyped commands show the closest match using Levenshtein distance, longest common subsequence tiebreaking, and prefix matching.
- **Session Persistence:** Theme and rain preset choices persist across page reloads via localStorage.

---

## 2. Technical Documentation

### 2.1. Project Structure & Key Components

This portfolio is a client-side single-page application built with vanilla HTML5, CSS3, and JavaScript (ES6+ modules). The architecture emphasizes modularity and configurability.

- **`index.html`**: The main HTML file. Structures the page, loads stylesheets, JavaScript modules, and defines the core layout.
- **`public/`**: Directory for all static assets that are served directly.
  - **`config/`**: Data files consumed at runtime.
    - **`rain.json`**: Configuration for the rain animation's defaults, glyphs, presets, and validation rules.
    - **`content/`**: Contains data files that drive specific commands (e.g., `skills.json`, `hobbies.json`, `manPages.json`).
  - **`*.ttf`, `favicon/`**: Font files and site icons.
- **`css/`**:
  - **`style.css`**: Contains global styles, `@font-face` declarations, layout, and responsive media queries.
  - **`themes.css`**: Dedicated file for all theme-specific CSS variables.
- **`js/`**:
  - **`main.js`**: The primary entry point. Loads data, initializes modules, assembles the `commandContext`, hydrates nav links, and sets up event listeners.
  - **`config/index.js`**: The single source of truth for all application configuration (user details, terminal settings, command data, fonts).
  - **`controller/`**: Modules for managing application state and UI.
    - **`dataLoader.js`**: Imports the main JS config and asynchronously fetches all other data files from the `/public/config/` directory.
    - **`terminalController.js`**: Manages all DOM interactions and state for the terminal. State is organized in a single `state` object for clarity. Terminal features a glass-blur effect via `backdrop-filter`.
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

| Name          | Type / Range                   | What it controls                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| `speed`       | _ms per frame_ (10–500)        | Lower = faster redraws.                                            |
| `font`        | _px_ (8–40)                    | Glyph size and column width.                                       |
| `lineH`       | float (0.5–2)                  | Vertical spacing multiplier.                                       |
| `density`     | float (0.1–2)                  | Ratio of active columns to total columns.                          |
| `minTrail`    | int                            | Shortest trail length for a column.                                |
| `maxTrail`    | int (≥ `minTrail`)             | Longest trail length.                                              |
| `headGlowMin` | int                            | How many leading glyphs glow at minimum.                           |
| `headGlowMax` | int (≥ `headGlowMin`)          | How many leading glyphs glow at maximum.                           |
| `blur`        | px                             | Canvas blur applied to glowing heads.                              |
| `bloomRadius` | int (0–30)                     | Blur radius for the full-screen bloom pass.                        |
| `bloomIntensity` | float (0–1)                 | Alpha of the bloom layer (0 = off, 0.15 = default).                |
| `decayBase`   | 0.7–0.99                       | Per-glyph opacity multiplier along a trail; lower = quicker decay. |
| `layers`      | int (1–10)                     | Number of parallax layers.                                         |
| `layerOp`     | float array (length =`layers`) | Opacity multiplier per layer.                                      |
| `delChance`   | 0–1                            | Chance a stream is a deletion stream that erases characters.       |
| `multiStream` | float (0–0.8)                  | Chance each active column gets a second concurrent stream.         |
| `highlightChance` | float (0–1)                | Fraction of streams that get extra bright head glow (~0.2 = film). |
| `glyphSyncInterval` | int (1–60)               | Frames between globally synchronized glyph mutations.              |
| `mutationChance` | float (0–1)                  | Per-cell mutation probability on sync frames (0.03 = near-static). |
| `stammerInterval` | int (10–500)                | Frames between head-stammer pauses for highlighted streams.        |
| `headFlickerInterval` | int (1–30)              | Frames between head character changes (lower = faster flicker).    |
| `landingGlow` | float (0–1)                      | Intensity of radial glow burst when streams exit canvas bottom.    |
| `landingGlowSize` | int (10–200)                | Pixel radius of landing glow bursts.                               |
| `dimFloor`    | float (0–0.1)                  | Minimum brightness cells decay toward — keeps the field from going fully black. |
| `gravityAccel` | float (0–1)                   | Downward acceleration; streams speed up as they near the bottom (0 = off). Set via `rain gravity`. |
| `sentientChance` | float (0–0.5)               | Chance a stream spells a hidden phrase instead of random glyphs.   |
| `minStreamGap` | int (0–40)                    | Extra row spacing before a column's second stream restarts.        |

#### Film-Inspired Rain Behaviors

The rain engine uses a **persistent glyph grid** — characters exist at every screen position at all times. Streams are brightness cursors that illuminate cells as they pass; cells decay toward a dim floor, never fully black. This eliminates the "streams on black" look and creates the dense, luminous field seen in the film.

Additional behaviors inspired by [Carl Newton's digital rain analysis](https://carlnewton.github.io/digital-rain-analysis/):

- **Brightness-based color mapping** — Cell brightness maps to a color ramp: white (head) → glow green (near-head) → primary green (trail) → dim floor (background).
- **Depth via opacity layers** — Multiple layers with configurable opacity create a sense of depth without altering character size.
- **Deletion streams** — A small percentage of streams erase characters as they pass, creating organic density cycles.
- **Globally synchronized mutations** — All visible character changes happen simultaneously (configurable via `glyphSyncInterval`, default 6 frames).
- **Selective head highlighting** — Configurable fraction of streams get bright white heads (`highlightChance`, default ~20%).
- **Head stammer** — Highlighted heads periodically pause in unison (`stammerInterval`, default ~90 frames).
- **Landing glow** — Optional radial bloom burst where streams hit the canvas floor (`landingGlow`, disabled by default).
- **Authentic glyph set** — Full-width katakana + numerals + symbols for the classic Matrix look. Font glyphs are already mirrored in the TTF files (as in the film).
- **Full-screen bloom** — Offscreen downscale → Gaussian blur → additive composite creates pervasive phosphor glow that bleeds between characters.
- **Organic speed wobble** — Each stream has ±50% base speed variation plus continuous ±20% sine-wave drift using an irrational frequency, preventing repeating patterns.
- **Multiple raindrops per column** — ~20% of columns run two concurrent streams, creating denser overlapping rain as in the film.
- **Temporal dithering** — Imperceptible per-frame noise on alpha values prevents visible banding on brightness gradients.

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

- [ ] **`help`**: Lists commands in a clean, consolidated format (no easter eggs visible).
- [ ] **`theme <name>`**: Both terminal and rain colors update correctly. Test a few themes.
- [ ] **`rain preset <name>`**: Rain style changes. Test with `default`, `storm`, `rainfall`.
- [ ] **`rain font <name>`**: Switches glyph set. Test `classic`, `resurrections`.
- [ ] **`rain size <px>`**: Glyph size changes. `rain size reset` restores default.
- [ ] **`rain gravity <level>`**: Test `moon`, `earth`, `jupiter`, `off`.
- [ ] **`rain glyphspeed <n>`**: Test `1` (rapid), `15` (steady), `reset`.
- [ ] **`rain`**: Shows current rain config overview.
- [ ] **`term opacity <val>`**: Terminal opacity changes. `term opacity reset` restores.
- [ ] **`term fontsize <size>`**: Test `small`, `large`, `13px`.
- [ ] **`term size <W> <H>`**: Terminal resizes. `term size reset` restores default.
- [ ] **`term`**: Shows current terminal config overview.
- [ ] **`whoami` / `contact` / `skills`**: All personal info correct, links valid.
- [ ] **`download cv`**: Triggers the CV download.
- [ ] **`mission`**: Shows recruiter dossier with clickable quick links.
- [ ] **`reset`**: Clears all preferences, restores green theme + default preset.
- [ ] **Session persistence**: Set a theme + preset, hard refresh, settings persist.
- [ ] **Invalid Command**: Shows "Command not found" with a "Did you mean?" suggestion.
- [ ] **`ee`**: Lists all easter eggs (command itself is hidden from help).
- [ ] **Command History**: Up/Down arrow keys cycle previous commands.
- [ ] **Autocomplete**: Tab completes commands and subcommands (e.g., `rain ` → cycles subcommands).
- [ ] **Shortcuts**: `Ctrl + \` toggles terminal visibility.
- [ ] **Konami Code**: The sequence toggles CRT mode.
- [ ] **No Console Errors**: Developer console free of red errors on load and during use.

---

## 5. User Guide

### 5.1. Terminal Command Cheatsheet

The following commands are available. For detailed info, use `man <command_name>`.

| Command                         | Description                                            |
| :------------------------------ | :----------------------------------------------------- |
| **Portfolio**                   |                                                        |
| `whoami`                        | Display operator identification and detailed profile.  |
| `skills`                        | List key skills (summary).                             |
| `skilltree [path]`              | Explore skills. E.g., `skilltree se`.                  |
| `hobbies`                       | List hobbies and interests.                            |
| `contact`                       | Show contact information.                              |
| `mission`                       | Recruiter dossier with clickable quick links.          |
| `download cv`                   | Download my CV.                                        |
| **Customization**               |                                                        |
| `theme <name>`                  | Change the color scheme.                               |
| `rain`                          | Show rain config. Subcommands below.                   |
| `rain preset <name>`            | Apply rain preset.                                     |
| `rain font <name>`              | Switch rain font set.                                  |
| `rain size <px>\|reset`         | Set rain glyph size (8–40px).                          |
| `rain gravity <level>`          | Acceleration: `off`, `moon`, `earth`, `jupiter`.       |
| `rain glyphspeed <1-30\|reset>` | Glyph mutation speed. Lower = faster.                  |
| `term`                          | Show terminal config. Subcommands below.               |
| `term opacity <val\|reset>`     | Set terminal background opacity (0-100).               |
| `term fontsize <size>`          | Set terminal font size. E.g., `large`, `12px`.         |
| `term size <W> <H>\|reset`      | Resize terminal. E.g., `term size 60vw 70vh`.          |
| `toggleterm`                    | Hide/show terminal (`Ctrl + \`).                       |
| **Utility**                     |                                                        |
| `help`                          | Show available commands.                               |
| `man <command>`                 | Detailed manual for a command.                         |
| `clear`                         | Clear terminal output.                                 |
| `search [keyword]`              | Fuzzy search across hobbies, skills, and commands.     |
| `date [timezone]`               | Display date/time.                                     |
| `screenshot`                    | Save a PNG of the rain canvas.                         |
| `reset`                         | Reset all preferences to defaults.                     |

### 5.2. Customization Options

- **Themes:** `amber`, `crimson`, `ember`, `ghost`, `green` (default), `inferno`, `midnight`, `neuralstorm`, `phantom`, `reloaded`, `sakura`.
- **Rain Presets:** `default`, `comet`, `storm`, `whisper`, `pulse`, `ancient`, `emberfall`, `cascade`, `rainfall`, `frozen`.
- **Rain Gravity:** `moon` (gentle), `earth` (natural), `jupiter` (heavy). Streams accelerate as they fall.
- **Session Persistence:** Theme and rain preset are saved to localStorage and restored on reload. Use `reset` to clear.

### 5.3. Accessibility Notes

- **Keyboard Navigation:** The application is fully navigable via keyboard.
- **Visuals & Contrast:** Multiple theme options offer different contrast levels.
- **Reduced Motion:** Respects `prefers-reduced-motion` — all animations (rain, CRT, hover glitch, blinking prompt) are disabled automatically for users with motion sensitivity.
- **Animation Control:** Terminal visibility can be toggled to hide the main interface.

---

## 6. License & Credits

This project is licensed under the **MIT License**.

**AI Assistance Disclaimer:**
A significant portion of the code in this project (JavaScript, CSS, HTML structure) was developed with the assistance of AI models like Google's Gemini 2.5pro and OpenAI's o3. Human guidance by myself (`rvs-23`) was provided for the overall design, feature requests, integration, iterative refinement etc.

**\*Code & Implementation Inspiration Credits:**

- Initial inspiration and structural ideas from [Rezmason's Matrix Portfolio](https://github.com/Rezmason/matrix/tree/master).
- Matrix Rain Analysis: [Carl Newton's Digital Rain Analysis](https://carlnewton.github.io/digital-rain-analysis/).

<!-- There is no spoon. But there are hidden commands.
     wake      — The Matrix opening sequence. "Wake up..."
     redpill   — You take the red pill. Welcome to the real world.
     bluepill  — The story ends. Ignorance is bliss.
     nospoon   — The terminal bends. It is only yourself.
     sudo      — Attempt a superuser command (always denied).
     decode    — No args = random Matrix quote, decoded.
     hire      — Alias for mission.
     Konami    — ↑↑↓↓←→←→BA toggles CRT mode.
-->
