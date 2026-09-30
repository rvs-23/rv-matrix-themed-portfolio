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
const PLATE = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

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

function sectionOpen(id, no, title, extra = "") {
  return `      <section class="sec" id="${id}" data-title="${esc(title)}">
        <header class="sec-head">
          <span class="sec-no" aria-hidden="true">${String(no).padStart(2, "0")}</span>
          <h2 class="kicker">${esc(title)}${extra}</h2>
        </header>`;
}

const folio = (i) => `        <p class="folio" aria-hidden="true">— ${ROMAN[i]} —</p>\n      </section>`;

function workSection(work, ctx, figNo) {
  const years = work.map((e) => Number(year(e.start)));
  const span = years.length ? ` <span class="kicker-span">${Math.min(...years)} — now</span>` : "";
  const items = work.map((e) => {
    const end = dateSpan(e.start, e.end);
    const notes = (e.notes || [])
      .map((n) => `<aside class="margin-note"><p class="margin-term">${esc(n.term)}</p><p>${esc(n.text)}</p></aside>`)
      .join("");
    const fig = e.figure ? figureHtml(e.figure, `Fig. ${++figNo.n}`, ctx) : "";
    return `          <li class="entry" id="${esc(e.id)}">
            <p class="entry-date"><time datetime="${esc(e.start)}">${year(e.start)}</time>${end ? `<span class="entry-end">→ ${end}</span>` : ""}</p>
            <div class="entry-main">
              <p class="kicker">${esc(e.label)}${draftTag(e, ctx)}</p>
              <h3 class="entry-title">${renderInline(e.title, { file: `work.${e.id}`, figuresDir: ctx.figuresDir })}</h3>
              <div class="prose">${md(e.body, ctx, `work.${e.id}`)}</div>
              ${fig}
              ${linksHtml(e.links)}
            </div>
            <div class="entry-rail">${notes}</div>
          </li>`;
  });
  return `${sectionOpen("work", 1, "Work", span)}
        <ol class="timeline">
${items.join("\n")}
        </ol>
${folio(0)}`;
}

function platesSection(plates, ctx) {
  const items = plates.map((p, i) => {
    const fig = p.figure ? figureHtml(p.figure, `Plate ${PLATE[i]}`, ctx) : "";
    return `          <article class="plate" id="${esc(p.id)}">
            ${fig}
            <h3 class="plate-title">${renderInline(p.title, { file: `plates.${p.id}`, figuresDir: ctx.figuresDir })}${draftTag(p, ctx)}</h3>
            <div class="prose">${md(p.body, ctx, `plates.${p.id}`)}</div>
            ${linksHtml(p.links)}
          </article>`;
  });
  return `${sectionOpen("plates", 2, "Plates", ` <span class="kicker-span">things built</span>`)}
        <div class="plates">
${items.join("\n")}
        </div>
${folio(1)}`;
}

function notesSection(notes, ctx) {
  const items = notes.map((n) => {
    const date = `<time class="note-date" datetime="${n.date}">${formatDay(n.date)}</time>`;
    if (n.inline) {
      return `          <li class="note" id="note-${n.slug}">${date}
            <details class="note-inline"><summary><span class="note-title">${esc(n.title)}</span>${draftTag(n, ctx)}<span class="note-summary">${esc(n.summary)}</span></summary>
              <div class="prose">${md(n.body, ctx, `notes/${n.file}`)}</div>
            </details>
          </li>`;
    }
    return `          <li class="note" id="note-${n.slug}">${date}
            <p><a class="note-title" href="/about/${n.slug}/">${esc(n.title)}</a>${draftTag(n, ctx)}<span class="note-summary">${esc(n.summary)}</span></p>
          </li>`;
  });
  const body = items.length
    ? `        <ol class="notes">\n${items.join("\n")}\n        </ol>`
    : `        <p class="empty">Nothing yet.</p>`;
  return `${sectionOpen("notes", 3, "Notes", ` <span class="kicker-span"><a href="/feed.xml">rss</a></span>`)}
${body}
${folio(2)}`;
}

function learnSection(learn, ctx) {
  const items = learn.map(
    (q) => `          <div class="learn-item">
            <dt>${esc(q.question)}</dt>
            <dd><div class="prose">${md(q.answer, ctx, "learn")}</div>${linksHtml(q.links)}</dd>
          </div>`,
  );
  return `${sectionOpen("learn", 4, "Learn", ` <span class="kicker-span">start here</span>`)}
        <dl class="learn">
${items.join("\n")}
        </dl>
${folio(3)}`;
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
  const { site, work, plates, learn } = ctx.timeline;
  const figNo = { n: 0 };
  const intro = md(site.intro, ctx, "site.intro");
  const now = site.now
    ? `<p class="now"><span class="kicker">Now</span> ${renderInline(site.now, { file: "site.now", figuresDir: ctx.figuresDir })}</p>`
    : "";
  const body = `      <header class="masthead">
        <p class="kicker">Notebook${draftTag(site, ctx)}</p>
        <h1 class="name">${esc(site.name)}</h1>
        ${site.dek ? `<p class="dek">${esc(site.dek)}</p>` : ""}
        <div class="prose intro">${intro}</div>
        ${now}
        ${linksHtml(site.links, "links elsewhere")}
      </header>
${workSection(work, ctx, figNo)}
${platesSection(plates, ctx)}
${notesSection(ctx.notes, ctx)}
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
          <p><a href="/about/#notes">← All notes</a></p>
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
