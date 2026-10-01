/**
 * @file paper/timeview.js
 * The timeline's shape: two columns either side of one line of years. Work
 * hangs on the left, projects and learning on the right, so what happened in
 * the same year sits side by side.
 */

/** The columns, left to right, and which entry kinds go in each. */
export const COLUMNS = [
  { id: "work", label: "Work", kinds: ["work"] },
  { id: "side", label: "Projects & learning", kinds: ["project", "writing", "learn", "study"] },
];

/** Months since year 0 for "2024" (January) or "2024-10". */
export function monthIndex(d) {
  const [y, m] = d.split("-").map(Number);
  return y * 12 + ((m || 1) - 1);
}

/** Years that have something, newest first, each split into the columns. */
export function yearRows(items) {
  const sorted = [...items].sort((a, b) => monthIndex(b.start) - monthIndex(a.start));
  const years = [...new Set(sorted.map((e) => e.start.slice(0, 4)))];
  return years.map((year) => {
    const mine = sorted.filter((e) => e.start.slice(0, 4) === year);
    return { year, columns: COLUMNS.map((column) => ({ column, items: mine.filter((e) => column.kinds.includes(e.kind)) })) };
  });
}
