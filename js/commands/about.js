/**
 * @file js/commands/about.js
 * Points to the paper site (/about): the same person, readable top to bottom.
 */

export default function aboutCommand(_args, context) {
  const { appendToTerminal, paper } = context;
  if (!paper) {
    appendToTerminal(
      "<div class='output-text-small'>The readable version of this site isn't published yet. Try <span class='output-success'>whoami</span>.</div>",
    );
    return;
  }
  appendToTerminal(
    `<div>The plain version of this site — work, things built, notes: <a href="${paper.about}">rvs23.dev${paper.about}</a></div>`,
  );
}
