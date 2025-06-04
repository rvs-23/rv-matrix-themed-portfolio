/**
 * @file main.js
 * Main entry point for the Matrix Terminal Portfolio application.
 */

import { loadAllData } from './controller/dataLoader.js';
import { initializeLoaderScreen, hideLoadingScreen } from './controller/loaderScreen.js';

// Import the module directly
import * as rainConfigModule from './rain/config.js';
import * as rainEngine from './rain/engine.js';
import * as terminalController from './controller/terminalController.js';
import { initializeShortcuts } from './controller/shortcuts.js';

// Ensure this path is correct for your commands index file:
import { getAllCommands, renderTree } from './commands/0_index.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load all configurations and asset data first
    const allData = await loadAllData();

    const effectiveTerminalConfig = allData.terminalConfig || {
        allMatrixCharsGlobal: "01",
        loadingMessages: ["LOADING..."]
    };
    initializeLoaderScreen(effectiveTerminalConfig);

    // 2. Initialize Rain Configuration (dependent on rainConfig from allData)
    const effectiveRainConfig = allData.rainConfig || {
        defaultConfig: { speed: 100, font: 15, baseCol: "#0F0", headCol: "#FFF", fontFamily: "monospace", layers: 1, layerOp: [1], density: 0.7, minTrail: 10, maxTrail: 30, headGlowMin: 1, headGlowMax: 5, blur: 0, trailMutate: 150, fade: 0.1, decayBase: 0.9, delChance: 0 },
        glyphs: "01",
        presets: {}
    };
    // CORRECTED CALL: Use the imported module object to call its function
    rainConfigModule.initializeRainConfig(effectiveRainConfig);
    // REMOVE THE PREVIOUS DUPLICATE OR INCORRECT CALL if it existed near line 27.

    // 3. Prepare command context
    const commandContext = {
        userConfig: allData.userConfig,
        terminalConfig: allData.terminalConfig,
        // rainConfig: allData.rainConfig, // Raw loaded config, not typically needed by commands directly
        skillsData: allData.skillsData,
        hobbiesData: allData.hobbiesData,
        manPages: allData.manPages,
        appendToTerminal: terminalController.appendToTerminal,
        terminalController: terminalController,
        rainEngine: rainEngine,
        rainOptions: {
            getActiveRainConfig: rainConfigModule.getActiveRainConfig,
            getDefaultRainConfig: rainConfigModule.getDefaultRainConfig,
            getRainPresets: rainConfigModule.getRainPresets,
            updateRainConfigParameter: rainConfigModule.updateRainConfigParameter,
            resetRainConfigToActiveDefaults: rainConfigModule.resetRainConfigToActiveDefaults,
            setActiveRainColorsDirectly: rainConfigModule.setActiveRainColors
        },
        renderTree: renderTree,
        mainContentContainer: document.getElementById('contentContainer'),
        allMatrixChars: allData.terminalConfig.allMatrixCharsGlobal,
        getFullWelcomeMessage: terminalController.getFullWelcomeMessage
    };

    const registeredCommands = getAllCommands();
    terminalController.initializeTerminalController(allData, registeredCommands, () => commandContext);

    initializeShortcuts(allData, (isCrtActive) => {
        terminalController.appendToTerminal(
            `<div class="output-success">Analog Channel Override: CRT Mode ${isCrtActive ? 'Engaged' : 'Disengaged'}.</div>`
        );
    });

    hideLoadingScreen(() => {
        if (document.getElementById('contentContainer')) {
             document.getElementById('contentContainer').style.opacity = '1';
        }
        rainEngine.startRainAnimation();
        console.log("Application initialized successfully.");
    });

    window.addEventListener('resize', () => {
        rainEngine.setupRain();
    });

    // Update navigation links
    const navCvLink = document.getElementById('nav-cv-link');
    const navMediumLink = document.getElementById('nav-medium-link');
    // You'll also want to update other nav links here (LinkedIn, GitHub, Email)
    // similar to how it was done in previous suggestions, using allData.userConfig

    if (allData.userConfig) {
        if (navCvLink && allData.userConfig.cvLink) navCvLink.href = allData.userConfig.cvLink;
        if (navMediumLink) {
            if (allData.userConfig.mediumUser) {
                navMediumLink.href = `https://medium.com/@${allData.userConfig.mediumUser}`;
                navMediumLink.style.display = '';
            } else {
                navMediumLink.style.display = 'none';
            }
        }
        // Example for other links (ensure IDs exist in index.html)
        const linkedinLinkEl = document.getElementById('nav-linkedin-link');
        if (linkedinLinkEl && allData.userConfig.linkedinUser) linkedinLinkEl.href = `https://www.linkedin.com/in/${allData.userConfig.linkedinUser}`;

        const githubLinkEl = document.getElementById('nav-github-link');
        if (githubLinkEl && allData.userConfig.githubUser) githubLinkEl.href = `https://github.com/${allData.userConfig.githubUser}`;

        const emailLinkEl = document.getElementById('nav-email-link');
        if (emailLinkEl && allData.userConfig.emailAddress) emailLinkEl.href = `mailto:${allData.userConfig.emailAddress}`;
    }
});