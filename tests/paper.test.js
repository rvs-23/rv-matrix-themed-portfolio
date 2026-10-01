/**
 * @file tests/paper.test.js
 * The paper site's build contract: the Markdown dialect fails loudly, content
 * validates, the release modes hold, and every internal link on the rendered
 * pages lands somewhere real.
 */

import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { renderMarkdown, MarkdownError } from "../paper/markdown.js";
import { parseLinearFlowchart } from "../paper/figures.js";
import { loadContent, validateTimeline, parseNote, listDrafts } from "../paper/content.js";
import { aboutPage, notePage, projectPage, feedXml, sitemapXml } from "../paper/templates.js";
import { resolveMode, generate, terminalIndex } from "../paper/vite-plugin.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const contentDir = join(root, "content");
const figuresDir = join(contentDir, "figures");
const md = (src) => renderMarkdown(src, { file: "t.md", figuresDir }).html;

describe("markdown dialect", () => {
  it("renders margin notes, callouts and small caps", () => {
    const html = md(':::margin{label="RAG"}\nLooks things up.\n:::\n\n:::tip\nHi.\n:::\n\nA [b]{.smallcaps} c.');
    expect(html).toContain('<aside class="margin-note"><p class="margin-term">RAG</p>');
    expect(html).toContain('class="callout callout-tip"');
    expect(html).toContain('<span class="sc">b</span>');
  });

  it("inlines a figure and numbers it", () => {
    const html = md("![Retrieve, then answer.](figures/boundary.svg)");
    expect(html).toMatch(/<figure class="fig"><div class="fig-art" style="--fig-w:\d+px"><svg/);
    expect(html).toContain('<span class="fig-no">Fig. 1</span> — Retrieve, then answer.');
  });

  it("leaves prose colons alone", () => {
    expect(md("a ratio of a:b and 10:30")).toContain("a ratio of a:b and 10:30");
  });

  it.each([
    ["raw HTML", "<b>x</b>"],
    ["an unknown block", ":::nope\nx\n:::"],
    ["a remote image", "![x](https://example.com/a.svg)"],
    ["an image escaping figures/", "![x](../secret.svg)"],
    ["a missing figure", "![x](figures/nope.svg)"],
    ["an inline image", "text ![x](figures/boundary.svg) text"],
    ["a branching mermaid chart", "```mermaid\nflowchart LR\n  A --> B\n  A --> C\n```"],
  ])("rejects %s with file and line", (_what, src) => {
    expect(() => md(src)).toThrow(MarkdownError);
    expect(() => md(src)).toThrow(/^t\.md:\d+ — /);
  });
});

describe("mermaid flowcharts", () => {
  it("parses a linear chain, labels and caption", () => {
    const chart = parseLinearFlowchart("flowchart LR\n  %% caption: Hi\n  A[One] --> B[Two]\n  B --> C[Three]");
    expect(chart.steps.map((s) => s.label)).toEqual(["One", "Two", "Three"]);
    expect(chart.loop).toBe(false);
    expect(chart.caption).toBe("Hi");
  });

  it("recognises a loop back to the start", () => {
    expect(parseLinearFlowchart("flowchart TD\n A --> B\n B --> C\n C --> A").loop).toBe(true);
  });

  it("rejects a loop into the middle", () => {
    expect(() => parseLinearFlowchart("flowchart TD\n A --> B\n B --> C\n C --> B")).toThrow();
  });
});

