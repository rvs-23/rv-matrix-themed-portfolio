/**
 * @file Main configuration file for the application.
 */

// -- USER DETAILS --
export const user = {
  name: "Rishav Sharma (Rv)",
  title: "Data Scientist / Software Dev ",
  github: "rvs-23",
  linkedin: "rishav-sharma-23rvs",
  medium: "rvs",
  email: "23rishavsharma@gmail.com",
  cvLink:
    "https://drive.google.com/file/d/1Iuc5cFy34BkkRYLZPeGUOMGZNdGUOz-n/view?usp=sharing",
  bio: "Currently working as a Data Scientist...",
  focus: "Building intuitive digital experiences...",
};

// -- TERMINAL SETTINGS --
// Merged from previous steps
export const terminal = {
  defaultSize: {
    width: "69%",
    height: "31%",
  },
  initialOpacity: 0.69,
  konamiCodeSequence: [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ],
  fontSizes: {
    small: "10.5px",
    default: "12.5px",
    large: "15px",
    minPx: 7,
    maxPx: 28,
  },
  messages: {
    opacity_usage:
      "Usage: termopacity <value> (0-100 or 0.0-1.0) or 'termopacity reset'",
    opacity_current: (val) => `Current terminal opacity: ${val}`,
    opacity_unavailable: "Terminal opacity control not available.",
    text_usage: "Usage: termtext <size>",
    text_examples:
      "Examples: termtext 13px, termtext small, termtext default, termtext large",
    text_current: (val) => `Current terminal font size: ${val}`,
    text_unavailable: "Terminal font size control not available.",
  },
};

// -- FONT DEFINITIONS --
export const fonts = {
  sansSerif: "'Inter', sans-serif",
  monospace: "'Fira Code', monospace",
  matrix: "'MatrixA', 'MatrixB', monospace",
};

// -- LOADER SCREEN SETTINGS --
export const loader = {
  messages: [
    "DECRYPTING DATA STREAMS...",
    "CALIBRATING REALITY MATRIX...",
    "ESTABLISHING SECURE LINK...",
    "WELCOME TO THE GRID, USER.",
  ],
  matrixChars:
    "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンFUKZVRC0123456789!?@#$%^&*()[]{};:'\"<>,./\\|",
};

// -- COMMAND: CONTACT --
export const contact = {
  title: "CONTACT CHANNELS",
  channels: [
    { label: "Email", userKey: "email", urlPrefix: "mailto:" },
    {
      label: "LinkedIn",
      userKey: "linkedin",
      urlPrefix: "https://www.linkedin.com/in/",
      isHandle: false,
    },
    {
      label: "GitHub",
      userKey: "github",
      urlPrefix: "https://github.com/",
      isHandle: false,
    },
    {
      label: "Medium",
      userKey: "medium",
      urlPrefix: "https://medium.com/@",
      isHandle: true,
    },
  ],
};

// -- COMMAND: DATE --
// Merged from previous steps
export const date = {
  aliases: {
    utc: { iana: "Etc/UTC", desc: "Coordinated Universal Time..." },
    gmt: { iana: "Etc/GMT", desc: "Greenwich Mean Time." },
    est: { iana: "America/New_York", desc: "Eastern Standard Time..." },
    edt: { iana: "America/New_York", desc: "Eastern Daylight Time..." },
    cst: { iana: "America/Chicago", desc: "Central Standard Time..." },
    cdt: { iana: "America/Chicago", desc: "Central Daylight Time..." },
    mst: { iana: "America/Denver", desc: "Mountain Standard Time..." },
    mdt: { iana: "America/Denver", desc: "Mountain Daylight Time..." },
    pst: { iana: "America/Los_Angeles", desc: "Pacific Standard Time..." },
    pdt: { iana: "America/Los_Angeles", desc: "Pacific Daylight Time..." },
    ist: { iana: "Asia/Kolkata", desc: "Indian Standard Time." },
    jst: { iana: "Asia/Tokyo", desc: "Japan Standard Time." },
    aest: {
      iana: "Australia/Sydney",
      desc: "Australian Eastern Standard Time.",
    },
    bst: { iana: "Europe/London", desc: "British Summer Time." },
    cet: { iana: "Europe/Paris", desc: "Central European Time." },
  },
  locale: "en-US",
  options: {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "longOffset",
    hour12: true,
  },
  messages: {
    localTime: "Local Time",
    hint: "Hint: Try 'date utc', 'date est', 'date ist', etc.",
    unknown_alias: (alias) =>
      `Unknown timezone alias: '${alias}'. Also failed as direct IANA name.`,
    invalid_iana: (alias) =>
      `Unknown timezone alias or invalid IANA name: '${alias}'.`,
    supported_aliases: (aliases) =>
      `Supported aliases: ${aliases}. You can also try IANA timezone names.`,
  },
};

