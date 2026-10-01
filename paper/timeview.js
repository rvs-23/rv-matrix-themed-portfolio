/**
 * @file paper/timeview.js
 * The timeline's shape: eras (the big chapters), each led by its main events
 * (a role, a degree) and followed by what happened alongside, in two columns.
 */

/** The supporting columns, left to right, and which entry kinds go in each. */
export const COLUMNS = [
  { id: "work", label: "Work", kinds: ["work"] },
  { id: "side", label: "Projects & learning", kinds: ["project", "writing", "learn", "study"] },
];

/** Months since year 0 for "2024" (January) or "2024-10". */
export function monthIndex(d) {
  const [y, m] = d.split("-").map(Number);
  return y * 12 + ((m || 1) - 1);
}

/**
 * The era each item belongs to: the newest era that had begun when it did.
 * Items older than every era fall into the oldest.
 */
export function eraOf(item, eras) {
  const at = monthIndex(item.start);
  return eras.find((era) => monthIndex(era.start) <= at) ?? eras.at(-1);
}

/**
 * Each era with its main events and its supporting columns, newest first
 * throughout. A column with nothing in it is left out.
 */
export function eraGroups(items, eras) {
  return eras.map((era) => {
    const mine = items
      .filter((e) => eraOf(e, eras) === era)
      .sort((a, b) => monthIndex(b.start) - monthIndex(a.start));
    const rest = mine.filter((e) => !e.main);
    return {
      era,
      mains: mine.filter((e) => e.main),
      columns: COLUMNS.map((column) => ({ column, items: rest.filter((e) => column.kinds.includes(e.kind)) })).filter(
        (c) => c.items.length,
      ),
    };
  });
}
