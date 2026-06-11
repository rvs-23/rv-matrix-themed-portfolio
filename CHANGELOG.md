# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses [SemVer](https://semver.org/).

## [1.1.0] — 2026-06-11

Review-driven fix release. A full-codebase review surfaced security,
correctness, and hygiene issues; this release addresses all of them. No new
user-facing features. Performance and larger refactors are tracked separately.

### Security

- Escape user-typed arguments in the `screenshot`, `rain preset`, `rain font`,
  and `rain`/`term` unknown-subcommand error messages. They previously flowed
  raw into `innerHTML` (a self-XSS sink), inconsistent with the escaping used
  everywhere else.

### Fixed

- **Rain double-loop:** reloading with a saved preset spawned two
  `requestAnimationFrame` chains (≈2× CPU, doubled mutation/decay). `start()`
  now uses a generation token so overlapping starts can't both run. Also fixes
  a resize-during-setup race.
- **Crash on missing `rain.json`:** a failed config fetch threw in the engine
  constructor and froze the app on the loader. The engine now fails with a clear
  error and the terminal still initializes (rain disabled).
- **Preset font/glyph desync:** switching the rain font then applying a preset
  reverted the render font to classic while glyphs stayed the other set
  (missing-glyph "tofu"). The font set is now owned by `rain font`/reset;
  presets preserve it.
- **`comet` preset depth:** declared 4 layers but only had a 3-element opacity
  ramp, so ~25% of streams rendered at full opacity. Added the 4th value.
- **`reset` completeness:** now also restores terminal opacity, font size, and
  window size (previously left at customized values despite the "all reset"
  message).
- **`search` hobbies:** the hobbies branch read a non-existent array, so hobbies
  were never searchable. It now traverses the hobbies tree like skills. Added
  the `.highlight` / `.comment` styles the results use.
- **`man` aliases:** restored the `sudo` manual page and resolved `man hire`
  (alias of `mission`).
- **`sudo`** now greets the configured user name instead of always "User".
- **`date` Tab-completion** now offers the full timezone-alias list from config
  instead of a hardcoded 6-of-15 subset.
- Corrected stale error messages that referenced the removed `rainfont` /
  `rainpreset` commands and a non-existent `assets/` data path.
- Use `??` (not `||`) for the configured initial terminal opacity so a value of
  `0` isn't clobbered.

### Changed / chore

- Removed dead config keys and `commandContext` properties.
- Quoted the lint glob so `npm run lint` actually covers `js/main.js` and
  `js/utils.js` (previously skipped by shell expansion).
- Added the MIT `LICENSE` file (the README already declared MIT) and a
  `package.json` license field.
- Made the `og:image` / `og:url` social tags absolute so link previews work.
- Documented `dimFloor`, `gravityAccel`, `sentientChance`, and `minStreamGap`
  in the README; synced the easter-egg list.

## [1.0.0]

Initial build: interactive terminal portfolio with a configurable Matrix rain
canvas (presets, fonts, gravity, glyphspeed), 11 themes, recruiter mode, easter
eggs, did-you-mean suggestions, and a loader screen.
