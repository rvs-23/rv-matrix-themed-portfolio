/**
 * @file js/commands/date.js
 * Handles the 'date' command, displaying the current local date and time,
 * or the date and time for a specified timezone.
 */

const timezoneData = {
  utc: {
    iana: "Etc/UTC",
    desc: "Coordinated Universal Time, the primary time standard.",
  },
  gmt: { iana: "Etc/GMT", desc: "Greenwich Mean Time." },
  est: {
    iana: "America/New_York",
    desc: "Eastern Standard Time (North America).",
  },
  edt: {
    iana: "America/New_York",
    desc: "Eastern Daylight Time (North America) - Note: IANA name handles DST.",
  },
  cst: {
    iana: "America/Chicago",
    desc: "Central Standard Time (North America).",
  },
  cdt: {
    iana: "America/Chicago",
    desc: "Central Daylight Time (North America) - Note: IANA name handles DST.",
  },
  mst: {
    iana: "America/Denver",
    desc: "Mountain Standard Time (North America).",
  },
  mdt: {
    iana: "America/Denver",
    desc: "Mountain Daylight Time (North America) - Note: IANA name handles DST.",
  },
  pst: {
    iana: "America/Los_Angeles",
    desc: "Pacific Standard Time (North America).",
  },
  pdt: {
    iana: "America/Los_Angeles",
    desc: "Pacific Daylight Time (North America) - Note: IANA name handles DST.",
  },
  ist: { iana: "Asia/Kolkata", desc: "Indian Standard Time." },
  jst: { iana: "Asia/Tokyo", desc: "Japan Standard Time." },
  aest: { iana: "Australia/Sydney", desc: "Australian Eastern Standard Time." },
  bst: { iana: "Europe/London", desc: "British Summer Time." },
  cet: { iana: "Europe/Paris", desc: "Central European Time." },
};

function getFormattedDateTime(date, timeZoneIana, locale = "en-US") {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "longOffset", // e.g., GMT-04:00
    hour12: true, // Or false for 24-hour format
  };
  if (timeZoneIana) {
    options.timeZone = timeZoneIana;
  }
  try {
    return date.toLocaleString(locale, options);
  } catch (e) {
    // Fallback if timezone is invalid for toLocaleString
    console.warn(
      `Error formatting date for timezone ${timeZoneIana}: ${e.message}`,
    );
    if (timeZoneIana) {
      // Try with just UTC offset as a last resort for display if IANA failed
      try {
        const simplerOptions = { ...options };
        delete simplerOptions.timeZoneName; // toLocaleString might not support longOffset with all IANA names if system is limited
        return (
          date.toLocaleString(locale, {
            timeZone: timeZoneIana,
            ...simplerOptions,
          }) + ` (Specified: ${timeZoneIana})`
        );
      } catch (e2) {
        return `Error ${e2} displaying time for ${timeZoneIana}. Invalid timezone.`;
      }
    }
    return "Error displaying date. Invalid options.";
  }
}

export default function dateCommand(args, context) {
  const { appendToTerminal } = context;
  const now = new Date();
  let requestedTimezoneKey = args[0] ? args[0].toLowerCase() : null;

  if (!requestedTimezoneKey) {
    // Current local time
    const localTime = getFormattedDateTime(now);
    appendToTerminal(
      `<div class="output-line"><span class="output-line-label"><i class="fas fa-clock"></i> Local Time:</span> ${localTime}</div>`,
      "output-date-wrapper",
    );
    appendToTerminal(
      `<div class="output-text-small">Hint: Try 'date utc', 'date est', 'date ist', etc.</div>`,
      "output-text-wrapper",
    );
  } else {
    const tzInfo = timezoneData[requestedTimezoneKey];
    if (tzInfo) {
      const foreignTime = getFormattedDateTime(now, tzInfo.iana);
      let output = `<div class="output-line"><span class="output-line-label"><i class="fas fa-globe-americas"></i> ${requestedTimezoneKey.toUpperCase()} Time:</span> ${foreignTime}</div>`;
      if (tzInfo.desc) {
        output += `<div class="output-line" style="padding-left: 1em; font-size: 0.9em; opacity: 0.8;">${tzInfo.desc}</div>`;
      }
      appendToTerminal(output, "output-date-wrapper");
    } else {
      // Check if it's a direct IANA timezone name
      try {
        const directIANATime = getFormattedDateTime(now, args[0]); // Use args[0] directly
        if (directIANATime.includes("Error displaying")) {
          // Check if getFormattedDateTime had an issue
          appendToTerminal(
            `<div class="output-error">Unknown timezone alias: '${args[0]}'. Also failed as direct IANA name.</div>`,
            "output-error-wrapper",
          );
        } else {
          appendToTerminal(
            `<div class="output-line"><span class="output-line-label"><i class="fas fa-globe"></i> ${args[0]} Time:</span> ${directIANATime}</div>`,
            "output-date-wrapper",
          );
        }
      } catch (e) {
        appendToTerminal(
          `<div class="output-error">Unknown timezone alias or invalid IANA name: '${args[0]}'.</div>`,
          "output-error-wrapper",
        );
      }
      appendToTerminal(
        `<div class="output-text-small">Supported aliases: ${Object.keys(timezoneData).join(", ")}. You can also try IANA timezone names.</div>`,
        "output-text-wrapper",
      );
    }
  }
}