// -- COMMAND: DOWNLOAD --
export const download = {
  cv: {
    userConfigKey: "cvLink",
    placeholder: "path/to/your/resume.pdf",
    filenameTemplate: "{{userName}}_CV.pdf",
    gDriveRegex: "https://drive\\.google\\.com/file/d/([a-zA-Z0-9_-]+)/",
  },
  messages: {
    not_configured: "CV link not configured or is a placeholder.",
    preparing: "Attempting to prepare CV for viewing/download...",
    gdrive_format: "Using Google Drive direct download link format.",
    direct_link: "Using provided link directly. Behavior depends on link type.",
    popup_blocked:
      "If your browser blocked the pop-up or download didn't start, check your browser settings. You can also use the CV link in the navigation bar.",
    usage: "Usage: download cv",
  },
};

// -- COMMAND: EASTER EGG --
export const easterEgg = {
  glitchInterval: 80,
  maxGlitches: 25,
  initialMessage: "Initiating system override...",
  quotes: [
    "Wake up, {{userName}}…",
    "The Matrix has you.",
    "Follow the white rabbit.",
    "Choice is an illusion created between those with power and those without.",
    "The body cannot live without the mind.",
    "Code is just another form of déjà-vu.",
    "It is not the algorithm that scares them, it is the accuracy.",
    "Wake up, the bugs in your dreams are trying to unit test your soul.",
    "Don't think you are. Know you are. That's why you version control your skincare routine.",
    "Free your mind.",
    "A mind that won't question is more predictable than any ML algorithm",
    "You are not the anomaly. You are the expected exception.",
  ],
};

// -- COMMAND: HELP --
export const help = {
  title: "AVAILABLE COMMANDS",
  commandList: [
    {
      cmd: "whoami",
      display: "whoami",
      desc: "Display operator identification and profile.",
    },
    { cmd: "clear", display: "clear", desc: "Clear terminal (keeps welcome)." },
    { cmd: "contact", display: "contact", desc: "Show contact information." },
    {
      cmd: "date",
      display: "date [timezone]",
      desc: "Display date/time. Optional: utc, est, etc.",
    },
    { cmd: "download cv", display: "download cv", desc: "Download my CV." },
    { cmd: "easter.egg", display: "easter.egg", desc: "???" },
    {
      cmd: "hobbies",
      display: "hobbies",
      desc: "List my hobbies and interests.",
    },
    {
      cmd: "man <command>",
      display: "man <command>",
      desc: "Show detailed manual for a command.",
    },
    {
      cmd: "rainpreset <name>",
      display: "rainpreset <name>",
      desc: (context) =>
        `Apply rain preset. Available: ${Object.keys(context.rainEngine.presets || {}).join(", ")}.`,
    },
    {
      cmd: "resize term <W> <H>|reset",
      display: "resize term <W> <H>|reset",
      desc: "Resize terminal. E.g. `resize term 60vw 70vh` or `reset`.",
    },
    {
      cmd: "search [keyword]",
      display: "search [keyword]",
      desc: "Levenshtein distance based search in hobbies, skills and commands.",
    },
    { cmd: "skills", display: "skills", desc: "List my key skills (summary)." },
    {
      cmd: "skilltree [path]",
      display: "skilltree [path]",
      desc: "Explore skills. E.g., `skilltree se`.",
    },
    {
      cmd: "sudo",
      display: "sudo",
      desc: "Attempt superuser command (humorous).",
    },
    {
      cmd: "termopacity <0-100|reset>",
      display: "termopacity <value>|reset",
      desc: "Set terminal background opacity.",
    },
    {
      cmd: "termtext <size>",
      display: "termtext <size>",
      desc: "Set terminal font size. E.g., `13px`, `small`, `default`, `large`.",
    },
    {
      cmd: "theme <name>",
      display: "theme <name>",
      desc: (context) =>
        `Themes: ${context.config.help.availableThemes.sort().join(", ")}. (Default green).`,
    },
    {
      cmd: "toggleterm",
      display: "toggleterm",
      desc: "Hide or show the terminal window (Shortcut: Ctrl + \\).",
    },
    {
      cmd: "screenshot",
      display: "screenshot",
      desc: "Save a 1920×1080 PNG of the rain canvas.",
    },
  ],
  availableThemes: [
    "amber",
    "arctic",
    "bloodmoon",
    "copper",
    "crimson",
    "cyan",
    "cybercandy",
    "deepsea",
    "dunes",
    "forest",
    "ghost",
    "green",
    "hologram",
    "inferno",
    "neon",
    "obsidian",
    "purple",
    "quantum",
    "reloaded",
    "retroarcade",
    "synthwavegrid",
    "terran",
    "toxic",
    "virus",
  ],
};

