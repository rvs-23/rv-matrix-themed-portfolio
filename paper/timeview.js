/**
 * @file paper/timeview.js
 * The timeline's lanes: instead of one spine, a track per kind of thing
 * (study · work · projects). Each entry is a node on its track, and its line
 * runs up the page until it ended, so what ran in parallel shows as parallel
 * lines. Worked out at build time from the entries' dates.
 */

/** The tracks, left to right, and which entry kinds ride on each. */
export const TRACKS = [
  { id: "study", label: "Study", kinds: ["study"] },
  { id: "work", label: "Work", kinds: ["work"] },
  { id: "projects", label: "Projects", kinds: ["project", "writing"] },
];

const trackOf = (e) => TRACKS.findIndex((t) => t.kinds.includes(e.kind));

/**
 * A date as fractional years. A bare year starts in January; as an end it
 * means mid-year, so an unknown month doesn't invent an overlap.
 */
export function toYears(d, { end = false, now } = {}) {
  if (d === "present") return now;
  const [y, m] = d.split("-").map(Number);
  if (!m) return y + (end ? 0.5 : 0);
  return y + (m - 1) / 12 + (end ? 1 / 12 : 0);
}

/** [start, end] in fractional years; a one-off project is a single point. */
export function spanOf(e, now) {
  const s = toYears(e.start, { now });
  return [s, e.end ? toYears(e.end, { end: true, now }) : s];
}

/**
 * For each row (newest first), per track: is there a line above the row's
 * node, below it, and is the node on this track?
 *
 * The page is cut into stretches of time between consecutive rows. A track
 * is lit across a stretch when one of its entries covers the whole stretch —
 * so a line never claims an overlap that didn't happen — or when the stretch
 * starts at an entry's own node and that entry lasted any time at all, so a
 * span that ended before the next row still shows. Where a line stops short
 * of a node, the row marks its end with a tick.
 */
export function laneCells(items, now) {
  const eps = 1e-6;
  const t = items.map((e) => toYears(e.start, { now }));
  const spans = items.map((e) => ({ track: trackOf(e), span: spanOf(e, now) }));
  const covers = (k, newer, older) =>
    spans.some(({ track, span: [s, end] }) => track === k && s <= older + eps && end >= newer - eps);
  const lasted = (i) => spans[i].span[1] > spans[i].span[0] + eps;

  // stretch[i]: between row i and the next older row; stretch[-1] runs to now.
  const stretch = (i, k) => {
    const newer = i < 0 ? now : t[i];
    const older = i + 1 < items.length ? t[i + 1] : null;
    if (older === null) return false;
    return covers(k, newer, older) || (spans[i + 1].track === k && lasted(i + 1));
  };

  return items.map((e, i) =>
    TRACKS.map((_, k) => {
      const up = i === 0 ? covers(k, now, t[0]) || (spans[0].track === k && lasted(0)) : stretch(i - 1, k);
      const down = stretch(i, k);
      const node = k === trackOf(e);
      return { up, down, node, end: down && !up && !node };
    }),
  );
}

/** One row's lane cells; the node is a real element so lines meet it cleanly. */
export function lanesHtml(cells) {
  const lanes = cells.map((c, k) => {
    const cls = [`lane lane-${TRACKS[k].id}`, c.up && "up", c.down && "down", c.end && "end"]
      .filter(Boolean)
      .join(" ");
    return `<span class="${cls}">${c.node ? '<i class="dot"></i>' : ""}</span>`;
  });
  return `<span class="lanes" aria-hidden="true">${lanes.join("")}</span>`;
}

/** The legend: each track's name after a swatch of its line. */
export function lanesLegendHtml() {
  const keys = TRACKS.map(
    (t) => `<span class="legend-item"><i class="swatch lane-${t.id}"></i>${t.label.toLowerCase()}</span>`,
  );
  return `<span class="lanes-legend">${keys.join("")}</span>`;
}
