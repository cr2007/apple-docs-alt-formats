# Apple Docs Alt Formats

A small browser extension for [Apple Developer
Documentation](https://developer.apple.com/documentation). It adds two
buttons above the page heading, **Markdown** and **JSON**, that link
directly to that page's machine-readable alternate format.

Apple already publishes these alternates for every documentation,
tutorial, and design page; there is just no link to them on the page
itself. This extension adds one.

## What it looks like

Open any page under `/documentation`, `/tutorials`, or `/design`. Above
the heading, next to the breadcrumb, you get two small buttons that
match Apple's own page styling, in both light and dark mode:

- **Markdown** opens the page's `.md` alternate in a new tab.
- **JSON** opens the page's raw `.json` data in a new tab.

Both are real links: right-click either one for the normal browser
context menu (copy link, open in new tab, and so on). A button only
appears if that alternate actually exists for the current page.

Click the extension's own toolbar icon for a small popup showing its
name, version, build info, and a link to this repo.

## Install

This extension is not yet published to a browser store. Build it
yourself and load it as an unpacked/temporary extension:

```bash
bun install
bun run build            # Chrome / Edge -> .output/chrome-mv3
bun run build:firefox    # Firefox -> .output/firefox-mv2
```

**Chrome / Edge:** open `chrome://extensions`, turn on Developer mode,
click **Load unpacked**, and select `.output/chrome-mv3`.

**Firefox:** open `about:debugging#/runtime/this-firefox` (not
`about:addons`, which only accepts a signed `.xpi`), click **Load
Temporary Add-on...**, and select `.output/firefox-mv2/manifest.json`.
Firefox removes it on restart; reload from the same page after each
rebuild. See `AGENTS.md` for how to keep it installed across restarts.

**Safari:** on macOS, run
`xcrun safari-web-extension-converter .output/chrome-mv3` to generate an
Xcode project, then build and run it from Xcode.

## Development

See `AGENTS.md` for the full command reference, project structure, and
the exact URL rules the extension follows. Short version:

```bash
bun run dev      # hot-reloading dev build, opens Chrome automatically
bun test         # unit tests
bun run verify   # loads the real built extension in real Chromium and
                  # checks it against live Apple Developer pages
```

## How it works

Apple's documentation pages are a single-page app. This extension is a
content script that:

1. Computes the current page's Markdown and JSON alternate paths from
   its URL.
2. Checks each one actually exists before showing its button, so a
   button never links to a broken page.
3. Inserts the button row into the page, right above the heading.
4. Re-runs all of the above whenever the single-page app navigates to a
   new page, without a full reload.

No options page, no background script, no stored settings, no data
collection. The popup is display-only.

## Releasing

Pushing a version tag (`vX.Y.Z`, matching `package.json`) runs the full
test suite across every browser target, then publishes to the Chrome
Web Store, Microsoft Edge Add-ons, and Firefox Add-ons in parallel,
gated behind a manual approval step. See `AGENTS.md` for the exact
release process and the secrets it needs.
