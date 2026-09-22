# AGENTS.md

This file is the primary reference for working in this repository, for
both human contributors and coding agents. `CLAUDE.md` and `README.md`
point back to this file rather than duplicating it.

## What this project is

A browser extension for Apple Developer Documentation
(`developer.apple.com/documentation`, `/tutorials`, `/design`). It adds
two small buttons above the page heading, **Markdown** and **JSON**,
that link to that page's machine-readable alternate formats. Apple
already serves these alternates; the extension only adds a visible way
to reach them.

See `docs/superpowers/specs/2026-09-22-apple-devdocs-md-json-buttons-design.md`
for the full design rationale (URL rules, DOM injection point, color
tokens) and `docs/superpowers/plans/2026-09-22-apple-devdocs-md-json-buttons.md`
for how it was built, task by task.

## Toolchain

Bun only. Never `npm`, `npx`, `yarn`, or `pnpm`, including inside a
`package.json` script.

```bash
bun install          # install dependencies
bunx --bun <tool>     # run a tool through bun's runtime
```

## Common commands

```bash
bun run dev            # WXT dev server, hot-reloading, opens Chrome
bun run dev:firefox    # same, targeting Firefox

bun run build           # production build -> .output/chrome-mv3
bun run build:firefox   # production build -> .output/firefox-mv2

bun test          # unit tests (test/*.test.ts)
bun run compile   # tsc --noEmit, strict type check

bun run verify   # build, then load the real extension in real
                 # Chromium and check it against live Apple pages
```

`bun run verify` is the closest thing this project has to an
integration test: it launches headless Chromium with the built
extension loaded (`--load-extension`), visits several real
developer.apple.com pages in both light and dark color scheme, and
asserts the right number of buttons appear with the right hrefs. It
needs network access and takes longer than `bun test`; run it before
calling any change to the content script or DOM logic done.

## Manual testing in a real browser

WXT dev mode (`bun run dev`) is the fastest loop: it opens a Chrome
instance with the extension loaded and hot-reloads on save.

To load a production build by hand:

**Chrome / Edge**
1. `bun run build`
2. Open `chrome://extensions`, turn on **Developer mode**
3. **Load unpacked** -> select `.output/chrome-mv3`
4. After a later rebuild, click the reload icon on the extension's
   card, then reload any already-open tab. Extensions loaded this way
   do not auto-reload when files on disk change.

**Firefox**
1. `bun run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. **Load Temporary Add-on** -> select any file inside `.output/firefox-mv2`
   (e.g. `manifest.json`)
4. Firefox removes temporary add-ons on restart; reload each session,
   or use `bun run dev:firefox` for a persistent hot-reloading loop.

**Safari**
Not buildable from this repo directly. On macOS, run
`xcrun safari-web-extension-converter .output/chrome-mv3` to generate
an Xcode project, then build and run that from Xcode.

## Project structure

```
entrypoints/
  apple-devdocs.content.ts   Content script entry. Wires the modules
                              below together; no logic of its own.
src/
  url-transform.ts   Pure functions: page path -> Markdown/JSON
                      alternate path. No DOM, no network.
  existence-check.ts  urlExists(url): HEAD request with a ranged-GET
                       fallback, so a button never links to a 404.
  inject.ts            DOM helpers: find where to mount, build the
                        button row, mount it, remove it.
  styles.css            Button row styling, measured against the live
                         page, light and dark.
test/
  *.test.ts   One file per src/ module. Run with `bun test`.
scripts/
  verify.mjs   Live-site verification (see `bun run verify` above).
```

Each `src/` module has one responsibility and no dependency on the
others. `entrypoints/apple-devdocs.content.ts` is the only file that
imports across all three; that is deliberate, it is the integration
point and is verified end to end by `scripts/verify.mjs` rather than a
unit test.

## The URL rules, briefly

- `/documentation/*` pages: Markdown lives at the same path with `.md`
  appended. JSON is rewritten under `/tutorials/data`.
- `/tutorials/*` and `/design/*` pages: both Markdown and JSON are
  rewritten under `/tutorials/data`.
- A path already under `/tutorials/data` (i.e. already an alternate) has
  no further alternate of its own.
- A trailing slash on the page path is stripped before building the
  alternate URL; Apple serves both `/design/foo` and `/design/foo/` as
  the same page.
- Before a button is shown, its computed URL is checked with `urlExists`
  (a live network request). A button never renders as a broken link.

See `src/url-transform.ts` for the exact implementation and TSDoc.

## Conventions for changes in this repo

- Bun only, everywhere (see Toolchain above).
- No emoji, no em dash, anywhere in shipped code, UI copy, or commit
  messages. (Planning docs under `docs/superpowers/` predate this rule
  and are left as a historical record, not touched retroactively.)
- Write comments and commit messages in Simplified Technical English
  (ASD-STE100): short sentences, one idea per sentence, plain words,
  active voice.
- Every exported function gets a TSDoc comment explaining what it does
  and why, not just its parameters. Where a function's body has more
  than one logical stage, each stage gets a `Step N` (or `Step N.M` for
  a helper that is itself one step of a caller) inline comment, so both
  the type signature and the control flow are visible on hover in an
  IDE.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `test:`,
  `chore:`, `docs:`), with a subject line and a short body explaining
  why, wrapped at 72 characters. No co-author trailer.
- Buttons are real `<a href>` elements, never a JS click handler, so the
  browser's native context menu (open in new tab, copy link) works.
- No popup, no options page, no background script, no stored settings.
  This is a pure content script by design; do not add one of these
  without first updating the spec.
- Commit only a working state: tests green, `bun run compile` clean.
