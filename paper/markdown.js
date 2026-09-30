/**
 * @file paper/markdown.js
 * Markdown → HTML for the paper site. GFM plus a few `:::` blocks, borrowed
 * loosely from rv-markdown-paper. Strict on purpose: anything that would
 * silently degrade on a public page (raw HTML, unknown blocks, remote images)
 * throws with the file and line instead.
 */

import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";
import { figureStyle, parseLinearFlowchart, pipelineSvg } from "./figures.js";

/** `:::name` blocks and the element + class each becomes. */
const BLOCKS = {
  margin: { tag: "aside", className: "margin-note" },
  note: { tag: "div", className: "callout callout-note" },
  tip: { tag: "div", className: "callout callout-tip" },
  warning: { tag: "div", className: "callout callout-warning" },
  epigraph: { tag: "blockquote", className: "epigraph" },
};

export class MarkdownError extends Error {}

function fail(file, node, message) {
  const line = node?.position?.start?.line;
  throw new MarkdownError(`${file}${line ? `:${line}` : ""} — ${message}`);
}

/** Read and inline an SVG from the figures dir; rejects paths that escape it. */
export function loadFigureSvg(figuresDir, src, file, node) {
  const path = resolve(figuresDir, src.replace(/^figures\//, ""));
  if (relative(figuresDir, path).startsWith("..")) {
    fail(file, node, `figure '${src}' is outside content/figures`);
  }
  if (!path.endsWith(".svg")) fail(file, node, `figure '${src}' must be an .svg`);
  let svg;
  try {
    svg = readFileSync(path, "utf8");
  } catch {
    fail(file, node, `figure '${src}' not found`);
  }
  // Strip the XML prolog/comments so the SVG can sit inline in HTML.
  return svg.replace(/<\?xml[^>]*>\s*/, "").replace(/<!--[\s\S]*?-->/g, "").trim();
}

/** Remark plugin: validate and map the dialect onto plain mdast/hast. */
function paperDialect({ file, figuresDir, figureCounter, resolveLink }) {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type === "html") fail(file, node, "raw HTML is not allowed");

      if (node.type === "link" && resolveLink) node.url = resolveLink(node.url);

      // A linear ```mermaid flowchart becomes one of our own drawn figures.
      if (node.type === "code" && node.lang === "mermaid") {
        let chart;
        try {
          chart = parseLinearFlowchart(node.value);
        } catch (err) {
          fail(file, node, err.message);
        }
        const n = ++figureCounter.n;
        parent.children[index] = figureNode(pipelineSvg(chart), n, chart.caption);
        return SKIP;
      }

      if (node.type === "containerDirective") {
        const block = BLOCKS[node.name];
        if (!block) fail(file, node, `unknown block ':::${node.name}'`);
        const label = node.attributes?.label;
        node.data = {
          hName: block.tag,
          hProperties: { className: block.className.split(" ") },
        };
        // `:::margin{label="RAG"}` → a bold lead-in term.
        if (label) {
          node.children.unshift({
            type: "paragraph",
            data: { hProperties: { className: ["margin-term"] } },
            children: [{ type: "text", value: label }],
          });
        }
        return;
      }

      // `:name` / `::name` outside a real block are almost always prose that
      // happens to contain a colon ("ratio a:b"); put the text back.
      if (node.type === "textDirective" || node.type === "leafDirective") {
        const text = `${node.type === "leafDirective" ? "::" : ":"}${node.name}`;
        parent.children.splice(index, 1, { type: "text", value: text }, ...node.children);
        return [SKIP, index];
      }

      // A paragraph holding only an image is a numbered, inlined figure.
      if (
        node.type === "paragraph" &&
        node.children.length === 1 &&
        node.children[0].type === "image"
      ) {
        const img = node.children[0];
        if (/^[a-z]+:|^\/\/|^\//i.test(img.url)) {
          fail(file, img, `image '${img.url}' must be a local figures/*.svg path`);
        }
        const n = ++figureCounter.n;
        const svg = loadFigureSvg(figuresDir, img.url, file, img);
        parent.children[index] = figureNode(svg, n, img.alt || "");
        return SKIP;
      }
      if (node.type === "image") {
        fail(file, node, "images must stand alone in their own paragraph");
      }

      // `[text]{.smallcaps}` → <span class="sc">. Parsed as literal text.
      if (node.type === "text" && node.value.includes("]{.smallcaps}")) {
        const parts = node.value.split(/\[([^\]]+)\]\{\.smallcaps\}/);
        const out = parts.map((value, i) =>
          i % 2
            ? { type: "emphasis", data: { hName: "span", hProperties: { className: ["sc"] } }, children: [{ type: "text", value }] }
            : { type: "text", value },
        );
        parent.children.splice(index, 1, ...out);
        return [SKIP, index + out.length];
      }
    });
  };
}

/** mdast node that renders as <figure> with the inline SVG and a caption. */
function figureNode(svg, n, caption) {
  return {
    type: "figure",
    data: { hName: "figure", hProperties: { className: ["fig"] } },
    children: [
      { type: "html-svg", data: { hName: "div", hProperties: { className: ["fig-art"] } }, children: [], svg },
      {
        type: "figcaption",
        data: { hName: "figcaption" },
        children: [
          { type: "emphasis", data: { hName: "span", hProperties: { className: ["fig-no"] } }, children: [{ type: "text", value: `Fig. ${n}` }] },
          { type: "text", value: caption ? ` — ${caption}` : "" },
        ],
      },
    ],
  };
}

/**
 * Render Markdown to an HTML string.
 * @param {string} source
 * @param {{ file: string, figuresDir: string, figureStart?: number,
 *   resolveLink?: (url: string) => string }} opts
 * @returns {{ html: string, figures: number }}
 */
export function renderMarkdown(source, { file, figuresDir, figureStart = 0, resolveLink }) {
  const figureCounter = { n: figureStart };
  const svgs = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(paperDialect, { file, figuresDir, figureCounter, resolveLink })
    .use(remarkRehype, {
      // The one sanctioned raw-HTML path: our own inlined SVG figures, swapped
      // in after stringify via a placeholder comment.
      handlers: {
        "html-svg": (_state, node) => {
          svgs.push(node.svg);
          return {
            type: "element",
            tagName: "div",
            properties: { className: ["fig-art"], style: figureStyle(node.svg) },
            children: [{ type: "comment", value: `svg:${svgs.length - 1}` }],
          };
        },
      },
    })
    .use(rehypeStringify);
  const html = String(processor.processSync(source)).replace(
    /<!--svg:(\d+)-->/g,
    (_, i) => svgs[Number(i)],
  );
  return { html, figures: figureCounter.n - figureStart };
}

/** Render a short inline string (titles, captions): no block wrapper. */
export function renderInline(source, opts) {
  const { html } = renderMarkdown(source, opts);
  return html.replace(/^<p>([\s\S]*)<\/p>$/, "$1");
}
