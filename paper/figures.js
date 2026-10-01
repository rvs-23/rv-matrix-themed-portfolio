/**
 * @file paper/figures.js
 * Figures drawn from data at build time, so recurring shapes stay consistent.
 * Output uses `currentColor` and CSS classes only; paper.css owns the look.
 */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const LINE = `class="d" pathLength="1"`;
const CHAR_W = 7.3; // JetBrains Mono at 12px
const H = 40;

function arrowHead(x, y, dir) {
  const [a, b] = dir === "down" ? [[-5, -6], [5, -6]] : dir === "up" ? [[-5, 6], [5, 6]] : [[-6, -5], [-6, 5]];
  return `<path ${LINE} d="M${x + a[0]} ${y + a[1]}L${x} ${y}L${x + b[0]} ${y + b[1]}"/>`;
}

function station(x, y, w, label, note) {
  const cx = x + w / 2;
  return (
    `<rect ${LINE} x="${x}" y="${y}" width="${w}" height="${H}" rx="3"/>` +
    `<text class="fig-label" x="${cx}" y="${y + H / 2 + 4}" text-anchor="middle">${esc(label)}</text>` +
    (note ? `<text class="fig-note" x="${cx}" y="${y + H + 18}" text-anchor="middle">${esc(note)}</text>` : "")
  );
}

/**
 * A pipeline of labelled stations joined by arrows. Up to four steps run left
 * to right; longer ones stack top to bottom so labels stay readable in a
 * ~35rem column. `loop` draws a return arrow from the last step to the first.
 * @param {{ steps: (string | {label: string, note?: string})[], loop?: boolean }} spec
 */
export function pipelineSvg({ steps, loop = false }) {
  const items = steps.map((s) => (typeof s === "string" ? { label: s } : s));
  const widthOf = (s) => Math.max(110, Math.ceil(s.label.length * CHAR_W) + 28);
  const pad = 8;
  const parts = [];
  let width;
  let height;

  if (items.length <= 4) {
    const gap = 40;
    const notes = items.some((s) => s.note) ? 24 : 0;
    let x = pad;
    items.forEach((s, i) => {
      const w = widthOf(s);
      parts.push(station(x, pad, w, s.label, s.note));
      if (i < items.length - 1) {
        const y = pad + H / 2;
        parts.push(`<path ${LINE} d="M${x + w + 6} ${y}H${x + w + gap - 6}"/>`, arrowHead(x + w + gap - 6, y, "right"));
      }
      x += w + gap;
    });
    width = x - gap + pad;
    height = pad * 2 + H + notes + (loop ? 30 : 0);
    if (loop) {
      const y = pad + H + notes + 16;
      const x0 = pad + widthOf(items[0]) / 2;
      const x1 = width - pad - widthOf(items.at(-1)) / 2;
      parts.push(
        `<path ${LINE} d="M${x1} ${pad + H + 4}V${y}H${x0}V${pad + H + 6}"/>`,
        arrowHead(x0, pad + H + 6, "up"),
      );
    }
  } else {
    const gap = 26;
    const w = Math.max(...items.map(widthOf));
    const x = pad + (loop ? 0 : 0);
    items.forEach((s, i) => {
      const y = pad + i * (H + gap);
      parts.push(station(x, y, w, s.label));
      if (i < items.length - 1) {
        parts.push(`<path ${LINE} d="M${x + w / 2} ${y + H + 5}V${y + H + gap - 5}"/>`, arrowHead(x + w / 2, y + H + gap - 5, "down"));
      }
      // Vertical layout puts notes to the right of their station.
      if (s.note) {
        parts.push(`<text class="fig-note" x="${x + w + 14}" y="${y + H / 2 + 5}">${esc(s.note)}</text>`);
      }
    });
    width = pad * 2 + w + (loop ? 44 : 0) + (items.some((s) => s.note) ? 160 : 0);
    height = pad * 2 + items.length * H + (items.length - 1) * gap;
    if (loop) {
      const lastY = pad + (items.length - 1) * (H + gap) + H / 2;
      const rx = x + w + 26;
      parts.push(
        `<path ${LINE} d="M${x + w + 4} ${lastY}H${rx}V${pad + H / 2}H${x + w + 6}"/>`,
        `<path ${LINE} d="M${x + w + 12} ${pad + H / 2 - 5}L${x + w + 6} ${pad + H / 2}L${x + w + 12} ${pad + H / 2 + 5}"/>`,
      );
    }
  }

  const label = items.map((s) => s.label).join(" → ") + (loop ? " → repeat" : "");
  return (
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" ` +
    `style="max-width:${width}px" fill="none" stroke="currentColor" stroke-width="1.25" ` +
    `stroke-linecap="round" stroke-linejoin="round">${parts.join("")}</svg>`
  );
}

/**
 * Parse a *linear* Mermaid flowchart (`A[x] --> B[y] --> …`, optionally
 * looping back to its first node) into pipeline steps. Anything with branches
 * throws: the site draws its own figures rather than shipping Mermaid.
 * @returns {{ steps: {label: string}[], loop: boolean, caption: string }}
 */
export function parseLinearFlowchart(source) {
  const labels = new Map();
  const edges = [];
  let caption = "";
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || /^flowchart\s+(LR|TD|TB)$/.test(line)) continue;
    const cap = /^%%\s*caption:\s*(.+)$/.exec(line);
    if (cap) {
      caption = cap[1].trim();
      continue;
    }
    if (line.startsWith("%%")) continue;
    const nodes = line.split("-->").map((part) => {
      const m = /^([A-Za-z0-9_]+)(?:\[(.+)\])?$/.exec(part.trim());
      if (!m) throw new Error(`unsupported mermaid syntax: '${line}'`);
      if (m[2]) labels.set(m[1], m[2]);
      return m[1];
    });
    if (nodes.length < 2) throw new Error(`unsupported mermaid syntax: '${line}'`);
    for (let i = 0; i < nodes.length - 1; i++) edges.push([nodes[i], nodes[i + 1]]);
  }
  if (!edges.length) throw new Error("mermaid flowchart has no edges");

  // Walk the chain from the node nothing points at (or the first, if looped).
  const next = new Map();
  for (const [a, b] of edges) {
    if (next.has(a)) throw new Error(`mermaid flowchart branches at '${a}'; only linear charts are supported`);
    next.set(a, b);
  }
  const targets = new Set(edges.map(([, b]) => b));
  const start = edges.map(([a]) => a).find((a) => !targets.has(a)) ?? edges[0][0];
  const order = [start];
  let loop = false;
  while (next.has(order.at(-1))) {
    const n = next.get(order.at(-1));
    if (order.includes(n)) {
      if (n !== start) throw new Error("mermaid flowchart loops back mid-chain");
      loop = true;
      break;
    }
    order.push(n);
  }
  if (order.length !== new Set(edges.flat()).size) throw new Error("mermaid flowchart is not a single chain");
  return { steps: order.map((id) => ({ label: labels.get(id) ?? id })), loop, caption };
}

/**
 * `style` for a figure wrapper: its drawn width, so narrow screens can scroll
 * a figure sideways instead of shrinking its labels past legibility.
 */
export function figureStyle(svg) {
  const w = Number(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/.exec(svg)?.[1]);
  return w ? `--fig-w:${Math.round(w)}px` : "";
}

/** Build the SVG for a data-driven figure spec, by `type`. */
export function dataFigureSvg(spec) {
  if (spec.type === "pipeline") return pipelineSvg(spec);
  throw new Error(`unknown figure type '${spec.type}'`);
}
