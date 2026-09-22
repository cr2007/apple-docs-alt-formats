# Apple Developer Docs: Markdown/JSON buttons browser extension

Date: 2026-09-22

## Purpose

Apple's developer documentation pages (developer.apple.com/documentation,
/tutorials, /design) are DocC-rendered single-page apps. Apple already
exposes machine-readable alternates of every page (Markdown for LLM/tooling
consumption, JSON as DocC's raw render data), but there is no UI to reach
them — a reader has to know the URL convention and edit the address bar by
hand. This extension adds two small, native-looking buttons to the page
that link directly to those alternates.

## URL rules (verified against live pages)

Apple's own page `<head>` already declares
`<link rel="alternate" type="text/markdown" href=".../view.md">` on
`/documentation` pages, confirming the convention below is intentional
and stable, not a scraping trick.

- **Markdown**
  - `/documentation/*` → append `.md` to the current path.
  - `/tutorials/*`, `/design/*` → rewrite to `/tutorials/data<path>.md`.
- **JSON**
  - Any of the three sections → rewrite to `/tutorials/data<path>.json`.

Both rules are implemented as pure path-string functions, unit-testable
without a browser.

## Existence check

Before a button renders, the content script issues
`fetch(url, { method: "HEAD" })` against that button's computed URL,
falling back to a `GET` with a `Range: bytes=0-0` header if `HEAD` isn't
supported (some CDNs reject HEAD). The button only mounts on a successful,
JSON/Markdown-flavored response. The two checks run independently and in
parallel — either button can appear without the other.

## Framework and tooling

- **WXT** (Vite-based web extension framework), **TypeScript**, built and
  run exclusively through `bun` / `bunx --bun` (per user's global toolchain
  rule — never npm/npx/yarn/pnpm).
- WXT's multi-browser manifest generation targets Chrome, Firefox, and Edge
  (Chromium-compatible) directly. Safari requires a final
  `xcrun safari-web-extension-converter` pass on macOS, which is a packaging
  step outside WXT's control on any platform — documented as a manual step,
  not automated here.
- No popup, no options page, no background service worker beyond what WXT
  scaffolds by default. This is a pure content script.

## Content script

**Match patterns:** `https://developer.apple.com/documentation/*`,
`https://developer.apple.com/tutorials/*`, `https://developer.apple.com/design/*`

**Injection point:** DocC's SPA structure (verified live) is:

```
main#app-main.main
  > div.documentation-hero.documentation-hero--disabled
      > div.documentation-hero__content
          > ul.nav-menu-items.hierarchy       (breadcrumb, e.g. "SwiftUI / View")
          > div.topictitle                    (eyebrow "Protocol" + <h1>View</h1>)
          > div.abstract.content
          > div.summary-section.availability
          > div.declarations-container
```

This exactly matches the XPath the user pointed at
(`//*[@id="app-main"]/div[1]/div[3]` resolves to
`div.documentation-hero__content`). The button row is inserted as a new
sibling **immediately before `.topictitle`** — i.e. after the breadcrumb,
directly above the eyebrow/heading. Selector strategy, in order of
preference:

1. `#app-main .documentation-hero__content` → insert before its `.topictitle`
   child.
2. If `.topictitle` isn't found (a page shape we haven't seen), prepend to
   `.documentation-hero__content` instead.
3. If `.documentation-hero__content` itself isn't found (non-`/documentation`
   page shapes under `/tutorials` or `/design`), fall back to inserting
   directly before the first `h1` inside `#app-main`.

**SPA navigation:** DocC does not reload the document between pages, so a
`MutationObserver` on `#app-main` re-runs the injection (remove stale
buttons, recompute URLs, recheck existence) whenever the hero content is
replaced.

## Visual design (matched against the live page, not guessed)

Verified via Playwright against `developer.apple.com/documentation/swiftui/view`
in both `light` and `dark` `prefers-color-scheme` emulation:

