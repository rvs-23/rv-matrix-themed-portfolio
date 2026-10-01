/**
 * @file paper/vite-plugin.js
 * Builds the paper site (the home page, walkthroughs, notes) inside the normal
 * Vite build, so a local build and a Cloudflare build are the same command.
 * The Matrix terminal is a plain source page at /matrix/.
 *
 * Release gate — PAPER_PUBLISH:
 *   unset        → build nothing; / redirects to /matrix/ (until launch)
 *   "preview"    → drafts shown and labelled, pages noindex (Cloudflare Preview)
 *   "production" → drafts in timeline.json fail the build; draft notes skipped
 * The dev server always runs as "preview".
 *
 * Generated HTML is written to <root>/.paper/ (gitignored), wiped on every
 * run so a deleted note can't leave a stale page behind. Vite names an HTML
 * entry's output after its path under the root, so the bundle step moves each
 * page up to the site root, and the dev server maps URLs the same way.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const OUT = ".paper";
import { gzipSync } from "node:zlib";
import { loadContent, listDrafts } from "./content.js";
import {
  aboutPage,
  notePage,
  projectPage,
  feedXml,
  sitemapXml,
  WEIGHT_TOKEN,
  SITE_URL,
} from "./templates.js";

const MODES = new Set(["preview", "production"]);

export function resolveMode(command, value = process.env.PAPER_PUBLISH) {
  if (value && !MODES.has(value)) {
    throw new Error(`PAPER_PUBLISH must be "preview" or "production", got "${value}"`);
  }
  if (command === "serve") return value === "production" ? "production" : "preview";
  return value || "off";
}

/**
 * Render every page to disk. Returns the generated file paths plus the data
 * the bundle step needs (feed, terminal index).
 */
export function generate({
  root,
  mode,
  dev = false,
  buildDate = new Date(),
  outDir = join(root, OUT),
}) {
  if (mode === "off") {
    rmSync(outDir, { recursive: true, force: true });
    return { files: [], notes: [], projects: [], site: null };
  }

  // Validate before touching disk: a failed run leaves the last pages intact.
  const content = loadContent(join(root, "content"));
  if (mode === "production") {
    // Draft notes are simply left out of production; anything else blocks it.
    const drafts = listDrafts({ ...content, notes: [] });
    if (drafts.length) {
      throw new Error(`PAPER_PUBLISH=production but drafts remain: ${drafts.join(", ")}`);
    }
  }
  rmSync(outDir, { recursive: true, force: true });
  const notes =
    mode === "production" ? content.notes.filter((n) => !n.draft) : content.notes;
  const ctx = {
    mode,
    site: content.timeline.site,
    timeline: content.timeline,
    notes,
    projects: content.projects,
    figuresDir: join(root, "content", "figures"),
    buildDate: buildDate.toISOString().slice(0, 10),
  };

  const pages = [[join(outDir, "index.html"), aboutPage(ctx)]];
  for (const note of notes.filter((n) => !n.inline)) {
    pages.push([join(outDir, note.slug, "index.html"), notePage(note, ctx)]);
  }
  for (const project of content.projects) {
    pages.push([join(outDir, project.slug, "index.html"), projectPage(project, ctx)]);
  }
  for (const [file, html] of pages) {
    mkdirSync(dirname(file), { recursive: true });
    // The page weight is only known after bundling; dev shows a dash.
    writeFileSync(file, dev ? html.replace(WEIGHT_TOKEN, "—") : html);
  }
  return { files: pages.map(([f]) => f), notes, projects: content.projects, site: ctx.site };
}

/** The small index the terminal's `about` / `notes` commands read. */
export function terminalIndex(notes, projects = []) {
  return {
    about: "/",
    projects: projects.map((p) => ({ title: p.title, summary: p.summary, url: `/${p.slug}/` })),
    notes: notes.map((n) => ({
      title: n.title,
      date: n.date,
      summary: n.summary,
      url: n.inline ? `/#note-${n.slug}` : `/${n.slug}/`,
    })),
  };
}

