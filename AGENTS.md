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
2. Open `about:debugging#/runtime/this-firefox` (not `about:addons` -
   that page's "Install Add-on from File" only takes a signed `.xpi`
   and will reject this build)
3. Click **This Firefox** in the sidebar if it isn't already selected
4. Click **Load Temporary Add-on...**, then select
   `.output/firefox-mv2/manifest.json` directly in the file picker
5. Firefox removes temporary add-ons on restart; reload each session
   from the same page (there's a reload icon next to the loaded
   extension for picking up a rebuild), or use `bun run dev:firefox`
   for a persistent hot-reloading loop.

To keep it installed across restarts without going through AMO, use
Firefox Developer Edition or Nightly, set
`xpinstall.signatures.required` to `false` in `about:config`, then
install a packed `.xpi` (`bun run zip:firefox`) via `about:addons` ->
"Install Add-on From File". Not available on regular release Firefox.

**Safari**
Not buildable from this repo directly. On macOS, run
`xcrun safari-web-extension-converter .output/chrome-mv3` to generate
an Xcode project, then build and run that from Xcode.

## Project structure

```
entrypoints/
  apple-devdocs.content.ts   Content script entry. Wires the modules
                              below together; no logic of its own.
  popup/                      Toolbar popup: name, version, build info,
                               author, link to source. No shared logic
                               with the content script.
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
assets/
  icon.svg   Source of truth for the extension icon. Edit this, then
             run `bun run generate-icons` to regenerate public/icon/.
scripts/
  verify.mjs           Live-site verification (see `bun run verify` above).
  generate-icons.mjs   Renders assets/icon.svg to every PNG size the
                        manifest needs.
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

## Continuous integration

`.github/workflows/ci.yml` runs on every push and every pull request:
`bun test`, `bun run compile`, and a build for each browser target. No
secrets needed, nothing is published.

## Releasing a new version

1. Bump `"version"` in `package.json`.
2. Commit that change.
3. Tag the commit `vX.Y.Z`, matching `package.json` exactly, and push
   the tag: `git push origin vX.Y.Z`.

Pushing a version tag runs `.github/workflows/release.yml`:

1. **verify**: confirms the tag matches `package.json`'s version, then
   runs the full suite: unit tests, type check, both browser builds, and
   a live check of the Chromium build against real Apple Developer
   pages (`bun run verify`). Nothing below this runs unless it passes.
2. **publish-chrome / publish-edge / publish-firefox**: run in parallel
   once verify passes. Each is gated behind the `release` GitHub
   Environment, which should be configured with required reviewers
   (repo Settings -> Environments -> `release` -> Required reviewers),
   so a human approves before anything reaches a real store.
3. **release-notes**: once all three stores succeed, creates a GitHub
   Release with an auto-generated changelog and attaches the built zips.

A plain git hook (`.githooks/pre-push`, no framework, wired up
automatically by `bun install` via the `postinstall` script) refuses to
push a version tag that does not match `package.json`, as an earlier,
local version of the same check the release workflow runs.

**Required repository secrets**, one set per store (`wxt submit`
underneath; see [wxt.dev/guide/essentials/publishing](https://wxt.dev/guide/essentials/publishing.html)):

| Store | Secrets |
|---|---|
| Chrome Web Store | `CHROME_EXTENSION_ID`, `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`, `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` |
| Microsoft Edge Add-ons | `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY` |
| Firefox Add-ons (AMO) | `FIREFOX_EXTENSION_ID`, `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` |

Until these are added (repo Settings -> Secrets and variables ->
Actions), `verify` still passes, but the three publish jobs fail at the
submit step. That is expected and safe: nothing publishes without them.

**Known limitation:** the live check in `verify` uses real Chromium,
which covers Chrome and, since Edge is Chromium-based and reuses the
same build, gives strong (not literal) confidence for Edge too. Firefox
only gets a build check, not a live browser check: Playwright cannot
load an unpacked Firefox extension the way it loads a Chromium one.

## Conventions for changes in this repo

- Bun only, everywhere (see Toolchain above). This includes
  `package.json` scripts that invoke a devDependency's own binary
  (`wxt`, `tsc`, and so on): route them through `bunx --bun <tool>`
  rather than calling the binary bare, even though Bun's own `node`
  shim usually makes a bare call behave the same way. The explicit form
  is the guarantee; don't depend on environment setup for it.
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
- No options page, no background script, no stored settings, no data
  collection. The popup is display-only (the extension's own
  metadata); it holds no state and makes no network requests. Don't
  turn it into a settings surface without updating the spec first.
- Commit only a working state: tests green, `bun run compile` clean.
