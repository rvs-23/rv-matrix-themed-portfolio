# rv-portfolio-matrix

My personal site, [rvs23.dev](https://rvs23.dev/). It has two faces:

- **The timeline** at `/`: a plain page of work, study and projects, year by year, with walkthroughs for the projects worth explaining.
- **The Matrix terminal** at `/matrix`: a command line over the falling-code rain from the film. Nothing on the timeline links to it.

![The timeline: one centre line of years, work on the left, projects and learning on the right](docs/images/timeline.png)

![The Matrix terminal's digital rain](docs/images/rain.png)

Both are plain HTML, CSS and JavaScript. Vite provides the dev server and the bundle; there is no framework and no backend.

## Quick start

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
git clone https://github.com/rvs-23/rv-portfolio-matrix.git
cd rv-portfolio-matrix
npm install
npm run dev      # http://localhost:5173/ (timeline) and /matrix/ (terminal)
```

```bash
npm test         # content validation, rendered pages, terminal contracts
npm run lint
npm run build    # static site in dist/, then a check that dist/ is consistent
```

## The two parts

| | Timeline | Matrix terminal |
|---|---|---|
| URL | `/`, and `/<slug>/` per walkthrough | `/matrix/` |
| What you edit | `content/timeline.json`, `content/projects/*.md` | `public/config/content/*.json`, `js/commands/` |
| Code | `paper/` | `matrix/index.html`, `js/`, `css/` |
| Built how | Generated at build time by a Vite plugin | A normal Vite page |
| Guide | [docs/timeline.md](docs/timeline.md) | [docs/matrix.md](docs/matrix.md) |

The two share nothing but the build: no common styles, scripts or fonts.

## Publishing

The timeline ships only when the build is told to, through `PAPER_PUBLISH`:

| `PAPER_PUBLISH` | What is built |
|---|---|
| unset | The terminal only. `/` redirects to `/matrix/`. |
| `preview` | The timeline with drafts shown and labelled; pages are not indexed. |
| `production` | The timeline. The build fails while any entry is still a draft. |

`npm run dev` always behaves as `preview`. [docs/development.md](docs/development.md) covers the gate, the checks and deployment.

## Repository map

```
content/                What the timeline says
  timeline.json         Header, links, and every dated entry
  projects/             One Markdown walkthrough per project page
  notes/                Dated notes (none yet)
  figures/  logos/      SVG figures and organisation logos
paper/                  The timeline's code: content loader, Markdown,
                        templates, styles, fonts, and the Vite plugin
matrix/index.html       The terminal's page: loader, canvas, terminal, nav
js/                     The terminal's code: commands, controller, rain engine
css/                    The terminal's styles and colour themes
public/config/          The terminal's data: rain.json, skills, hobbies, man pages
scripts/check-dist.mjs  Post-build check that dist/ matches the release gate
tests/                  Vitest suites for both parts
docs/                   Guides, and a primer on how the terminal is built
```

## Docs

- [docs/timeline.md](docs/timeline.md): add an entry, write a walkthrough, draw a figure, and how the page is generated.
- [docs/matrix.md](docs/matrix.md): the commands, how to add one, the rain engine and its parameters.
- [docs/development.md](docs/development.md): commands, tests, the release gate, deployment, and the URL map.
- [docs/primer/](docs/primer/01-the-page-and-its-skin.md): a two-part walk through the terminal's code for someone who can program but is new to the web.

## Credits

Glyph fonts and inspiration from [Rezmason/matrix](https://github.com/Rezmason/matrix/tree/master). Rain behaviour draws on [Carl Newton's digital rain analysis](https://carlnewton.github.io/digital-rain-analysis/). The timeline is set in Archivo, Instrument Serif and JetBrains Mono, as in [rv-markdown-paper](https://github.com/rvs-23/rv-markdown-paper).

Licensed under the [MIT License](LICENSE).
