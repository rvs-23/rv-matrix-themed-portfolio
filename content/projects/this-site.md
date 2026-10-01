---
title: Matrix terminal
summary: A command line over falling-code rain, hidden at /matrix, and how the rain actually works.
draft: true
---

## What it is

The Matrix terminal is the other half of this site, and it used to be the front page. It now lives at [rvs23.dev/matrix](/matrix/). You type `whoami`, `skills` or `rain`, and it answers. Behind it, a full-screen canvas draws the digital rain from The Matrix. There is no framework: plain HTML, CSS and JavaScript, built with Vite.

## The idea behind the rain

The obvious way to draw falling code is to move letters down the screen. The film does something else, and so does this site: the letters stay put, and the *light* moves.

![Streams don't move letters. They move brightness down a fixed grid of glyphs.](figures/rain.svg)

- **A fixed grid.** Every cell on screen holds a glyph and a brightness from 0 to 1.
- **Streams are cursors.** Each one moves down a column, setting the cell under it to full brightness.
- **Everything fades.** Every frame, every cell loses a little brightness, so a trail forms behind each cursor and dies away on its own.
- **Glyphs change in sync.** A few cells swap their glyph on the same frame, which is the shimmer you notice in the film.

About sixty times a second the loop decays the grid, mutates a few glyphs, advances the streams and repaints.

## Going deeper

Two longer primers in the repo walk through the code for someone who can program but is new to the web: [the page and its skin](https://github.com/rvs-23/rv-portfolio-matrix/blob/main/docs/primer/01-the-page-and-its-skin.md) (HTML and CSS) and [the terminal and the rain](https://github.com/rvs-23/rv-portfolio-matrix/blob/main/docs/primer/02-the-terminal-and-the-rain.md) (the JavaScript).
