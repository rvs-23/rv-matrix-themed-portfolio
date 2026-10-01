# Development

How to set up the repo, run the checks, and ship. The two halves of the site have their own guides: [timeline.md](timeline.md) and [matrix.md](matrix.md).

## Contents

- [Setup](#setup)
- [Commands](#commands)
- [URL map](#url-map)
- [The release gate](#the-release-gate)
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

The dev server serves the timeline at http://localhost:5173/ and the terminal at http://localhost:5173/matrix/. It always shows drafts.

## Commands

```bash
npm run dev          # dev server with live reload
npm test             # every test
npm run lint         # ESLint over js/, paper/ and scripts/
npm run typecheck    # tsc over the JSDoc types, no output
npm run build        # dist/, then scripts/check-dist.mjs
npm run preview      # serve dist/ locally
```

To build the site as a visitor would see it before launch, and after:

```bash
npm run build                           # terminal only
PAPER_PUBLISH=preview npm run build     # timeline with drafts
PAPER_PUBLISH=production npm run build  # timeline; fails if a draft remains
```

## URL map

| URL | What | Source |
|---|---|---|
| `/` | The timeline | Generated from `content/timeline.json` |
| `/<slug>/` | A walkthrough or note | Generated from `content/projects/` or `content/notes/` |
| `/matrix/` | The terminal | `matrix/index.html` |
| `/feed.xml` | RSS of the notes | Generated |
| `/sitemap.xml` | Home and every page; production only | Generated |
| `/config/content/paper.json` | Index for the terminal's `about` and `notes` | Generated |
| `/recruiter` | Redirects to `/` | `_redirects`, generated |

## The release gate

`PAPER_PUBLISH` decides whether the timeline is built at all. It exists so the timeline can be reviewed on a preview URL while the live site keeps serving the terminal.

| Value | Timeline | Drafts | Indexing | `/` |
|---|---|---|---|---|
| unset | Not built | n/a | n/a | Redirects to `/matrix/` (302) |
| `preview` | Built | Shown, tagged | `noindex` on every page | The timeline |
| `production` | Built | Fail the build | Indexed, with a sitemap | The timeline |

Any other value fails the build. After every build, [`scripts/check-dist.mjs`](../scripts/check-dist.mjs) confirms that `dist/` matches the gate: nothing of the timeline when it is unset; otherwise a home page, a page for every walkthrough, no orphan pages, a valid feed, and the terminal intact at `/matrix/`.

## Tests

```bash
npm test
```

| File | What it covers |
|---|---|
| [`tests/paper.test.js`](../tests/paper.test.js) | Content validation, the Markdown rules, the release gate, year rows, and that every internal link on every rendered page lands somewhere |
| [`tests/contract.test.js`](../tests/contract.test.js) | The terminal's contracts: commands against help and man pages, `rain.json`'s shape, themes against their CSS, tab completion |
| [`tests/legacy-links.test.js`](../tests/legacy-links.test.js) | Cleaning retired recruiter-mode links |

The tests render the real `content/` folder, so a broken link or an invalid entry fails `npm test` as well as the build.

## Deployment

Cloudflare Pages builds `main` with `npm run build` and serves `dist/`. Every pull request gets a preview deployment.

- **Preview environment:** set `PAPER_PUBLISH=preview`, so pull requests show the timeline with drafts.
- **Production environment:** leave `PAPER_PUBLISH` unset until launch. To launch, clear every draft flag in `content/`, then set it to `production`.

Changes go through a pull request; nothing is pushed straight to `main`.

## Conventions

- **Plain JavaScript with JSDoc types.** `npm run typecheck` checks them; there is no compile step.
- **No runtime dependencies.** Everything in `package.json` is a dev dependency; the site ships only its own code.
- **Content errors are collected.** A loader reports every problem in one run, with the file and field named.
- **Comments say why.** They explain a decision or a constraint, not what the next line does.