describe("content", () => {
  it("the repo's content validates", () => {
    expect(() => loadContent(contentDir)).not.toThrow();
  });

  it("collects every timeline problem at once", () => {
    const bad = { site: {}, entries: [{ id: "Bad Id", kind: "job", start: "May", walkthrough: "/x" }] };
    let message = "";
    try {
      validateTimeline(bad);
    } catch (err) {
      message = err.message;
    }
    for (const part of ["site.name", "entries[0].id", "entries[0].kind", "entries[0].start", "entries[0].label", "entries[0].summary", "entries[0].walkthrough"]) {
      expect(message).toContain(part);
    }
  });

  it("rejects a logo that isn't in content/logos", () => {
    const data = JSON.parse(JSON.stringify(loadContent(contentDir).timeline));
    data.entries[0].logo = "nope.svg";
    expect(() => validateTimeline(data, contentDir)).toThrow(/logo 'nope\.svg'/);
  });

  it("rejects an entry whose on-site walkthrough has no page", () => {
    const data = JSON.parse(JSON.stringify(loadContent(contentDir).timeline));
    const dir = mkdtempSync(join(tmpdir(), "content-"));
    data.entries[0].walkthrough = "/missing/";
    writeFileSync(join(dir, "timeline.json"), JSON.stringify(data));
    symlinkSync(join(contentDir, "logos"), join(dir, "logos"));
    symlinkSync(join(contentDir, "figures"), join(dir, "figures"));
    expect(() => loadContent(dir)).toThrow(/no content\/projects page for \/missing\//);
  });

  it("rejects a note whose date disagrees with its filename", () => {
    const raw = "---\ntitle: T\ndate: 2026-01-02\nsummary: S\n---\nBody";
    expect(() => parseNote("2026-01-01-t.md", raw, root)).toThrow(/match the filename/);
  });

  it("borrows a note body from its source file, dropping the H1", () => {
    const raw = "---\ntitle: T\ndate: 2026-01-01\nsummary: S\nsource: docs/primer/01-the-page-and-its-skin.md\n---\n";
    const note = parseNote("2026-01-01-t.md", raw, root);
    expect(note.body.startsWith("# ")).toBe(false);
    expect(note.body.length).toBeGreaterThan(1000);
  });

  it("refuses a source outside the repo", () => {
    const raw = "---\ntitle: T\ndate: 2026-01-01\nsummary: S\nsource: ../../etc/hosts\n---\n";
    expect(() => parseNote("2026-01-01-t.md", raw, root)).toThrow(/inside the repo/);
  });
});

describe("content rules added after review", () => {
  const base = () => ({
    site: { name: "N" },
    entries: [{ id: "a", kind: "work", start: "2024-03", label: "L", title: "T", summary: "S" }],
  });
  const fails = (edit, re) => {
    const data = base();
    edit(data);
    expect(() => validateTimeline(data, contentDir)).toThrow(re);
  };

  it("rejects impossible months and an end before its start", () => {
    fails((d) => (d.entries[0].start = "2024-13"), /start must be/);
    fails((d) => (d.entries[0].end = "2023"), /end is before its start/);
    const ok = base();
    ok.entries[0].end = "2024"; // a bare year may end a start in that year
    expect(() => validateTimeline(ok, contentDir)).not.toThrow();
  });

  it("rejects ids the page uses, and protocol-relative links", () => {
    fails((d) => (d.entries[0].id = "timeline"), /used by the page itself/);
    fails((d) => (d.site.links = [{ label: "x", href: "//evil.example" }]), /href must be/);
  });

  it("rejects a note dated on a day that doesn't exist", () => {
    const raw = "---\ntitle: T\ndate: \"2026-02-30\"\nsummary: S\n---\nHi.\n";
    expect(() => parseNote("2026-02-30-t.md", raw, root)).toThrow(/real YYYY-MM-DD/);
  });

  it("rejects a Markdown link with a script scheme", () => {
    expect(() => md("[x](javascript:alert(1))")).toThrow(MarkdownError);
    expect(md("[x](/thing/) [y](#a) [z](https://a.example)")).toContain('href="/thing/"');
  });
});

describe("release mode", () => {
  it("is review unless told preview or production", () => {
    expect(resolveMode(undefined)).toBe("review");
    expect(resolveMode("preview")).toBe("preview");
    expect(() => resolveMode("yes")).toThrow(/PAPER_PUBLISH/);
  });

  // A throwaway output dir, so tests never touch a dev server's pages.
  const outDir = () => mkdtempSync(join(tmpdir(), "paper-"));

  it("writes the home page and each note page in preview", () => {
    const dir = outDir();
    const { files } = generate({ root, mode: "preview", outDir: dir });
    expect(files[0]).toBe(join(dir, "index.html"));
    expect(readdirSync(dir)).toContain("index.html");
  });

  it("refuses production while drafts remain, leaving existing pages alone", () => {
    const content = loadContent(contentDir);
    if (listDrafts({ ...content, notes: [] }).length === 0) return; // launched
    const dir = outDir();
    generate({ root, mode: "preview", outDir: dir });
    expect(() => generate({ root, mode: "production", outDir: dir })).toThrow(/drafts remain/);
    expect(readdirSync(dir)).toContain("index.html");
  });
});

describe("a finished site (no drafts)", () => {
  // A small site of its own, so the strict path is tested before launch too.
  const site = mkdtempSync(join(tmpdir(), "paper-site-"));
  mkdirSync(join(site, "content", "notes"), { recursive: true });
  mkdirSync(join(site, "content", "projects"));
  writeFileSync(
    join(site, "content", "timeline.json"),
    JSON.stringify({
      site: { name: "Test <Person>", dek: "Builder" },
      entries: [
        { id: "job", kind: "work", start: "2024-03", end: "present", label: "Org", title: "Role", summary: "Did things.", main: true },
        { id: "thing", kind: "project", start: "2025-01", label: "Pet project", title: "Thing", summary: "A thing.", walkthrough: "/thing/" },
      ],
    }),
  );
  writeFileSync(join(site, "content", "projects", "thing.md"), "---\ntitle: Thing\nsummary: A thing.\n---\nBody.\n");
  writeFileSync(join(site, "content", "notes", "2026-01-02-hello.md"), "---\ntitle: Hello & co\ndate: 2026-01-02\nsummary: First.\n---\nHi.\n");
  writeFileSync(join(site, "content", "notes", "2026-01-03-wip.md"), "---\ntitle: Wip\ndate: 2026-01-03\nsummary: Not yet.\ndraft: true\n---\nHi.\n");

  const build = (mode) => {
    const dir = mkdtempSync(join(tmpdir(), "paper-out-"));
    const result = generate({ root: site, mode, outDir: dir });
    return { dir, result, home: readFileSync(join(dir, "index.html"), "utf8") };
  };

  it("production ships clean pages and leaves draft notes out", () => {
    const { dir, result, home } = build("production");
    expect(home).not.toContain("noindex");
    expect(home).not.toContain("draft-tag");
    expect(home).not.toContain("preview-banner");
    expect(home).toContain("Test &lt;Person&gt;");
    expect(readdirSync(dir).sort()).toEqual(["404.html", "hello", "index.html", "thing"]);
    expect(result.notes.map((n) => n.slug)).toEqual(["hello"]);
  });

  it("review ships everything indexed, with drafts tagged; preview adds noindex", () => {
    const review = build("review");
    expect(review.home).toContain("in review");
    expect(review.home).not.toContain("noindex");
    expect(readdirSync(review.dir)).toContain("wip");
    expect(build("preview").home).toContain('content="noindex"');
  });

  it("the 404 page is never indexed", () => {
    expect(readFileSync(join(build("production").dir, "404.html"), "utf8")).toContain('content="noindex"');
  });

  it("feed, sitemap and the terminal's index list the same pages", () => {
    const { result } = build("production");
    const feed = feedXml(result.notes, { site: result.site });
    expect(feed).toContain("<title>Hello &amp; co</title>");
    expect(feed).toContain("<link>https://rvs23.dev/hello/</link>");
    const sitemap = sitemapXml(result.notes, result.projects);
    expect(sitemap.match(/<loc>/g)).toHaveLength(3);
    expect(sitemap).not.toContain("/matrix/");
    const index = terminalIndex(result.notes, result.projects);
    expect(index.about).toBe("/");
    expect(index.notes[0].url).toBe("/hello/");
    expect(index.projects[0].url).toBe("/thing/");
  });
});

describe("rendered pages", () => {
  const content = loadContent(contentDir);
  const ctx = {
    mode: "preview",
    site: content.timeline.site,
    timeline: content.timeline,
    notes: content.notes,
    projects: content.projects,
    figuresDir,
    buildDate: "2026-01-01",
  };
  const about = aboutPage(ctx);
  const pages = new Map([["/", about]]);
  for (const n of content.notes.filter((n) => !n.inline)) {
    pages.set(`/${n.slug}/`, notePage(n, ctx));
  }
  for (const p of content.projects) {
    pages.set(`/${p.slug}/`, projectPage(p, ctx));
  }

  it("every internal link lands on a page, and every #anchor exists", () => {
    const broken = [];
    for (const [from, html] of pages) {
      // Code samples quote HTML (`href="/css/…"`); only real links count.
      const live = html.replace(/<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>/g, "");
      for (const [, href] of live.matchAll(/href="(\/[^"]*)"/g)) {
        // The terminal is a source page, not a generated one.
        if (/^\/(paper|favicon|feed\.xml|matrix\/$)/.test(href)) continue;
        const [path, anchor] = href.split("#");
        const target = pages.get(path || from);
        if (!target) broken.push(`${from} → ${href}`);
        else if (anchor && !target.includes(`id="${anchor}"`)) broken.push(`${from} → ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("labels drafts in preview and marks the page noindex", () => {
    expect(about).toContain('<meta name="robots" content="noindex" />');
    expect(about).toContain('class="draft-tag"');
  });

  it("every entry and note is on the timeline", () => {
    for (const e of content.timeline.entries) expect(about).toContain(`id="${e.id}"`);
    for (const n of content.notes) expect(about).toContain(`id="note-${n.slug}"`);
  });

  it("carries no Matrix styling or scripts", () => {
    expect(about).not.toMatch(/style\.css|themes\.css|main\.js|matrix-canvas/);
  });
});

describe("terminal commands for the paper site", async () => {
  const { default: about } = await import("../js/commands/about.js");
  const { default: notes } = await import("../js/commands/notes.js");
  const run = (cmd, paper) => {
    const out = [];
    cmd([], { appendToTerminal: (h) => out.push(h), paper });
    return out.join("");
  };

  it("say 'not yet' when the build didn't publish", () => {
    expect(run(about, null)).toContain("isn't published yet");
    expect(run(notes, null)).toContain("No notes published yet");
  });

  it("link to the page and escape note fields", () => {
    const paper = { about: "/", notes: [{ title: "<b>x</b>", date: "2026-01-01", summary: "s", url: "/x/" }] };
    expect(run(about, paper)).toContain('href="/"');
    const html = run(notes, paper);
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });
});

describe("timeline rows", async () => {
  const { yearRows } = await import("../paper/timeview.js");
  const rows = yearRows([
    { id: "tutor", kind: "work", start: "2020-11", end: "2021-12" },
    { id: "job-now", kind: "work", start: "2025-08", end: "present" },
    { id: "masters", kind: "study", start: "2020-08", end: "2022-05" },
    { id: "side", kind: "project", start: "2021-05" },
    { id: "course", kind: "learn", start: "2020" },
  ]);
  const ids = (row, n) => row.columns[n].items.map((e) => e.id);

  it("has a row per year that has something, newest first", () => {
    expect(rows.map((r) => r.year)).toEqual(["2025", "2021", "2020"]);
  });

  it("puts work on the left and projects, study and learning on the right", () => {
    expect(ids(rows[0], 0)).toEqual(["job-now"]);
    expect(ids(rows[1], 1)).toEqual(["side"]);
    expect(ids(rows[2], 0)).toEqual(["tutor"]);
  });

  it("orders a year's items newest first; a bare year counts as January", () => {
    expect(ids(rows[2], 1)).toEqual(["masters", "course"]);
  });

  it("keeps an empty column, so the row still has two sides", () => {
    expect(ids(rows[0], 1)).toEqual([]);
  });
});
