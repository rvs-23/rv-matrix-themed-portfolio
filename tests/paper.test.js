/**
 * @file tests/paper.test.js
 * The paper site's build contract: the Markdown dialect fails loudly, content
 * validates, the release gate holds, and every internal link on the rendered
 * pages lands somewhere real.
 */

import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { renderMarkdown, MarkdownError } from "../paper/markdown.js";
import { parseLinearFlowchart } from "../paper/figures.js";
import { loadContent, validateTimeline, parseNote, listDrafts } from "../paper/content.js";
import { aboutPage, notePage } from "../paper/templates.js";
import { resolveMode, generate } from "../paper/vite-plugin.js";

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
    const html = md("![Retrieve, then answer.](figures/rag.svg)");
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
    ["an inline image", "text ![x](figures/rag.svg) text"],
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
    const bad = { site: {}, work: [{ id: "Bad Id", start: "May" }], plates: [], learn: [] };
    let message = "";
    try {
      validateTimeline(bad);
    } catch (err) {
      message = err.message;
    }
    for (const part of ["site.name", "site.intro", "work[0].id", "work[0].start", "work[0].label"]) {
      expect(message).toContain(part);
    }
  });

  it("rejects a note whose date disagrees with its filename", () => {
    const raw = "---\ntitle: T\ndate: 2026-01-02\nsummary: S\n---\nBody";
    expect(() => parseNote("2026-01-01-t.md", raw, root)).toThrow(/match the filename/);
  });

  it("borrows a note body from its source file, dropping the H1", () => {
    const raw = "---\ntitle: T\ndate: 2026-01-01\nsummary: S\nsource: primer/01-the-page-and-its-skin.md\n---\n";
    const note = parseNote("2026-01-01-t.md", raw, root);
    expect(note.body.startsWith("# ")).toBe(false);
    expect(note.body.length).toBeGreaterThan(1000);
  });

  it("refuses a source outside the repo", () => {
    const raw = "---\ntitle: T\ndate: 2026-01-01\nsummary: S\nsource: ../../etc/hosts\n---\n";
    expect(() => parseNote("2026-01-01-t.md", raw, root)).toThrow(/inside the repo/);
  });
});

describe("release gate", () => {
  it("only accepts preview or production", () => {
    expect(resolveMode("build", undefined)).toBe("off");
    expect(resolveMode("build", "preview")).toBe("preview");
    expect(resolveMode("serve", undefined)).toBe("preview");
    expect(() => resolveMode("build", "yes")).toThrow(/PAPER_PUBLISH/);
  });

  // A throwaway output dir, so tests never touch a dev server's pages.
  const outDir = () => mkdtempSync(join(tmpdir(), "paper-"));

  it("builds nothing when off", () => {
    expect(generate({ root, mode: "off", outDir: outDir() }).files).toEqual([]);
  });

  it("writes /about and each note page in preview", () => {
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

describe("rendered pages", () => {
  const content = loadContent(contentDir);
  const ctx = {
    mode: "preview",
    site: content.timeline.site,
    timeline: content.timeline,
    notes: content.notes,
    figuresDir,
    buildDate: "2026-01-01",
  };
  const about = aboutPage(ctx);
  const pages = new Map([["/about/", about]]);
  for (const n of content.notes.filter((n) => !n.inline)) {
    pages.set(`/about/${n.slug}/`, notePage(n, ctx));
  }

  it("every internal link lands on a page, and every #anchor exists", () => {
    const broken = [];
    for (const [from, html] of pages) {
      // Code samples quote HTML (`href="/css/…"`); only real links count.
      const live = html.replace(/<pre>[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>/g, "");
      for (const [, href] of live.matchAll(/href="(\/[^"]*)"/g)) {
        if (/^\/(paper|favicon|feed\.xml)/.test(href) || href === "/") continue;
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

  it("carries no Matrix styling or scripts", () => {
    expect(about).not.toMatch(/style\.css|themes\.css|main\.js|matrix-canvas/);
  });
});
