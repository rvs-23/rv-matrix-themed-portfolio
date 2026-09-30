/**
 * @file paper/content.js
 * Loads and validates everything the paper site renders: content/timeline.json
 * (header, dated entries, learn) and content/notes/*.md. Notes join the
 * timeline at render time as entries of kind "wrote". Every problem is
 * collected and thrown together, so one build run lists all of them.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import matter from "gray-matter";

const MONTH = /^\d{4}(-\d{2})?$/; // "2024" or "2024-10"
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Kinds of timeline entry authored in timeline.json (notes add "wrote"). */
export const ENTRY_KINDS = ["work", "built"];
const NOTE_FILE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

export class ContentError extends Error {}

function check(errors, cond, msg) {
  if (!cond) errors.push(msg);
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;

function checkLinks(errors, where, links) {
  if (links === undefined) return;
  check(errors, Array.isArray(links), `${where}.links must be an array`);
  (links || []).forEach((l, i) => {
    check(errors, isStr(l?.label), `${where}.links[${i}].label is required`);
    check(
      errors,
      isStr(l?.href) && /^(https?:|mailto:|\/)/.test(l.href),
      `${where}.links[${i}].href must be http(s), mailto: or root-relative`,
    );
  });
}

function checkEntry(errors, where, e) {
  check(errors, isStr(e?.id) && /^[a-z0-9-]+$/.test(e.id), `${where}.id must be kebab-case`);
  check(errors, ENTRY_KINDS.includes(e?.kind), `${where}.kind must be one of ${ENTRY_KINDS.join(", ")}`);
  check(errors, isStr(e?.title), `${where}.title is required`);
  check(errors, isStr(e?.body), `${where}.body is required`);
  check(errors, e?.summary === undefined || isStr(e.summary), `${where}.summary must be a non-empty string`);
  check(errors, MONTH.test(e?.start ?? ""), `${where}.start must be YYYY or YYYY-MM`);
  check(
    errors,
    e?.end === undefined || e.end === "present" || MONTH.test(e.end),
    `${where}.end must be YYYY, YYYY-MM or "present"`,
  );
  check(errors, isStr(e?.label), `${where}.label is required`);
  if (e?.figure !== undefined) {
    const f = e.figure;
    check(
      errors,
      (isStr(f?.src) && f.src.endsWith(".svg")) || f?.type === "pipeline",
      `${where}.figure needs an .svg src or type "pipeline"`,
    );
    check(errors, isStr(f?.caption), `${where}.figure.caption is required`);
  }
  (e?.notes || []).forEach((n, i) => {
    check(errors, isStr(n?.term) && isStr(n?.text), `${where}.notes[${i}] needs term and text`);
  });
  checkLinks(errors, where, e?.links);
  check(errors, e?.draft === undefined || typeof e.draft === "boolean", `${where}.draft must be boolean`);
}

/** Validate the parsed timeline.json; returns it unchanged or throws. */
export function validateTimeline(data) {
  const errors = [];
  const site = data?.site;
  check(errors, isStr(site?.name), "site.name is required");
  check(errors, isStr(site?.intro), "site.intro is required");
  checkLinks(errors, "site", site?.links);
  // Optional one-line "In short" summaries closing each section.
  for (const [key, text] of Object.entries(site?.sections ?? {})) {
    check(errors, ["timeline", "learn"].includes(key), `site.sections.${key} is not a section`);
    check(errors, isStr(text), `site.sections.${key} must be a non-empty string`);
  }

  check(errors, Array.isArray(data?.entries), "entries must be an array");
  (data?.entries || []).forEach((e, i) => checkEntry(errors, `entries[${i}]`, e));
  check(errors, Array.isArray(data?.learn), "learn must be an array");
  (data?.learn || []).forEach((q, i) => {
    check(errors, isStr(q?.question), `learn[${i}].question is required`);
    check(errors, isStr(q?.answer), `learn[${i}].answer is required`);
    checkLinks(errors, `learn[${i}]`, q?.links);
  });

  const ids = (data?.entries || []).map((e) => e?.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  check(errors, dupes.length === 0, `duplicate ids: ${dupes.join(", ")}`);

  if (errors.length) throw new ContentError(`timeline.json:\n  - ${errors.join("\n  - ")}`);
  return data;
}

/**
 * Parse + validate one note file. A note may borrow its body from a Markdown
 * file elsewhere in the repo (`source: primer/01-….md`), so a primer is
 * written once and published as-is; its leading `# Title` is dropped.
 */
export function parseNote(file, raw, repoRoot) {
  const errors = [];
  const m = NOTE_FILE.exec(file);
  check(errors, m, `${file}: name must be YYYY-MM-DD-kebab-slug.md`);
  const { data, content } = matter(raw);
  // gray-matter turns bare YAML dates into Date objects; normalise to string.
  const date =
    data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  check(errors, isStr(data.title), `${file}: title is required`);
  check(errors, DAY.test(date ?? ""), `${file}: date must be YYYY-MM-DD`);
  check(errors, !m || date === m[1], `${file}: date must match the filename`);
  check(errors, isStr(data.summary), `${file}: summary is required`);
  check(errors, data.draft === undefined || typeof data.draft === "boolean", `${file}: draft must be boolean`);
  check(errors, data.inline === undefined || typeof data.inline === "boolean", `${file}: inline must be boolean`);
  let body = content;
  if (data.source !== undefined) {
    const path = resolve(repoRoot, String(data.source));
    check(errors, !relative(repoRoot, path).startsWith(".."), `${file}: source must be inside the repo`);
    check(errors, existsSync(path), `${file}: source '${data.source}' not found`);
    check(errors, !content.trim(), `${file}: a note with a source must have no body of its own`);
    if (!errors.length) body = readFileSync(path, "utf8").replace(/^#\s.*\n+/, "");
  }
  if (errors.length) throw new ContentError(errors.join("\n"));
  return {
    file,
    slug: m[2],
    title: data.title,
    date,
    summary: data.summary,
    draft: data.draft === true,
    // Short notes expand in place on /about instead of getting their own page.
    inline: data.inline === true,
    source: data.source ? String(data.source) : null,
    body,
  };
}

/** Load everything under `contentDir`. Notes are sorted newest first. */
export function loadContent(contentDir) {
  const timeline = validateTimeline(
    JSON.parse(readFileSync(join(contentDir, "timeline.json"), "utf8")),
  );
  const notesDir = join(contentDir, "notes");
  const files = existsSync(notesDir)
    ? readdirSync(notesDir).filter((f) => f.endsWith(".md"))
    : [];
  const errors = [];
  const notes = [];
  for (const f of files) {
    try {
      notes.push(parseNote(f, readFileSync(join(notesDir, f), "utf8"), join(contentDir, "..")));
    } catch (err) {
      errors.push(err.message);
    }
  }
  const slugs = notes.map((n) => n.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) errors.push(`duplicate note slugs: ${dupes.join(", ")}`);
  if (errors.length) throw new ContentError(errors.join("\n"));
  notes.sort((a, b) => b.date.localeCompare(a.date));
  return { timeline, notes };
}

/** Every draft still in the content, for the production gate. */
export function listDrafts({ timeline, notes }) {
  const entries = timeline.entries
    .filter((e) => e.draft)
    .map((e) => `entry '${e.id}'`);
  const site = timeline.site.draft ? ["site header"] : [];
  return [...site, ...entries, ...notes.filter((n) => n.draft).map((n) => `note '${n.slug}'`)];
}
