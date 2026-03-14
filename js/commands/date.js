/**
 * @file js/commands/date.js
 * Handles the 'date' command.
 */

function getFormattedDateTime(date, timeZoneIana, locale, options) {
  const finalOptions = { ...options };
  if (timeZoneIana) {
    finalOptions.timeZone = timeZoneIana;
  }
  try {
    return date.toLocaleString(locale, finalOptions);
  } catch (e) {
    console.warn(`Error formatting date for timezone ${timeZoneIana}:`, e);
    return `Error displaying time for ${timeZoneIana}. Invalid timezone.`;
  }
}

export default function dateCommand(args, context) {
  // Get configs from context
  const { appendToTerminal, config } = context;
  const dateConfig = config.date;
  const timezoneData = dateConfig.aliases;
  const now = new Date();
  let requestedTimezoneKey = args[0] ? args[0].toLowerCase() : null;

  if (!requestedTimezoneKey) {
    const localTime = getFormattedDateTime(
      now,
      null,
      dateConfig.locale,
      dateConfig.options,
    );
    appendToTerminal(
      `<div class="output-line"><span class="output-line-label"><i class="fas fa-clock"></i> ${dateConfig.messages.localTime}:</span> ${localTime}</div>`,
      "output-date-wrapper",
    );
    appendToTerminal(
      `<div class="output-text-small">${dateConfig.messages.hint}</div>`,
    );
  } else {
    const tzInfo = timezoneData[requestedTimezoneKey];
    if (tzInfo) {
      const foreignTime = getFormattedDateTime(
        now,
        tzInfo.iana,
        dateConfig.locale,
        dateConfig.options,
      );
      let output = `<div class="output-line"><span class="output-line-label"><i class="fas fa-globe-americas"></i> ${requestedTimezoneKey.toUpperCase()} Time:</span> ${foreignTime}</div>`;
      if (tzInfo.desc) {
        output += `<div class="output-line" style="padding-left: 1em; font-size: 0.9em; opacity: 0.8;">${tzInfo.desc}</div>`;
      }
      appendToTerminal(output, "output-date-wrapper");
    } else {
      const directIANATime = getFormattedDateTime(
        now,
        args[0],
        dateConfig.locale,
        dateConfig.options,
      );
      if (directIANATime.includes("Error")) {
        appendToTerminal(
          `<div class="output-error">${dateConfig.messages.unknown_alias(args[0])}</div>`,
        );
      } else {
        appendToTerminal(
          `<div class="output-line"><span class="output-line-label"><i class="fas fa-globe"></i> ${args[0]} Time:</span> ${directIANATime}</div>`,
        );
      }
      appendToTerminal(
        `<div class="output-text-small">${dateConfig.messages.supported_aliases(Object.keys(timezoneData).join(", "))}</div>`,
      );
    }
  }
}
