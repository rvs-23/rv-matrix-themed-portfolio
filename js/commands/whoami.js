export default function whoamiCommand(args, context) {
  // ++ Get configs from context
  const { appendToTerminal, userConfig, config } = context;
  const whoamiConfig = config.whoami;
  const contactConfig = config.contact;

  let htmlOutput = "";

  // ++ Build HTML from config
  whoamiConfig.sections.forEach((section) => {
    htmlOutput += `<div class="output-section" style="margin-top: 0.7em;">`;
    htmlOutput += `<div class="output-section-title"><i class="fas ${section.icon}"></i> ${section.title}</div>`;

    if (section.isBlock) {
      const blockContent = userConfig[section.userKey];
      if (blockContent) {
        htmlOutput += `<div class="output-line">${blockContent.replace(/\n/g, "<br/>")}</div>`;
      }
    } else if (section.useContact) {
      // Reuse contact config for the network access section
      contactConfig.channels.forEach((channel) => {
        const userValue = userConfig[channel.userKey];
        if (userValue) {
          const displayValue = channel.isHandle ? `@${userValue}` : userValue;
          htmlOutput += `<div class="output-line"><span class="output-line-label">${channel.label}:</span> <a href="${channel.urlPrefix}${userValue}" target="_blank" rel="noopener noreferrer">${displayValue}</a></div>`;
        }
      });
    } else {
      section.fields.forEach((field) => {
        const value = userConfig[field.userKey] || field.fallback;
        htmlOutput += `<div class="output-line"><span class="output-line-label">${field.label}:</span> ${value}</div>`;
      });
    }
    htmlOutput += `</div>`;
  });

  appendToTerminal(htmlOutput, "output-whoami-wrapper");
}
