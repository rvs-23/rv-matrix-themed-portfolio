/**
 * @file js/commands/contact.js
 * Handles the 'contact' command.
 */
export default function contactCommand(args, context) {
  const { appendToTerminal, userConfig } = context;
  const { emailAddress, linkedinUser, githubUser, mediumUser } = userConfig;

  let contactHtml = `<div class="output-section-title"><i class="fas fa-address-book"></i> CONTACT CHANNELS</div>`;
  if (emailAddress) {
    contactHtml += `<div class="output-line"><span class="output-line-label">Email:</span> <a href="mailto:${emailAddress}">${emailAddress}</a></div>`;
  }
  if (linkedinUser) {
    contactHtml += `<div class="output-line"><span class="output-line-label">LinkedIn:</span> <a href="https://www.linkedin.com/in/${linkedinUser}" target="_blank" rel="noopener noreferrer">${linkedinUser}</a></div>`;
  }
  if (githubUser) {
    contactHtml += `<div class="output-line"><span class="output-line-label">GitHub:</span> <a href="https://github.com/${githubUser}" target="_blank" rel="noopener noreferrer">${githubUser}</a></div>`;
  }
  if (mediumUser) {
    contactHtml += `<div class="output-line"><span class="output-line-label">Medium:</span> <a href="https://medium.com/@${mediumUser}" target="_blank" rel="noopener noreferrer">@${mediumUser}</a></div>`;
  }
  appendToTerminal(`<div class="output-section">${contactHtml}</div>`);
}
