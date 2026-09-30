/**
 * @file paper/templates.js
 * HTML for /about, each note page, the RSS feed and the sitemap. Plain
 * template strings: every content string is either escaped here or comes out
 * of renderMarkdown (which rejects raw HTML).
 */

import { renderMarkdown, renderInline, loadFigureSvg } from "./markdown.js";
import { posix } from "node:path";
import { dataFigureSvg, figureStyle } from "./figures.js";

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

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

const year = (d) => d.slice(0, 4);

/** "2024" / "2022 – now" style span for an entry. */
function dateSpan(start, end) {
  if (!end) return "";
  if (end === "present") return "now";
  return year(end) === year(start) ? "" : year(end);
}

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

function figureHtml(fig, label, ctx) {
  const svg = fig.type ? dataFigureSvg(fig) : loadFigureSvg(ctx.figuresDir, fig.src, "timeline.json");
  return (
    `<figure class="fig"><div class="fig-art" style="${figureStyle(svg)}">${svg}</div>` +
    `<figcaption><span class="fig-no">${label}</span> — ${esc(fig.caption)}</figcaption></figure>`
  );
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
    <link rel="icon" href="/favicon/rv-matrix-style-favicon-1.png" type="image/png" />
    <link rel="stylesheet" href="/paper/paper.css" />
    <script type="module" src="/paper/paper.js"></script>
  </head>
  <body class="paper">
    <a class="skip" href="#main">Skip to content</a>
    ${banner}
    <header class="runhead">
      <a class="runhead-name" href="/about/">${esc(ctx.site.name)}</a>
      <span class="runhead-sec" data-runhead>${esc(runhead)}</span>
    </header>
    <main id="main">
${body}
    </main>
  </body>
</html>
`;
}

/**
 * Page layout, after the Diátaxis "start here" page and Cornell notes: a wide
 * right-aligned cue column (headings, years, labels) beside the body column.
 * On the timeline the two are joined by a spine whose node shape says what
 * kind of entry it is.
 */
const KINDS = {
  work: { mark: "○", label: "work & study" },
  built: { mark: "□", label: "built" },
  wrote: { mark: "●", label: "wrote" },
};

/** Cornell close: folio numeral in the cue column, "In short" beside it. */
function sectionClose(id, no, ctx) {
  const summary = ctx.site.sections?.[id];
  return `        <p class="sec-summary"><span class="cue"><span class="folio" aria-hidden="true">${ROMAN[no - 1]}</span></span>${
    summary ? `<span class="sec-summary-text"><span class="kicker">In short</span> ${esc(summary)}</span>` : ""
  }</p>
      </section>`;
}

/** First sentence of a Markdown body, as plain text — the fallback summary. */
function firstSentence(markdown) {
  const text = markdown.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");
  return (/^.+?[.!?](\s|$)/.exec(text)?.[0] ?? text).trim();
}

/** Sort key: "2024" sorts as the start of its year, "2024-10" as October. */
const sortKey = (d) => (d.length === 4 ? `${d}-00` : d);

/**
 * Every dated thing on one spine, newest first: timeline.json entries plus
 * the notes (as kind "wrote"). The year prints once per year; later entries
 * in the same year show only their month.
 */
function timelineItems(ctx) {
  const notes = ctx.notes.map((n) => ({
    id: `note-${n.slug}`,
    kind: "wrote",
    start: n.date.slice(0, 7),
    label: n.source ? "Primer" : "Note",
    title: n.title,
    summary: n.summary,
    draft: n.draft,
    note: n,
  }));
  return [...ctx.timeline.entries, ...notes].sort((a, b) =>
    sortKey(b.start).localeCompare(sortKey(a.start)),
  );
}

function entryHtml(e, prevYear, ctx, figNo) {
  const y = year(e.start);
  const month = e.start.length > 4 ? MONTHS[Number(e.start.slice(5, 7)) - 1] : "";
  const end = e.end ? dateSpan(e.start, e.end) : "";
  const when = [month, end && `→ ${end}`].filter(Boolean).join(" ");
  const cue = `<div class="cue entry-cue">
              ${y !== prevYear ? `<time class="entry-year" datetime="${esc(e.start)}">${y}</time>` : ""}
              <span class="entry-when">${esc(when)}</span>
              <span class="kicker">${esc(e.label)}</span>
            </div>`;
  const title = renderInline(e.title, { file: `entries.${e.id}`, figuresDir: ctx.figuresDir });
  const head = `<span class="entry-title" role="heading" aria-level="3">${title}</span>${draftTag(e, ctx)}`;

  // A long note is its own page: the row links there instead of opening.
  if (e.kind === "wrote" && !e.note.inline) {
    return `          <li class="entry kind-wrote" id="${esc(e.id)}">
            ${cue}
            <div class="entry-main">
              <a class="entry-link" href="/about/${e.note.slug}/">${head}</a>
              <span class="entry-summary">${esc(e.summary)}</span>
            </div>
          </li>`;
  }

  const body = e.kind === "wrote" ? e.note.body : e.body;
  const fig = e.figure ? figureHtml(e.figure, `Fig. ${++figNo.n}`, ctx) : "";
  const more = fig ? `the idea, in Fig. ${figNo.n}` : "more";
  const notes = (e.notes || [])
    .map((n) => `<aside class="margin-note"><p class="margin-term">${esc(n.term)}</p><p>${esc(n.text)}</p></aside>`)
    .join("");
  return `          <li class="entry kind-${e.kind}" id="${esc(e.id)}">
            ${cue}
            <details class="entry-main">
              <summary>
                ${head}
                <span class="entry-summary">${esc(e.summary || firstSentence(body))} <span class="more">${more}</span></span>
              </summary>
              <div class="prose">${md(body, ctx, `entries.${e.id}`)}</div>
              ${fig}
              ${notes ? `<div class="entry-notes">${notes}</div>` : ""}
              ${linksHtml(e.links)}
            </details>
          </li>`;
}

function timelineSection(ctx) {
  const items = timelineItems(ctx);
  const figNo = { n: 0 };
  let prevYear = "";
  const rows = items.map((e) => {
    const html = entryHtml(e, prevYear, ctx, figNo);
    prevYear = year(e.start);
    return html;
  });
  const years = items.map((e) => Number(year(e.start)));
  const legend = Object.values(KINDS)
    .map((k) => `<li><span class="mark" aria-hidden="true">${k.mark}</span> ${esc(k.label)}</li>`)
    .join("");
  return `      <section class="sec" id="timeline" data-title="Timeline">
        <header class="sec-head">
          <div class="cue">
            <h2 class="sec-title">Timeline</h2>
            <p class="kicker">${Math.min(...years)} — now</p>
            <ul class="legend">${legend}</ul>
            <p class="links sec-feed"><a href="/feed.xml">rss</a> for new notes</p>
          </div>
        </header>
        <ol class="timeline">
${rows.join("\n")}
        </ol>
${sectionClose("timeline", 1, ctx)}`;
}

/** Learn: the question is the cue; the answer opens beneath it. */
function learnSection(learn, ctx) {
  const items = learn.map(
    (q, i) => `          <details class="learn-item" id="learn-${i + 1}">
            <summary>${esc(q.question)}</summary>
            <div class="learn-answer"><div class="prose">${md(q.answer, ctx, "learn")}</div>${linksHtml(q.links)}</div>
          </details>`,
  );
  return `      <section class="sec" id="learn" data-title="Learn">
        <header class="sec-head">
          <div class="cue">
            <h2 class="sec-title">Learn</h2>
            <p class="kicker">start here</p>
          </div>
        </header>
        <div class="learn">
${items.join("\n")}
        </div>
${sectionClose("learn", 2, ctx)}`;
}

function colophon(ctx) {
  return `      <footer class="colophon" id="colophon" data-title="Colophon">
        <p class="cue"><span class="kicker">Colophon</span></p>
        <div class="colophon-body">
          <p>Set in Archivo, Instrument Serif and JetBrains Mono. Written in Markdown, built without a framework, no tracking. This page weighs <span class="weight">${WEIGHT_TOKEN}</span> before fonts. Updated ${formatDay(ctx.buildDate)}.</p>
          <p><a class="to-terminal" href="/">› Open the terminal</a></p>
        </div>
      </footer>`;
}

/** The /about page. */
export function aboutPage(ctx) {
  const { site, learn } = ctx.timeline;
  const intro = md(site.intro, ctx, "site.intro");
  const now = site.now
    ? `<p class="now"><span class="kicker">Now</span> ${renderInline(site.now, { file: "site.now", figuresDir: ctx.figuresDir })}</p>`
    : "";
  const body = `      <header class="masthead">
        <div class="cue">
          <p class="kicker">Notebook${draftTag(site, ctx)}</p>
          ${site.dek ? `<p class="dek">${esc(site.dek)}</p>` : ""}
        </div>
        <div class="masthead-body">
          <h1 class="name">${esc(site.name)}</h1>
          <div class="prose intro">${intro}</div>
          ${now}
          ${linksHtml(site.links, "links elsewhere")}
        </div>
      </header>
${timelineSection(ctx)}
${learnSection(learn, ctx)}
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
          <p><a href="/about/#timeline">← The timeline</a></p>
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

export function sitemapXml(notes) {
  const urls = ["/", "/about/", ...notes.filter((n) => !n.inline).map((n) => `/about/${n.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
</urlset>
`;
}
