export default function rainPresetCommand(args, context) {
  // ++ Get configs from context
  const { appendToTerminal, rainEngine, rainOptions, config } = context;
  const messages = config.rainpreset.messages;
  const presets = rainOptions.getRainPresets
    ? rainOptions.getRainPresets()
    : {};

  if (!args || args.length === 0) {
    appendToTerminal(`<div class='output-error'>${messages.usage}</div>`);
    const presetKeys = Object.keys(presets);
    if (presetKeys.length > 0) {
      appendToTerminal(
        `<div>${messages.available_presets(presetKeys.join(", "))}</div>`,
      );
    } else {
      appendToTerminal(`<div>${messages.no_presets}</div>`);
    }
    return;
  }

  const presetName = args[0].toLowerCase();
  const presetData = presets[presetName];

  if (!presetData) {
    return appendToTerminal(
      `<div class='output-error'>${messages.unknown_preset(presetName)}</div>`,
    );
  }

  if (presetData.isReset) {
    if (rainOptions.resetRainConfigToActiveDefaults) {
      rainOptions.resetRainConfigToActiveDefaults();
      appendToTerminal(
        `<div class='output-success'>${messages.reset_success}</div>`,
      );
    } else {
      appendToTerminal(
        `<div class='output-error'>${messages.reset_fail}</div>`,
      );
    }
  } else if (presetData.config) {
    appendToTerminal(
      `<div>${messages.applying(presetName, presetData.description || "")}</div>`,
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
          rainOptions.updateRainConfigParameter?.(
            param,
            configToApply[param],
            configToApply,
          )
        ) {
          successCount++;
        } else {
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
          rainOptions.updateRainConfigParameter?.(
            param,
            configToApply[param],
            configToApply,
          )
        ) {
          successCount++;
        } else {
          errorCount++;
        }
      }
    }

    if (successCount > 0 && errorCount === 0) {
      appendToTerminal(
        `<div class='output-success'>${messages.apply_success(presetName)}</div>`,
      );
    } else if (successCount > 0 && errorCount > 0) {
      appendToTerminal(
        `<div class='output-warning'>${messages.apply_partial(presetName, errorCount)}</div>`,
      );
    } else if (errorCount > 0 && successCount === 0) {
      appendToTerminal(
        `<div class='output-error'>${messages.apply_fail(presetName, errorCount)}</div>`,
      );
    } else if (successCount === 0 && errorCount === 0) {
      appendToTerminal(`<div>${messages.apply_no_settings(presetName)}</div>`);
    } else {
      appendToTerminal(
        `<div>${messages.apply_mixed(presetName, successCount, errorCount)}</div>`,
      );
    }
  } else {
    appendToTerminal(
      `<div class='output-error'>${messages.misconfigured(presetName)}</div>`,
    );
  }

  rainEngine?.restartRainAnimation();
}
