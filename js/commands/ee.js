/**
 * @file js/commands/ee.js
 * Lists all easter eggs with discovery progress. Not shown in help.
 */

import { getUnlockedEggs, EGG_IDS } from "../eggs.js";

const EGGS = [
  { id: "wake", label: "wake", desc: 'The Matrix opening sequence. "Wake up..."' },
  { id: "redpill", label: "redpill", desc: "You take the red pill. Welcome to the real world." },
  { id: "bluepill", label: "bluepill", desc: "The story ends. Ignorance is bliss." },
  { id: "nospoon", label: "nospoon", desc: "The terminal bends. It is only yourself." },
  { id: "sudo", label: "sudo", desc: "Attempt superuser command." },
  { id: "decode", label: "decode", desc: "Decode-reveal a random Matrix quote." },
  {
    id: "konami",
    label: "Konami code",
    desc: "<span class='output-text-small'>&uarr;&uarr;&darr;&darr;&larr;&rarr;&larr;&rarr;BA</span> — Toggles CRT mode.",
  },
];

export default function eeCommand(_args, context) {
  const { appendToTerminal } = context;
  const unlocked = getUnlockedEggs();
  const count = unlocked.length;
  const total = EGG_IDS.length;

  let output =
    `<div class="output-section-title section-title-plain"><i class="fas fa-egg icon-inline"></i> EASTER EGGS</div>` +
    `<div class="output-text-small">Discovered: <span class="output-success">${count}</span> / ${total}</div>` +
    `<div class="output-section">`;

  for (const egg of EGGS) {
    const found = unlocked.includes(egg.id);
    const marker = found
      ? `<span class="output-success">[✓]</span>`
      : `<span class="output-text-small">[ ]</span>`;
    const name = found
      ? `<span class="output-success">${egg.label}</span>`
      : `<span class="output-text-small">${egg.label}</span>`;
    output += `<div>${marker} ${name} — ${egg.desc}</div>`;
  }

  output += `</div>`;
  appendToTerminal(output);
}
