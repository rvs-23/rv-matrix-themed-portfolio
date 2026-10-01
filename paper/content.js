/**
 * @file paper/content.js
 * Loads and validates everything the paper site renders: content/timeline.json
 * (header + dated entries), content/projects/*.md (walkthroughs) and
 * content/notes/*.md (writing, which joins the timeline at render time). Every problem is
 * collected and thrown together, so one build run lists all of them.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import matter from "gray-matter";

const MONTH = /^\d{4}(-\d{2})?$/; // "2024" or "2024-10"
const DAY = /^\d{4}-\d{2}-\d{2}$/;
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

/** What a timeline entry can be. Writing joins from content/notes. */
export const ENTRY_KINDS = ["work", "study", "project"];
const PROJECT_FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

function checkEntry(errors, where, e, contentDir) {
  const logosDir = join(contentDir, "logos");
  check(errors, isStr(e?.id) && /^[a-z0-9-]+$/.test(e.id), `${where}.id must be kebab-case`);
  check(errors, ENTRY_KINDS.includes(e?.kind), `${where}.kind must be one of ${ENTRY_KINDS.join(", ")}`);
  check(errors, MONTH.test(e?.start ?? ""), `${where}.start must be YYYY or YYYY-MM`);
  check(
    errors,
    e?.end === undefined || e.end === "present" || MONTH.test(e.end),
    `${where}.end must be YYYY, YYYY-MM or "present"`,
  );
  for (const key of ["label", "title", "summary"]) {
    check(errors, isStr(e?.[key]), `${where}.${key} is required`);
  }
  check(errors, e?.body === undefined || isStr(e.body), `${where}.body must be a non-empty string`);
  check(
    errors,
    e?.skills === undefined || (Array.isArray(e.skills) && e.skills.every(isStr)),
    `${where}.skills must be a list of strings`,
  );
  if (e?.logo !== undefined) {
    check(
      errors,
      /^[a-z0-9-]+\.(svg|png)$/.test(e.logo) && existsSync(join(logosDir, e.logo)),
      `${where}.logo '${e.logo}' must be a file in content/logos`,
    );
  }
  // A walkthrough is either one of our pages (/about/<slug>/) or an article elsewhere.
  check(
    errors,
    e?.walkthrough === undefined || /^(\/about\/[a-z0-9-]+\/|https:\/\/)/.test(e.walkthrough),
    `${where}.walkthrough must be /about/<slug>/ or an https URL`,
  );
  check(errors, e?.repo === undefined || /^https:\/\//.test(e.repo), `${where}.repo must be an https URL`);
  // A small inline figure: a file in content/figures, or a pipeline drawn from data.
  if (e?.thumb !== undefined) {
    const t = e.thumb;
    check(
      errors,
      (isStr(t) && /^[a-z0-9-]+\.svg$/.test(t) && existsSync(join(contentDir, "figures", t))) ||
        (t?.type === "pipeline" && Array.isArray(t.steps) && t.steps.length > 1),
      `${where}.thumb must be a file in content/figures or a pipeline`,
    );
  }
  check(errors, e?.draft === undefined || typeof e.draft === "boolean", `${where}.draft must be boolean`);
}
/** Validate the parsed timeline.json; returns it unchanged or throws. */
export function validateTimeline(data, contentDir = "") {
  const errors = [];
  const site = data?.site;
  check(errors, isStr(site?.name), "site.name is required");
  check(errors, isStr(site?.intro), "site.intro is required");
  checkLinks(errors, "site", site?.links);

  check(errors, Array.isArray(data?.entries), "entries must be an array");
  (data?.entries || []).forEach((e, i) => checkEntry(errors, `entries[${i}]`, e, contentDir));

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
/** Parse one project walkthrough (content/projects/<slug>.md). */
export function parseProject(file, raw) {
  const errors = [];
  const m = PROJECT_FILE.exec(file);
  check(errors, m, `${file}: name must be kebab-slug.md`);
  const { data, content } = matter(raw);
  check(errors, isStr(data.title), `${file}: title is required`);
  check(errors, isStr(data.summary), `${file}: summary is required`);
  check(errors, isStr(content), `${file}: the walkthrough has no body`);
  check(errors, data.draft === undefined || typeof data.draft === "boolean", `${file}: draft must be boolean`);
  if (errors.length) throw new ContentError(errors.join("\n"));
  return { file, slug: m[1], title: data.title, summary: data.summary, draft: data.draft === true, body: content };
}

function readMarkdownDir(dir, parse, errors) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    try {
      out.push(parse(f, readFileSync(join(dir, f), "utf8")));
    } catch (err) {
      errors.push(err.message);
    }
  }
  return out;
}

/** Load everything under `contentDir`. Notes are sorted newest first. */
export function loadContent(contentDir) {
  const timeline = validateTimeline(
    JSON.parse(readFileSync(join(contentDir, "timeline.json"), "utf8")),
    contentDir,
  );
  const errors = [];
  const repoRoot = join(contentDir, "..");
  const notes = readMarkdownDir(join(contentDir, "notes"), (f, raw) => parseNote(f, raw, repoRoot), errors);
  const projects = readMarkdownDir(join(contentDir, "projects"), parseProject, errors);

  const slugs = [...notes, ...projects].map((n) => n.slug);
  const dupes = slugs.filter((x, i) => slugs.indexOf(x) !== i);
  if (dupes.length) errors.push(`duplicate page slugs: ${dupes.join(", ")}`);

  // Every on-site walkthrough has a page, and every page is reachable.
  const pages = new Set(projects.map((p) => `/about/${p.slug}/`));
  const linked = new Set();
  for (const e of timeline.entries) {
    if (!e.walkthrough?.startsWith("/about/")) continue;
    linked.add(e.walkthrough);
    if (!pages.has(e.walkthrough)) errors.push(`entry '${e.id}': no content/projects page for ${e.walkthrough}`);
  }
  for (const p of pages) if (!linked.has(p)) errors.push(`content/projects page ${p} is not linked from any entry`);

  if (errors.length) throw new ContentError(errors.join("\n"));
  notes.sort((a, b) => b.date.localeCompare(a.date));
  return { timeline, notes, projects };
}
/** Every draft still in the content, for the production gate. */
export function listDrafts({ timeline, notes, projects = [] }) {
  const site = timeline.site.draft ? ["site header"] : [];
  return [
    ...site,
    ...timeline.entries.filter((e) => e.draft).map((e) => `entry '${e.id}'`),
    ...projects.filter((p) => p.draft).map((p) => `walkthrough '${p.slug}'`),
    ...notes.filter((n) => n.draft).map((n) => `note '${n.slug}'`),
  ];
}