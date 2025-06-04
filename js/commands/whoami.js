/**
 * @file js/commands/whoami.js
 * Handles the 'whoami' command, displaying comprehensive user information.
 */

export default function whoamiCommand(args, context) {
  const { appendToTerminal, userConfig } = context;
  const {
    userName,
    userTitle,
    bio,
    focus,
    githubUser,
    linkedinUser,
    emailAddress,
  } = userConfig;

  let htmlOutput = `<div class="output-section-title" style="margin-bottom: 0.5em;"><i class="fas fa-id-card"></i> OPERATOR IDENTIFICATION</div>`;

  htmlOutput += `<div class="output-line"><span class="output-line-label">Identity:</span> ${userName || "Operator Unit 734"}</div>`;
  htmlOutput += `<div class="output-line"><span class="output-line-label">Designation:</span> ${userTitle || "System Analyst"}</div>`;

  if (bio) {
    htmlOutput += `<div class="output-section" style="margin-top: 0.7em;">
            <div class="output-section-title"><i class="fas fa-dna"></i> PROFILE BRIEF</div>
            <div class="output-line">${bio.replace(/\n/g, "<br/>")}</div>
        </div>`;
  }

  if (focus) {
    htmlOutput += `<div class="output-section" style="margin-top: 0.7em;">
            <div class="output-section-title"><i class="fas fa-bullseye"></i> PRIMARY DIRECTIVES</div>
            <div class="output-line">${focus.replace(/\n/g, "<br/>")}</div>
        </div>`;
  }

  htmlOutput += `<div class="output-section" style="margin-top: 0.7em;">
        <div class="output-section-title"><i class="fas fa-link"></i> NETWORK ACCESS</div>`;
  if (githubUser) {
    htmlOutput += `<div class="output-line"><span class="output-line-label">GitHub:</span> <a href="https://github.com/${githubUser}" target="_blank" rel="noopener noreferrer">${githubUser}</a></div>`;
  }
  if (linkedinUser) {
    htmlOutput += `<div class="output-line"><span class="output-line-label">LinkedIn:</span> <a href="https://www.linkedin.com/in/${linkedinUser}" target="_blank" rel="noopener noreferrer">${linkedinUser}</a></div>`;
  }
  if (emailAddress) {
    htmlOutput += `<div class="output-line"><span class="output-line-label">Commlink:</span> <a href="mailto:${emailAddress}">${emailAddress}</a></div>`;
  }
  htmlOutput += `</div>`;

  appendToTerminal(htmlOutput, "output-whoami-wrapper");
}
