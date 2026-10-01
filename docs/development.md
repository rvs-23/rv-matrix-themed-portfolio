# Development

How to set up the repo, run the checks, and ship. The two halves of the site have their own guides: [timeline.md](timeline.md) and [matrix.md](matrix.md).

## Contents

- [Setup](#setup)
- [Commands](#commands)
- [URL map](#url-map)
- [Release modes](#release-modes)
- [Tests](#tests)
- [Deployment](#deployment)
- [Conventions](#conventions)

## Setup

You need Node.js 20 or newer.

```bash
git clone https://github.com/rvs-23/rv-portfolio-matrix.git
cd rv-portfolio-matrix
npm install
npm run dev
```

The dev server serves the timeline at http://localhost:5173/ and the terminal at http://localhost:5173/matrix/.

## Commands

```bash
npm run dev          # dev server with live reload
npm test             # every test
npm run lint         # ESLint over js/, paper/ and scripts/
npm run typecheck    # tsc over the JSDoc types, no output
npm run build        # dist/, then scripts/check-dist.mjs
npm run preview      # serve dist/ locally
```

The build has three modes (see [Release modes](#release-modes)):

```bash
npm run build                           # as deployed: drafts tagged "in review"
PAPER_PUBLISH=preview npm run build     # the same, with a banner and noindex
PAPER_PUBLISH=production npm run build  # strict: fails if a draft remains
```

## URL map

| URL | What | Source |
|---|---|---|
| `/` | The timeline | Generated from `content/timeline.json` |
| `/<slug>/` | A walkthrough or note | Generated from `content/projects/` or `content/notes/` |
| `/matrix/` | The terminal | `matrix/index.html` |
| `/feed.xml` | RSS of the notes | Generated |
| `/sitemap.xml`, `/robots.txt` | Home and every page; not in preview | Generated |
| `/404.html` | Served for any unknown URL | Generated |
| `/config/content/paper.json` | Index for the terminal's `about` and `notes` | Generated |
| `/recruiter` | Redirects to `/` | `_redirects`, generated |

## Release modes

The whole site is always built. `PAPER_PUBLISH` only decides how unfinished copy is treated.

| Value | Drafts | Indexing | Use it for |
|---|---|---|---|
| unset | Shown, tagged "in review" | Indexed, with a sitemap | The live site while copy is still being reviewed |
| `preview` | Shown, tagged "in review" | `noindex` and a banner on every page | Pull-request previews |
| `production` | Fail the build, by name | Indexed, with a sitemap | The live site once every draft flag is cleared |

Any other value fails the build. `npm run dev` follows the same variable. After every build, [`scripts/check-dist.mjs`](../scripts/check-dist.mjs) confirms that `dist/` is whole: a home page, a page for every walkthrough, no orphan pages, a valid feed, `noindex` only in preview, no draft tag in production, and the terminal intact at `/matrix/`.

## Tests

```bash
npm test
```

| File | What it covers |
|---|---|
| [`tests/paper.test.js`](../tests/paper.test.js) | Content validation, the Markdown rules, the release modes (on a small draft-free fixture site), year rows, and that every internal link on every rendered page lands somewhere |
| [`tests/contract.test.js`](../tests/contract.test.js) | The terminal's contracts: commands against help and man pages, `rain.json`'s shape, themes against their CSS, tab completion |
| [`tests/legacy-links.test.js`](../tests/legacy-links.test.js) | Cleaning retired recruiter-mode links |

The tests render the real `content/` folder, so a broken link or an invalid entry fails `npm test` as well as the build.

## Deployment

Cloudflare Pages builds `main` with `npm run build` and serves `dist/`. Every pull request gets a preview deployment.

- **Production environment:** `PAPER_PUBLISH` is unset, so the timeline ships with unfinished entries tagged "in review". Once every draft flag in `content/` is cleared, set it to `production` so a stray draft can never ship.
- **Preview environment:** optionally set `PAPER_PUBLISH=preview`, so preview links stay out of search engines.

Changes go through a pull request; nothing is pushed straight to `main`.

## Conventions

- **Plain JavaScript with JSDoc types.** `npm run typecheck` checks them; there is no compile step.
- **No runtime dependencies.** Everything in `package.json` is a dev dependency; the site ships only its own code.
- **Content errors are collected.** A loader reports every problem in one run, with the file and field named.
- **Comments say why.** They explain a decision or a constraint, not what the next line does.
