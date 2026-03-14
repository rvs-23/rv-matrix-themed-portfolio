/**
 * @file js/commands/contact.js
 * Handles the 'contact' command.
 */
export default function contactCommand(args, context) {
  const { appendToTerminal, userConfig, config } = context;
  const contactConfig = config.contact;

  let contactHtml = `<div class="output-section-title"><i class="fas fa-address-book"></i> ${contactConfig.title}</div>`;

  contactConfig.channels.forEach((channel) => {
    const userValue = userConfig[channel.userKey];
    if (userValue) {
      const displayValue = channel.isHandle ? `@${userValue}` : userValue;
      contactHtml += `<div class="output-line"><span class="output-line-label">${channel.label}:</span> <a href="${channel.urlPrefix}${userValue}" target="_blank" rel="noopener noreferrer">${displayValue}</a></div>`;
    }
  });

  appendToTerminal(`<div class="output-section">${contactHtml}</div>`);
}