/**
 * Cloudflare's _redirects. Retired recruiter paths go home (hash and query
 * variants: js/legacyLinks.js); until the paper site is published, home is
 * the terminal.
 */
export function redirects(mode) {
  const lines = ["/recruiter   /   301", "/recruiter/  /   301"];
  if (mode === "off") lines.push("/            /matrix/   302");
  return `${lines.join("\n")}\n`;
}

export default function paperPlugin() {
  let root;
  let mode;
  let command;
  let result = { files: [], notes: [], projects: [], site: null };

  return {
    name: "paper",
    enforce: "post",

    config(config, env) {
      root = config.root || process.cwd();
      command = env.command;
      mode = resolveMode(command);
      result = generate({ root, mode, dev: command === "serve" });
      if (command !== "build") return;
      const input = { matrix: join(root, "matrix", "index.html") };
      for (const file of result.files) {
        input[relative(join(root, OUT), dirname(file)) || "home"] = file;
      }
      return { build: { rollupOptions: { input } } };
    },

    configureServer(server) {
      const regenerate = (file) => {
        if (!file.includes(`${root}/content/`) && !file.includes(`${root}/paper/`)) return;
        try {
          result = generate({ root, mode, dev: true });
          server.ws.send({ type: "full-reload" });
        } catch (err) {
          server.config.logger.error(`[paper] ${err.message}`);
        }
      };
      server.watcher.add(join(root, "content"));
      server.watcher.on("change", regenerate);
      server.watcher.on("add", regenerate);
      server.watcher.on("unlink", regenerate);

      // Pages are served from the site root; build-only artefacts are served live.
      server.middlewares.use((req, res, next) => {
        const [path, query] = req.url.split("?");
        if (!existsSync(join(root, OUT, "index.html"))) {
          result = generate({ root, mode, dev: true });
        }
        if (path.endsWith("/") && existsSync(join(root, OUT, path, "index.html"))) {
          req.url = `/${OUT}${path}index.html${query ? `?${query}` : ""}`;
        }
        if (path === "/feed.xml") {
          res.setHeader("Content-Type", "application/rss+xml");
          return res.end(feedXml(result.notes, { site: result.site }));
        }
        if (path === "/config/content/paper.json") {
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify(terminalIndex(result.notes, result.projects)));
        }
        next();
      });
    },

    generateBundle(_options, bundle) {
      if (command !== "build") return;
      const emit = (fileName, source) => this.emitFile({ type: "asset", fileName, source });
      emit("_redirects", redirects(mode));
      if (mode === "off") return;
      emit("feed.xml", feedXml(result.notes, { site: result.site }));
      emit("config/content/paper.json", JSON.stringify(terminalIndex(result.notes, result.projects)));
      if (mode === "production") emit("sitemap.xml", sitemapXml(result.notes, result.projects));

      // Fill in each page's real weight: gzipped HTML + the CSS/JS it loads.
      for (const [key, asset] of Object.entries(bundle)) {
        if (!key.startsWith(`${OUT}/`) || !key.endsWith(".html")) continue;
        // Move the page from .paper/ up to the site root.
        delete bundle[key];
        asset.fileName = key.slice(OUT.length + 1);
        bundle[asset.fileName] = asset;
        const html = String(asset.source);
        let bytes = gzipSync(html).length;
        for (const [, ref] of html.matchAll(/(?:href|src)="\/(assets\/[^"]+\.(?:css|js))"/g)) {
          const dep = bundle[ref];
          if (dep) bytes += gzipSync(dep.type === "chunk" ? dep.code : String(dep.source)).length;
        }
        asset.source = html.replace(WEIGHT_TOKEN, `${Math.max(1, Math.round(bytes / 1024))} KB`);
      }
    },
  };
}

export { SITE_URL };
