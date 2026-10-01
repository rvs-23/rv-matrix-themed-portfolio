/**
 * @file paper/templates.js
 * HTML for /about, note and walkthrough pages, the RSS feed and the sitemap. Plain
 * template strings: every content string is either escaped here or comes out
 * of renderMarkdown (which rejects raw HTML).
 */

import { renderMarkdown, renderInline, loadFigureSvg } from "./markdown.js";
import { dataFigureSvg } from "./figures.js";
import { axisRows, lanesHtml, lanesKeyHtml } from "./timeview.js";
import { posix } from "node:path";

export const SITE_URL = "https://rvs23.dev";
const REPO_URL = "https://github.com/rvs-23/rv-matrix-themed-portfolio/blob/main";

/** Swapped for the real gzip weight in generateBundle (build only). */
export const WEIGHT_TOKEN = "__PAPER_PAGE_WEIGHT__";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");



const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-07-05" → "5 Jul 2026", without locale surprises ("Sept"). */
function formatDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function draftTag(item, ctx) {
  return item.draft && ctx.mode !== "production"
    ? ` <span class="draft-tag">draft</span>`
    : "";
}

function linksHtml(links, cls = "links") {
  if (!links?.length) return "";
  const items = links.map((l) => {
    const external = /^https?:/.test(l.href);
    const attrs = external ? ` rel="noopener"` : "";
    return `<a href="${esc(l.href)}"${attrs}>${esc(l.label)}</a>`;
  });
  // Real spaces around the separator so the row can wrap on narrow screens.
  return `<p class="${cls}">${items.join(` <span class="sep" aria-hidden="true">·</span> `)}</p>`;
}

/**
 * An organisation's logo tile. The root-relative src lets Vite fingerprint
 * the file on build, and only pages that render a logo ship it.
 */
function logoHtml(item) {
  if (!item.logo) return "";
  return `<img class="logo" src="/content/logos/${esc(item.logo)}" alt="" width="48" height="48" decoding="async" />`;
}

/** Cornell cue: the skills an entry used, as a short list. */
function skillsHtml(skills, cls = "skills") {
  if (!skills?.length) return "";
  if (cls === "skills-inline") {
    return `<p class="${cls}">${skills.map(esc).join(` <span class="sep" aria-hidden="true">·</span> `)}</p>`;
  }
  return `<div class="${cls}"><p class="margin-term">Skills</p><ul>${skills.map((k) => `<li>${esc(k)}</li>`).join("")}</ul></div>`;
}

function md(src, ctx, where) {
  return renderMarkdown(src, { file: where, figuresDir: ctx.figuresDir }).html;
}