- **Font stack:** `"SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont,
  "Helvetica Neue", Helvetica, Arial, sans-serif` — the exact stack the page
  body uses. Buttons use this directly rather than `inherit`, so they render
  correctly even if injected before the page's own CSS assigns it to an
  ancestor.
- **Color tokens** (DocC's own CSS custom properties, resolved values):

  | Token | Light | Dark |
  |---|---|---|
  | Page background | `#fff` | `#000` |
  | Secondary fill (card/well background) | `#fbfbfd` | `#161617` |
  | Tertiary fill | `#f5f5f7` | `#1d1d1f` |
  | Primary text | `#1d1d1f` | `#f5f5f7` |
  | Accent blue (links/actions) | `#06c` | `#2997ff` |
  | Fill blue (buttons) | `#0071e3` | `#0071e3` |
  | Border/grid | `#d2d2d7` | `#424245` |
  | Secondary gray text (eyebrow, meta) | `#86868b` | `#6e6e73` |

  These are hardcoded as fallback values in the extension's own injected
  stylesheet (scoped to the button row, not relying on DocC's CSS variables
  being present/stable across DocC versions), switched via
  `@media (prefers-color-scheme: dark)` — matching how the page itself
  switches, since DocC has no manual light/dark toggle on these pages.
- **Reference for scale/weight:** the page's own "Protocol" eyebrow label
  renders at `21px`/`500` weight/`#6e6e73` — confirms Apple's docs use
  medium-weight (500-590), not bold, for small UI labels. Buttons use a
  similar restrained weight (~590) at a smaller size (13px) appropriate for
  a secondary control, not competing with the H1.

**Button treatment:** two small inline controls, rendered as real `<a>`
elements (`href` = computed URL, `target="_blank" rel="noopener"`) so native
right-click, "open in new tab", and "copy link" all work without any JS
click handler:

- Text-only labels, "Markdown" and "JSON" — no emoji, no decorative icon
  that would look bolted-on; a small minimal monochrome glyph (document/
  braces) is acceptable if it reads as native, not a logo.
- Resting state: 1px border in the grid token, secondary-fill background,
  primary-text color, ~6px border-radius (matches Apple's small-control
  radius, not an iOS-style full pill — DocC's own `.badge` uses `3px`, so
  6px sits comfortably between a badge and a full button).
- Hover: border and text shift toward the accent blue token, subtle
  background lightening — a fast, small opacity/color transition
  (~120ms), no scale/bounce (Apple's own controls don't bounce).
- Row sits with the same left-alignment and spacing rhythm as the
  breadcrumb above it, small gap between the two buttons.

## Error handling

- A `fetch` failure (network error, non-2xx, wrong content-type) simply
  means that button never mounts — no error UI, no retry, no console noise
  visible to the end user (a `console.debug` is fine for our own
  debugging, not `console.error`).
- If `MutationObserver` fires faster than the existence checks resolve, an
  in-flight check for a stale page is discarded (guarded by a monotonically
  increasing generation counter) rather than racing to inject onto a page
  that has already changed.

## Testing

- Pure unit tests (via `bun test`) for the URL-computation functions
  against the concrete cases already verified in this session (`/documentation`,
  `/tutorials`, `/design` paths).
- Manual verification: load the unpacked extension in Chrome and Firefox
  against a handful of real pages (a `/documentation` symbol page, a
  `/tutorials` page, a `/design` HIG page) and confirm button placement,
  correct URLs, light/dark rendering, and that a page with no JSON/MD
  alternate correctly shows zero or one button rather than a broken link.
- Safari verification is manual (Xcode-converted build), out of scope for
  automated tests.

## Out of scope

- No popup, options page, or settings/storage.
- No caching of existence-check results across sessions (each page load
  rechecks; DocC pages are cheap to HEAD and this avoids stale positives
  after Apple changes what's published).
- No i18n of button labels — Apple's docs are read in many languages, but
  the buttons stay in English, consistent with them being a small
  developer-facing utility rather part of Apple's own UI copy.