export const rainpreset = {
  messages: {
    usage: "Usage: rainpreset &lt;preset_name&gt;",
    no_presets: "No rain presets loaded or defined. Check config/rain.json.",
    available_presets: (presets) => `Available presets: ${presets}`,
    unknown_preset: (name) =>
      `Unknown preset: '${name}'. Type 'rainpreset' for options.`,
    reset_success: "Rain configuration reset to defaults.",
    reset_fail: "Reset function not available for rain config.",
    applying: (name, desc) => `Applying preset '${name}'... (${desc})`,
    apply_success: (name) => `Rain preset '${name}' applied successfully.`,
    apply_partial: (name, count) =>
      `Rain preset '${name}' partially applied with ${count} error(s).`,
    apply_fail: (name, count) =>
      `Failed to apply preset '${name}' due to ${count} error(s).`,
    apply_no_settings: (name) =>
      `Preset '${name}' processed. No recognized settings were found to apply.`,
    apply_mixed: (name, s, e) =>
      `Preset '${name}' application processed with mixed results. Successes: ${s}, Errors/Skipped: ${e}.`,
    misconfigured: (name) =>
      `Preset '${name}' is misconfigured (missing 'config' object or 'isReset' flag).`,
  },
};

// -- COMMAND: RESIZE --
export const resize = {
  validUnitsRegex: "^\\d+(\\.\\d+)?(px|%|vw|vh|em|rem)$",
  messages: {
    reset_unavailable:
      "Terminal reset function or default sizes not available.",
    resize_unavailable: "Terminal resize function not available.",
    invalid_units:
      "Invalid size units. Use px, %, vw, vh, em, or rem (e.g., 600px, 80%).",
    usage:
      "Usage: resize term &lt;width&gt; &lt;height&gt; OR resize term reset",
  },
};

// -- COMMAND: WHOAMI --
export const whoami = {
  sections: [
    {
      title: "OPERATOR IDENTIFICATION",
      icon: "fa-id-card",
      fields: [
        { label: "Identity", userKey: "name", fallback: "Operator Unit 734" },
        { label: "Designation", userKey: "title", fallback: "System Analyst" },
      ],
    },
    {
      title: "PROFILE BRIEF",
      icon: "fa-dna",
      isBlock: true,
      userKey: "bio",
    },
    {
      title: "PRIMARY DIRECTIVES",
      icon: "fa-bullseye",
      isBlock: true,
      userKey: "focus",
    },
    {
      title: "NETWORK ACCESS",
      icon: "fa-link",
      useContact: true,
    },
  ],
};

// -- COMMAND: SCREENSHOT --
export const screenshot = {
  resolutions: {
    fhd: { w: 1920, h: 1080 },
    "2k": { w: 2560, h: 1440 },
  },
  messages: {
    usage: "Usage: screenshot [fhd | 2k]",
    invalid_resolution: (res) =>
      `Error: '${res}' is not a valid resolution. Use 'fhd' or '2k'.`,
    success: (filename, res) => `Screenshot saved as ${filename} (${res})`,
  },
};