/** Shared <head> + running header + body wrapper. */
function shell({ title, description, path, body, ctx, runhead }) {
  const robots = ctx.mode === "production" ? "" : `\n    <meta name="robots" content="noindex" />`;
  const banner =
    ctx.mode === "production"
      ? ""
      : `<p class="preview-banner">Preview build — drafts visible, not indexed.</p>`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />${robots}
    <link rel="canonical" href="${SITE_URL}${path}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${SITE_URL}${path}" />
    <meta name="twitter:card" content="summary" />
    <link rel="alternate" type="application/rss+xml" title="Notes" href="/feed.xml" />
    <link rel="icon" href="/paper/icon.svg" type="image/svg+xml" />
    <link rel="icon" href="/paper/icon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/paper/icon-180.png" />
    <link rel="stylesheet" href="/paper/paper.css" />
    <script type="module" src="/paper/paper.js"></script>
  </head>
  <body class="paper">
    <a class="skip" href="#main">Skip to content</a>
    ${banner}
    <header class="runhead">
      <a class="runhead-name" href="/about/">${esc(ctx.site.name)}</a>
      <span class="runhead-sec" data-runhead>${esc(runhead)}</span>
      ${linksHtml(ctx.site.links, "runhead-links")}
    </header>
    <main id="main">
${body}
    </main>
  </body>
</html>
`;
}



const sortKey = (d) => (d.length === 4 ? `${d}-00` : d);

const monthOf = (d) => (d.length > 4 ? MONTHS[Number(d.slice(5, 7)) - 1] : "");

/** "Aug 2025 → now", "2024 → 2025", "May 2021": an entry's span, compactly. */
function when(e) {
  const fmt = (d) => (d.length > 4 ? `${monthOf(d)} ${d.slice(0, 4)}` : d);
  if (!e.end) return fmt(e.start);
  return `${fmt(e.start)} → ${e.end === "present" ? "now" : fmt(e.end)}`;
}

/** Date cell beside an entry: the month it began (or its year, when only the
 *  year is known) and, for a span, when it ended. */
function dateCue(e) {
  const fmt = (d) => (d.length > 4 ? monthOf(d) : d);
  const start = `<span class="entry-month">${fmt(e.start)}</span>`;
  if (!e.end) return start;
  const end = e.end === "present" ? "now" : e.end.length > 4 ? `${monthOf(e.end)} ${e.end.slice(0, 4)}` : e.end;
  return `${start}<span class="entry-end">→ ${esc(end)}</span>`;
}

/**
 * Everything dated, newest first: timeline.json entries plus the notes. Each
 * row is one line of title and one of summary; depth lives on the walkthrough
 * or note it links to.
 */
function timelineItems(ctx) {
  const notes = ctx.notes.map((n) => ({
    id: `note-${n.slug}`,
    kind: "writing",
    start: n.date.slice(0, 7),
    label: n.source ? "Primer" : "Note",
    title: n.title,
    summary: n.summary,
    walkthrough: n.inline ? undefined : `/about/${n.slug}/`,
    draft: n.draft,
    note: n,
  }));
  return [...ctx.timeline.entries, ...notes].sort((a, b) => sortKey(b.start).localeCompare(sortKey(a.start)));
}

/** Logo tile, or a plain glyph tile for things that have no organisation. */
function tileHtml(e) {
  if (e.logo) return logoHtml(e);
  const glyph = e.kind === "writing" ? "¶" : e.kind === "learn" ? "+" : "{ }";
  return `<span class="logo glyph" aria-hidden="true">${glyph}</span>`;
}

/**
 * A small inline version of the entry's figure, linking to its walkthrough.
 * Decorative here (the walkthrough has it full size, with a caption).
 */
function thumbHtml(e, ctx) {
  if (!e.thumb) return "";
  const svg =
    typeof e.thumb === "string"
      ? loadFigureSvg(ctx.figuresDir, e.thumb, `entries.${e.id}`)
      : dataFigureSvg(e.thumb);
  const art = svg.replace("<svg", '<svg aria-hidden="true" focusable="false"');
  return e.walkthrough
    ? `<a class="thumb" href="${esc(e.walkthrough)}" tabindex="-1" aria-hidden="true">${art}</a>`
    : `<div class="thumb" aria-hidden="true">${art}</div>`;
}

/** The link that opens an entry's depth: our walkthrough, a note, or Medium. */
function walkLink(e) {
  if (!e.walkthrough) return "";
  const external = e.walkthrough.startsWith("https://");
  const label = e.kind === "writing" ? "Read" : "Walkthrough";
  const where = external ? (/medium\.com|faun\.pub/.test(e.walkthrough) ? " on Medium" : "") : "";
  return `<a class="walk" href="${esc(e.walkthrough)}"${external ? ' rel="noopener"' : ""}>${label}${where} ${external ? "↗" : "→"}</a>`;
}

function rowHtml(e, ctx, lanes) {
  const title = renderInline(e.title, { file: `entries.${e.id}`, figuresDir: ctx.figuresDir });
  const titleHtml = e.walkthrough ? `<a href="${esc(e.walkthrough)}">${title}</a>` : title;
  // Short notes still open in place; everything else is one line plus a link.
  const inlineNote =
    e.note?.inline
      ? `<details class="note-inline"><summary>Read it here</summary><div class="prose">${md(e.note.body, ctx, `notes/${e.note.file}`)}</div></details>`
      : "";
  const code = e.repo ? `<a class="walk" href="${esc(e.repo)}" rel="noopener">Code ↗</a>` : "";
  return `          <li class="entry kind-${e.kind}" id="${esc(e.id)}">
            <p class="entry-date"><time datetime="${esc(e.start)}">${dateCue(e)}</time>${lanes}</p>
            <div class="entry-main has-logo">
              ${tileHtml(e)}
              <div class="entry-body">
                <p class="kicker">${esc(e.label)}${draftTag(e, ctx)}</p>
                <h3 class="entry-title">${titleHtml}</h3>
                <p class="entry-summary">${esc(e.summary)}</p>
                ${thumbHtml(e, ctx)}
                ${e.body ? `<div class="prose">${md(e.body, ctx, `entries.${e.id}`)}</div>` : ""}
                ${inlineNote}
              </div>
            </div>
            <div class="entry-rail">${skillsHtml(e.skills)}${walkLink(e) || code ? `<p class="rail-links">${walkLink(e)}${code}</p>` : ""}</div>
          </li>`;
}

function timelineSection(ctx) {
  const rows = axisRows(timelineItems(ctx), ctx.buildDate.slice(0, 7)).map((row) => {
    const lanes = lanesHtml(row.lanes);
    if (row.type === "year") {
      return `          <li class="axis-year" id="y${row.year}"><p class="entry-date"><span class="year-label">${row.year}</span>${lanes}</p></li>`;
    }
    if (!row.entry) return `          <li class="axis-month"><p class="entry-date">${lanes}</p></li>`;
    return rowHtml(row.entry, ctx, lanes);
  });
  // Straight from the masthead into the axis: the labels say what each lane is.
  return `      <section class="sec" id="timeline" data-title="Timeline">
        ${lanesKeyHtml()}
        <ol class="timeline">
${rows.join("\n")}
        </ol>
      </section>`;
}

function colophon(ctx) {
  return `      <footer class="colophon" id="colophon" data-title="Colophon">
        <p class="kicker">Colophon</p>
        <p>Set in Archivo, Instrument Serif and JetBrains Mono. Written in Markdown, built without a framework, no tracking. This page weighs <span class="weight">${WEIGHT_TOKEN}</span> before fonts. Updated ${formatDay(ctx.buildDate)}.</p>
        <p><a class="to-terminal" href="/">› Open the terminal</a></p>
      </footer>`;
}

/** The /about page. */
export function aboutPage(ctx) {
  const { site } = ctx.timeline;
  const body = `      <header class="masthead">
        <h1 class="name">${esc(site.name)}</h1>
        ${site.dek ? `<p class="dek">${esc(site.dek)}${draftTag(site, ctx)}</p>` : ""}
        ${site.intro ? `<div class="prose intro">${md(site.intro, ctx, "site.intro")}</div>` : ""}
      </header>
${timelineSection(ctx)}
${colophon(ctx)}`;
  return shell({
    title: `${site.name} — notebook`,
    description: site.description || site.dek || site.name,
    path: "/about/",
    body,
    ctx,
    runhead: "rvs23.dev",
  });
}

/**
 * Links written relative to a note's source file: another published source
 * becomes its note URL, any other repo path points at GitHub.
 */
function noteLinkResolver(note, notes) {
  if (!note.source) return undefined;
  const bySource = new Map(notes.filter((n) => n.source).map((n) => [n.source, n]));
  return (url) => {
    if (/^([a-z]+:|#|\/)/i.test(url)) return url;
    const [path, hash = ""] = url.split("#");
    const target = posix.normalize(posix.join(posix.dirname(note.source), path));
    const other = bySource.get(target);
    if (other) return `/about/${other.slug}/${hash ? `#${hash}` : ""}`;
    return `${REPO_URL}/${target}${hash ? `#${hash}` : ""}`;
  };
}

/** A standalone note page at /about/<slug>/. */
export function notePage(note, ctx) {
  const { html } = renderMarkdown(note.body, {
    file: `notes/${note.file}`,
    figuresDir: ctx.figuresDir,
    resolveLink: noteLinkResolver(note, ctx.notes),
  });
  const email = ctx.site.links?.find((l) => l.href.startsWith("mailto:"));
  const body = `      <article class="post">
        <header class="post-head">
          <p class="kicker"><time datetime="${note.date}">${formatDay(note.date)}</time> · Notes${draftTag(note, ctx)}</p>
          <h1 class="post-title">${esc(note.title)}</h1>
          <p class="dek">${esc(note.summary)}</p>
        </header>
        <div class="prose">${html}</div>
        <footer class="post-foot">
          ${email ? `<p>Replies → <a href="${esc(email.href)}">email</a></p>` : ""}
          <p><a href="/about/#timeline">← Back to the timeline</a></p>
        </footer>
      </article>`;
  return shell({
    title: `${note.title} — ${ctx.site.name}`,
    description: note.summary,
    path: `/about/${note.slug}/`,
    body,
    ctx,
    runhead: "Notes",
  });
}

/** A pet project's walkthrough at /about/<slug>/. */
export function projectPage(project, ctx) {
  const entry = ctx.timeline.entries.find((e) => e.walkthrough === `/about/${project.slug}/`);
  const { html } = renderMarkdown(project.body, { file: `projects/${project.file}`, figuresDir: ctx.figuresDir });
  const links = [
    entry?.repo && { label: "Code", href: entry.repo },
    { label: "Back to the timeline", href: `/about/#${entry?.id ?? "timeline"}` },
  ].filter(Boolean);
  const body = `      <article class="post">
        <header class="post-head">
          <p class="kicker">Pet project · ${esc(entry ? when(entry) : "")}${draftTag(project, ctx)}</p>
          <h1 class="post-title">${esc(project.title)}</h1>
          <p class="dek">${esc(project.summary)}</p>
          ${skillsHtml(entry?.skills, "skills-inline")}
        </header>
        <div class="prose">${html}</div>
        <footer class="post-foot">${linksHtml(links)}</footer>
      </article>`;
  return shell({
    title: `${project.title} — ${ctx.site.name}`,
    description: project.summary,
    path: `/about/${project.slug}/`,
    body,
    ctx,
    runhead: "Pet project",
  });
}

/** RSS 2.0 over the published notes. */
export function feedXml(notes, ctx) {
  const x = (s) => esc(s).replace(/'/g, "&apos;");
  const items = notes
    .map((n) => {
      const link = n.inline ? `${SITE_URL}/about/#note-${n.slug}` : `${SITE_URL}/about/${n.slug}/`;
      return `  <item>
    <title>${x(n.title)}</title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${new Date(`${n.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${x(n.summary)}</description>
  </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${x(ctx.site.name)} — notes</title>
  <link>${SITE_URL}/about/</link>
  <description>${x(ctx.site.dek || "Notes")}</description>
${items}
</channel>
</rss>
`;
}

export function sitemapXml(notes, projects = []) {
  const urls = [
    "/",
    "/about/",
    ...projects.map((p) => `/about/${p.slug}/`),
    ...notes.filter((n) => !n.inline).map((n) => `/about/${n.slug}/`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
</urlset>
`;
}
