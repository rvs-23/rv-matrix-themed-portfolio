/**
 * @file js/commands/ee.js
 * Lists all easter eggs. This command is not shown in help.
 */

export default function eeCommand(_args, context) {
  const { appendToTerminal } = context;

  const output =
    `<div class="output-section-title section-title-plain"><i class="fas fa-egg icon-inline"></i> EASTER EGGS</div>` +
    `<div class="output-section">` +
    `<div><span class="output-success">wake</span> — The Matrix opening sequence. "Wake up..."</div>` +
    `<div><span class="output-success">redpill</span> — You take the red pill. Welcome to the real world.</div>` +
    `<div><span class="output-success">bluepill</span> — The story ends. Ignorance is bliss.</div>` +
    `<div><span class="output-success">nospoon</span> — The terminal bends. It is only yourself.</div>` +
    `<div><span class="output-success">sudo</span> — Attempt superuser command.</div>` +
    `<div><span class="output-success">decode</span> — Decode-reveal a random Matrix quote.</div>` +
    `<div><span class="output-success">Konami code</span> — <span class="output-text-small">&uarr;&uarr;&darr;&darr;&larr;&rarr;&larr;&rarr;BA</span> — Toggles CRT mode.</div>` +
    `</div>`;

  appendToTerminal(output);
}
