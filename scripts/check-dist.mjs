/**
 * @file scripts/check-dist.mjs
 * Post-build check (npm postbuild): dist/ matches the release gate. With
 * PAPER_PUBLISH unset nothing of the paper site may ship and / redirects to
 * the terminal; with it set, the home page and every listed page exist, no
 * page is orphaned, and the terminal is intact at /matrix/.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
const has = (p) => existsSync(new URL(p, dist));
const read = (p) => readFileSync(new URL(p, dist), "utf8");
const errors = [];
const expect = (cond, msg) => cond || errors.push(msg);

expect(read("matrix/index.html").includes('id="matrix-canvas"'), "the terminal (matrix/index.html) is missing its canvas");
const redirectsHome = /^\/\s+\/matrix\/\s+302$/m.test(read("_redirects"));

if (!process.env.PAPER_PUBLISH) {
  expect(redirectsHome, "PAPER_PUBLISH is unset but / does not redirect to /matrix/");
  for (const p of ["index.html", "feed.xml", "sitemap.xml", "config/content/paper.json"]) {
    expect(!has(p), `PAPER_PUBLISH is unset but dist/${p} exists`);
  }
} else {
  const index = JSON.parse(read("config/content/paper.json"));
  const pages = [...index.notes, ...(index.projects ?? [])]
    .filter((n) => !n.url.includes("#"))
    .map((n) => n.url);
  for (const url of pages) expect(has(`.${url}index.html`), `note page missing: ${url}`);
  const built = readdirSync(dist, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "matrix" && has(`${d.name}/index.html`))
    .map((d) => `/${d.name}/`);
  for (const url of built) expect(pages.includes(url), `orphan page: ${url}`);
  expect(!redirectsHome, "the paper site is published but / still redirects to /matrix/");
  expect(read("index.html").includes('id="timeline"'), "the home page is missing its timeline");
  expect(/^<\?xml[\s\S]*<rss version="2\.0">[\s\S]*<\/rss>\s*$/.test(read("feed.xml")), "feed.xml is not RSS");
  expect(!read("index.html").includes("__PAPER_"), "an unreplaced build token remains");
  if (process.env.PAPER_PUBLISH === "production") expect(has("sitemap.xml"), "sitemap.xml missing");
}

if (errors.length) {
  console.error(`check-dist failed:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
process.stdout.write(`check-dist ok (PAPER_PUBLISH=${process.env.PAPER_PUBLISH || "unset"})\n`);
