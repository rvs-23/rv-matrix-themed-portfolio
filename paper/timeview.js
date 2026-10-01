/**
 * @file paper/timeview.js
 * The timeline as a time axis. Every year from now back to the first entry
 * gets a marker and every month a slot; an entry sits in the slot of the
 * month it started. Empty months collapse to a thin slice, so distance down
 * the page roughly follows time and gaps read as gaps.
 *
 * Down the side run three lanes (learn · work · projects), always the full
 * height: solid while one of the lane's entries is running, a fine dotted line
 * while nothing is. What happened in parallel shows as parallel solid lines;
 * a one-off project is a dot.
 */

/** The tracks, left to right, and which entry kinds ride on each. */
export const TRACKS = [
  { id: "learn", label: "Learn", kinds: ["study", "learn"] },
  { id: "work", label: "Work", kinds: ["work"] },
  { id: "projects", label: "Projects", kinds: ["project", "writing"] },
];

const trackOf = (e) => TRACKS.findIndex((t) => t.kinds.includes(e.kind));

/** Months since year 0 for "2024" (January) or "2024-10". */
export function monthIndex(d) {
  const [y, m] = d.split("-").map(Number);
  return y * 12 + ((m || 1) - 1);
}

/**
 * An entry's [first, last] month. An unknown end month counts as June, so a
 * bare year doesn't invent an overlap with what came next; "present" runs to
 * `nowIdx`. A one-off project is a single month.
 */
export function monthSpan(e, nowIdx) {
  const first = monthIndex(e.start);
  if (!e.end) return [first, first];
  if (e.end === "present") return [first, nowIdx];
  const [y, m] = e.end.split("-").map(Number);
  return [first, y * 12 + ((m || 6) - 1)];
}

/**
 * The axis, newest first: a `year` row heading each year, then a row per
 * month — one per entry when a month has several, or one empty row. Each row
 * carries its lane cells: whether the line above and below its middle is
 * solid (running) or dotted, and whether the row's node sits on the lane.
 */
export function axisRows(items, now) {
  const nowIdx = monthIndex(now);
  const first = Math.min(...items.map((e) => monthIndex(e.start)));
  const spans = items.map((e) => ({ e, track: trackOf(e), span: monthSpan(e, nowIdx) }));

  // Top of the axis: today, or the newest entry if one is dated later.
  const top = Math.max(nowIdx, ...spans.map((s) => s.span[0]));
  const rows = [];
  for (let i = top; i >= first - (first % 12); i--) {
    const year = Math.floor(i / 12);
    const month = (i % 12) + 1;
    if (month === 12 || i === top) rows.push({ type: "year", year, idx: i, entry: null });
    const starting = spans.filter((s) => s.span[0] === i);
    if (!starting.length) rows.push({ type: "month", year, month, idx: i, entry: null });
    for (const s of starting) rows.push({ type: "month", year, month, idx: i, entry: s.e, track: s.track });
  }

  // Track k is running at a row when a span covers its month; a dot only
  // counts on its own row, so it never grows a line.
  const running = (row, k) =>
    spans.some(({ e, track, span: [a, b] }) =>
      track === k && (a === b ? row.entry === e : a <= row.idx && row.idx <= b),
    );

  rows.forEach((row, r) => {
    row.lanes = TRACKS.map((_, k) => {
      const here = running(row, k);
      const above = r === 0 ? here : running(rows[r - 1], k);
      const below = r + 1 < rows.length && running(rows[r + 1], k);
      const node = row.entry !== null && row.track === k;
      return { up: here && above, down: here && below, node };
    });
  });
  return rows;
}

/** One row's lane cells; the node is a real element so lines meet it cleanly. */
export function lanesHtml(cells) {
  const lanes = cells.map((c, k) => {
    const cls = [`lane lane-${TRACKS[k].id}`, c.up && "up", c.down && "down"]
      .filter(Boolean)
      .join(" ");
    return `<span class="${cls}">${c.node ? '<i class="dot"></i>' : ""}</span>`;
  });
  return `<span class="lanes" aria-hidden="true">${lanes.join("")}</span>`;
}

/** Track names standing on top of their lanes, each over a stub of its tone. */
export function lanesKeyHtml() {
  const keys = TRACKS.map((t) => `<span class="lane-key lane-${t.id}">${t.label}</span>`);
  return `<p class="lanes-key" aria-hidden="true">${keys.join("")}</p>`;
}
