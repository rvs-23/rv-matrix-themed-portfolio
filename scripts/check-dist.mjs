/**
 * @file scripts/check-dist.mjs
 * Post-build check (npm postbuild): dist/ is a whole site. The home page and
 * every listed page exist, no page is orphaned, the feed is valid, and the
 * terminal is intact at /matrix/.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
const mode = process.env.PAPER_PUBLISH || "review";
const has = (p) => existsSync(new URL(p, dist));
const read = (p) => readFileSync(new URL(p, dist), "utf8");
const errors = [];
const expect = (cond, msg) => cond || errors.push(msg);

expect(read("matrix/index.html").includes('id="matrix-canvas"'), "the terminal (matrix/index.html) is missing its canvas");

const home = read("index.html");
expect(home.includes('id="timeline"'), "the home page is missing its timeline");
expect(!home.includes("__PAPER_"), "an unreplaced build token remains");
expect(home.includes('name="robots" content="noindex"') === (mode === "preview"), "noindex must be set in preview, and only there");
if (mode === "production") expect(!home.includes('class="draft-tag"'), "a draft shipped in a production build");

const index = JSON.parse(read("config/content/paper.json"));
const pages = [...index.notes, ...(index.projects ?? [])].filter((n) => !n.url.includes("#")).map((n) => n.url);
for (const url of pages) expect(has(`.${url}index.html`), `page missing: ${url}`);
const built = readdirSync(dist, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "matrix" && has(`${d.name}/index.html`))
  .map((d) => `/${d.name}/`);
for (const url of built) expect(pages.includes(url), `orphan page: ${url}`);

expect(/^<\?xml[\s\S]*<rss version="2\.0">[\s\S]*<\/rss>\s*$/.test(read("feed.xml")), "feed.xml is not RSS");
expect(has("sitemap.xml") === (mode !== "preview"), "sitemap.xml must ship, except in preview");
expect(/^\/recruiter\s+\/\s+301$/m.test(read("_redirects")), "_redirects lost the /recruiter rule");

if (errors.length) {
  console.error(`check-dist failed:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
process.stdout.write(`check-dist ok (${mode})\n`);
