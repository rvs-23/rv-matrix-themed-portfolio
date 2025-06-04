/**
 * @file js/commands/rainpreset.js
 * Handles the 'rainpreset' command.
 */

export default function rainPresetCommand(args, context) {
  const { appendToTerminal, rainEngine, rainOptions } = context;
  const presets = rainOptions.getRainPresets
    ? rainOptions.getRainPresets()
    : {};

  // For debugging:
  // console.log("In rainpreset command - Presets object:", JSON.stringify(presets, null, 2));
  // console.log("Is 'comet' preset available?", presets.hasOwnProperty('comet'));

  if (!args || args.length === 0) {
    appendToTerminal(
      "<div class='output-error'>Usage: rainpreset &lt;preset_name&gt;</div>",
      "output-error-wrapper",
    );
    const presetKeys = Object.keys(presets);
    if (presetKeys.length > 0) {
      appendToTerminal(
        `<div>Available presets: ${presetKeys.map((p) => p.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(", ")}</div>`,
        "output-text-wrapper",
      );
    } else {
      appendToTerminal(
        "<div>No rain presets loaded or defined. Check config/rain.json and console for loading errors.</div>",
        "output-text-wrapper",
      );
    }
    return;
  }

  const presetName = args[0].toLowerCase();
  const presetData = presets[presetName];

  if (!presetData) {
    appendToTerminal(
      `<div class='output-error'>Unknown preset: '${presetName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}'. Type 'rainpreset' for options.</div>`,
      "output-error-wrapper",
    );
    return;
  }

  if (presetData.isReset) {
    if (rainOptions.resetRainConfigToActiveDefaults) {
      rainOptions.resetRainConfigToActiveDefaults();
      appendToTerminal(
        `<div class='output-success'>Rain configuration reset to defaults.</div>`,
        "output-success-wrapper",
      );
    } else {
      appendToTerminal(
        "<div class='output-error'>Reset function not available for rain config.</div>",
        "output-error-wrapper",
      );
    }
  } else if (presetData.config) {
    appendToTerminal(
      `<div>Applying preset '${presetName}'... (${presetData.description || ""})</div>`,
      "output-text-wrapper",
    );
    let successCount = 0;
    let errorCount = 0;
    const configToApply = presetData.config;
    const applyOrder = [
      "layers",
      "maxTrail",
      "headGlowMax",
      "minTrail",
      "headGlowMin",
    ];
    const appliedParams = new Set();

    for (const param of applyOrder) {
      if (Object.prototype.hasOwnProperty.call(configToApply, param)) {
        if (
          rainOptions.updateRainConfigParameter &&
          rainOptions.updateRainConfigParameter(
            param,
            configToApply[param],
            configToApply,
          )
        ) {
          successCount++;
        } else {
          // updateRainConfigParameter should log its own warnings/errors for specific failures
          errorCount++;
        }
        appliedParams.add(param);
      }
    }

    for (const param in configToApply) {
      if (
        !appliedParams.has(param) &&
        Object.prototype.hasOwnProperty.call(configToApply, param)
      ) {
        if (
          rainOptions.updateRainConfigParameter &&
          rainOptions.updateRainConfigParameter(
            param,
            configToApply[param],
            configToApply,
          )
        ) {
          successCount++;
        } else {
          // console.warn(`Failed to apply preset parameter (or already handled by applyOrder with error): ${param} with value ${configToApply[param]}`);
          errorCount++; // Count error if updateRainConfigParameter returned false
        }
      }
    }

    if (successCount > 0 && errorCount === 0) {
      appendToTerminal(
        `<div class='output-success'>Rain preset '${presetName}' applied successfully.</div>`,
        "output-success-wrapper",
      );
    } else if (successCount > 0 && errorCount > 0) {
      appendToTerminal(
        `<div class='output-warning'>Rain preset '${presetName}' partially applied with ${errorCount} error(s). Review console for details.</div>`,
        "output-warning-wrapper",
      );
    } else if (errorCount > 0 && successCount === 0) {
      // Only if all attempts resulted in errors
      appendToTerminal(
        `<div class='output-error'>Failed to apply preset '${presetName}' due to ${errorCount} error(s). Review console for details.</div>`,
        "output-error-wrapper",
      );
    } else if (successCount === 0 && errorCount === 0) {
      // No applicable parameters found or no changes made
      appendToTerminal(
        `<div>Preset '${presetName}' processed. No recognized settings were found to apply or change.</div>`,
        "output-text-wrapper",
      );
    } else {
      // Some other mixed case, perhaps success but also some non-critical errors.
      appendToTerminal(
        `<div>Preset '${presetName}' application processed with mixed results. Successes: ${successCount}, Errors/Skipped: ${errorCount}.</div>`,
        "output-text-wrapper",
      );
    }
  } else {
    appendToTerminal(
      `<div class='output-error'>Preset '${presetName}' is misconfigured (missing 'config' object or 'isReset' flag).</div>`,
      "output-error-wrapper",
    );
  }

  if (rainEngine && rainEngine.restartRainAnimation) {
    rainEngine.restartRainAnimation();
  }
}
