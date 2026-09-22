# Apple DevDocs Markdown/JSON Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two small buttons to Apple Developer Documentation pages that link to the Markdown and JSON alternates of the current page.

**Architecture:** A WXT content script computes the two alternate URLs from the page path, checks each one exists, and inserts a button row into the DocC page just above the heading. Pure logic (URL rules, existence check, DOM insertion) lives in small testable modules; the content script only wires them together.

**Tech Stack:** WXT (Vite-based), TypeScript, Bun (runtime, package manager, test runner). No npm/npx/yarn/pnpm at any step.

**Spec:** `docs/superpowers/specs/2026-09-22-apple-devdocs-md-json-buttons-design.md`

## Global Constraints

- Use `bun` / `bunx --bun` for every command. Never `npm`, `npx`, `yarn`, or `pnpm`.
- No emoji, no em dash, anywhere in code, comments, UI copy, or commit messages.
- No popup, no options page, no background script, no stored settings.
- Buttons render as real `<a href>` elements, never JS click handlers.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). Do not add any co-author trailer.
- Write commit messages and code comments in Simplified Technical English (ASD-STE100): short sentences, one idea per sentence, plain words, active voice.
- Commit only a working state. Do not commit a step where tests are red.

---

## File Structure

```
entrypoints/
  apple-devdocs.content.ts   Content script entrypoint. Wires the modules below together.
src/
  url-transform.ts           Pure functions: path -> markdown URL, path -> json URL.
  existence-check.ts         urlExists(url): HEAD request, ranged GET fallback.
  inject.ts                  DOM helpers: find anchor point, build button row, mount/remove.
  styles.css                 Button row styling, light and dark.
test/
  url-transform.test.ts
  existence-check.test.ts
  inject.test.ts
scripts/
  verify.mjs                 Loads the built extension in real Chromium and checks it against live pages.
```

---

## Task 1: Scaffold the WXT project

**Files:**
- Create: `package.json`, `wxt.config.ts`, `tsconfig.json`, `.gitignore`
- Create: `entrypoints/apple-devdocs.content.ts` (placeholder, replaced in Task 5)
- Create: `public/icon/16.png`, `32.png`, `48.png`, `96.png`, `128.png` (WXT default icons)
- Remove after scaffold: `entrypoints/background.ts`, `entrypoints/popup/`, `components/counter.ts`, `assets/typescript.svg`, `public/wxt.svg`

**Interfaces:**
- Produces: a working `bun run dev` and `bun run build`, and `bun test` runner available for later tasks.

- [ ] **Step 1: Scaffold into a temp folder, then move files into the repo root**

WXT refuses to init into a non-empty directory, and this repo already has `docs/` and `.git`. Scaffold into a throwaway sibling folder, then move the generated files in.

```bash
cd /home/chandrashekharr/Documents/GitHub-Repos
mkdir wxt-scaffold-tmp
cd wxt-scaffold-tmp
bunx --bun wxt@latest init . --template vanilla --pm bun
```

- [ ] **Step 2: Move the generated files into the project root**

```bash
cd /home/chandrashekharr/Documents/GitHub-Repos
mv wxt-scaffold-tmp/.gitignore apple-devdocs-md-browser-extension/
mv wxt-scaffold-tmp/package.json apple-devdocs-md-browser-extension/
mv wxt-scaffold-tmp/wxt.config.ts apple-devdocs-md-browser-extension/
mv wxt-scaffold-tmp/tsconfig.json apple-devdocs-md-browser-extension/
mv wxt-scaffold-tmp/entrypoints apple-devdocs-md-browser-extension/
mv wxt-scaffold-tmp/public apple-devdocs-md-browser-extension/
rm -rf wxt-scaffold-tmp
cd apple-devdocs-md-browser-extension
```

- [ ] **Step 3: Remove the parts this extension does not need**

No popup, no background script, no demo assets.

```bash
rm -f entrypoints/background.ts
rm -rf entrypoints/popup
rm -f public/wxt.svg
```

- [ ] **Step 4: Rename the content script entrypoint**

```bash
mv entrypoints/content.ts entrypoints/apple-devdocs.content.ts
```

Replace its contents with a minimal placeholder (Task 5 fills in the real logic):

```typescript
export default defineContentScript({
  matches: [
    "https://developer.apple.com/documentation/*",
    "https://developer.apple.com/tutorials/*",
    "https://developer.apple.com/design/*",
  ],
  main() {
    console.debug("apple-devdocs-md-json-buttons: content script loaded");
  },
});
```

- [ ] **Step 4b: Add session tooling directories to .gitignore**

Append these two lines to the end of `.gitignore`:

```
.superpowers
.gstack
```

- [ ] **Step 5: Set package.json name and description**

Edit `package.json`. Change these two fields, keep everything else:

```json
  "name": "apple-devdocs-md-json-buttons",
  "description": "Add Markdown and JSON buttons to Apple Developer Documentation pages.",
```

- [ ] **Step 6: Install dependencies and verify the build works**

```bash
bun install
bun run build
```

Expected: the build finishes with no errors and creates `.output/chrome-mv3/manifest.json`.

- [ ] **Step 7: Commit**

```bash
git add package.json wxt.config.ts tsconfig.json .gitignore entrypoints public bun.lock
git commit -m "chore: scaffold wxt extension project"
```

---

## Task 2: URL transform functions

**Files:**
- Create: `src/url-transform.ts`
- Test: `test/url-transform.test.ts`

**Interfaces:**
- Produces: `getMarkdownUrl(pathname: string): string | null`, `getJsonUrl(pathname: string): string | null`. Both take a URL pathname (e.g. `/documentation/swiftui/view`) and return a path (e.g. `/documentation/swiftui/view.md`), or `null` if the path has no alternate.

- [ ] **Step 1: Write the failing test**

Create `test/url-transform.test.ts`:

```typescript
import { describe, expect, test } from "bun:test";
import { getJsonUrl, getMarkdownUrl } from "../src/url-transform";

describe("getMarkdownUrl", () => {
  test("appends .md for documentation paths", () => {
    expect(getMarkdownUrl("/documentation/swiftui/view")).toBe(
      "/documentation/swiftui/view.md"
    );
  });

  test("prefixes tutorials/data for tutorials paths", () => {
    expect(getMarkdownUrl("/tutorials/swiftui-concepts")).toBe(
      "/tutorials/data/tutorials/swiftui-concepts.md"
    );
  });

  test("prefixes tutorials/data for design paths", () => {
    expect(getMarkdownUrl("/design/human-interface-guidelines/buttons")).toBe(
      "/tutorials/data/design/human-interface-guidelines/buttons.md"
    );
  });

  test("returns null for paths outside documentation, tutorials, and design", () => {
    expect(getMarkdownUrl("/videos/play/wwdc2026/100")).toBeNull();
  });

  test("returns null when the path is already a data path", () => {
    expect(
      getMarkdownUrl("/tutorials/data/documentation/swiftui/view.json")
    ).toBeNull();
  });
});

describe("getJsonUrl", () => {
  test("prefixes tutorials/data for documentation paths", () => {
    expect(getJsonUrl("/documentation/swiftui/view")).toBe(
      "/tutorials/data/documentation/swiftui/view.json"
    );
  });

  test("prefixes tutorials/data for tutorials paths", () => {
    expect(getJsonUrl("/tutorials/swiftui-concepts")).toBe(
      "/tutorials/data/tutorials/swiftui-concepts.json"
    );
  });

  test("prefixes tutorials/data for design paths", () => {
    expect(getJsonUrl("/design/human-interface-guidelines/buttons")).toBe(
      "/tutorials/data/design/human-interface-guidelines/buttons.json"
    );
  });

  test("returns null for paths outside documentation, tutorials, and design", () => {
    expect(getJsonUrl("/support/downloads")).toBeNull();
  });

  test("returns null when the path is already a data path", () => {
    expect(
      getJsonUrl("/tutorials/data/documentation/swiftui/view.json")
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
bun test test/url-transform.test.ts
```

Expected: FAIL, `Cannot find module '../src/url-transform'` or similar.

- [ ] **Step 3: Write the implementation**

Create `src/url-transform.ts`:

```typescript
const DATA_PATH_PREFIX = "/tutorials/data/";

export function getMarkdownUrl(pathname: string): string | null {
  if (pathname.startsWith(DATA_PATH_PREFIX)) {
    return null;
  }
  if (pathname.startsWith("/documentation/")) {
    return `${pathname}.md`;
  }
  if (pathname.startsWith("/tutorials/") || pathname.startsWith("/design/")) {
    return `/tutorials/data${pathname}.md`;
  }
  return null;
}

export function getJsonUrl(pathname: string): string | null {
  if (pathname.startsWith(DATA_PATH_PREFIX)) {
    return null;
  }
  const supported =
    pathname.startsWith("/documentation/") ||
    pathname.startsWith("/tutorials/") ||
    pathname.startsWith("/design/");
  if (!supported) {
    return null;
  }
  return `/tutorials/data${pathname}.json`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
bun test test/url-transform.test.ts
```

Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/url-transform.ts test/url-transform.test.ts
git commit -m "feat: add url transform helpers for markdown and json links"
```

---

## Task 3: Existence check

**Files:**
- Create: `src/existence-check.ts`
- Test: `test/existence-check.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `urlExists(url: string): Promise<boolean>`.

- [ ] **Step 1: Write the failing test**

Create `test/existence-check.test.ts`:

```typescript
import { afterEach, describe, expect, mock, test } from "bun:test";
import { urlExists } from "../src/existence-check";

describe("urlExists", () => {
  afterEach(() => {
    // @ts-expect-error test stub cleanup
    delete globalThis.fetch;
  });

  test("returns true when HEAD responds ok", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 200 }));
    expect(await urlExists("https://example.com/page.md")).toBe(true);
  });

  test("returns false when HEAD responds not found", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 404 }));
    expect(await urlExists("https://example.com/missing.md")).toBe(false);
  });

  test("falls back to a ranged GET when HEAD is not allowed", async () => {
    let headCalled = false;
    let getCalled = false;
    globalThis.fetch = mock(async (_url: string, init?: RequestInit) => {
      if (init?.method === "HEAD") {
        headCalled = true;
        return new Response(null, { status: 405 });
      }
      getCalled = true;
      return new Response(null, { status: 206 });
    });
    expect(await urlExists("https://example.com/page.json")).toBe(true);
    expect(headCalled).toBe(true);
    expect(getCalled).toBe(true);
  });

  test("returns false when both requests fail", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    });
    expect(await urlExists("https://example.com/page.md")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
bun test test/existence-check.test.ts
```

Expected: FAIL, `Cannot find module '../src/existence-check'`.

- [ ] **Step 3: Write the implementation**

Create `src/existence-check.ts`:

```typescript
export async function urlExists(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    if (headResponse.status !== 405) {
      return headResponse.ok;
    }
  } catch {
    // The HEAD request failed. Try a ranged GET instead.
  }

  try {
    const getResponse = await fetch(url, { headers: { Range: "bytes=0-0" } });
    return getResponse.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
bun test test/existence-check.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/existence-check.ts test/existence-check.test.ts
git commit -m "feat: add url existence check with head and ranged get fallback"
```

---

## Task 4: DOM injection helpers

**Files:**
- Create: `src/inject.ts`
- Test: `test/inject.test.ts`
- Modify: `package.json` (add `happy-dom` as a dev dependency, for DOM tests)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `interface ButtonLinks { markdownUrl: string | null; jsonUrl: string | null }`
  - `findAnchor(root: ParentNode): Element | null`
  - `buildButtonRow(links: ButtonLinks, doc: Document): HTMLElement`
  - `mountButtonRow(root: ParentNode, row: HTMLElement): boolean`
  - `removeButtonRow(root: ParentNode): void`

- [ ] **Step 1: Add happy-dom as a dev dependency**

```bash
bun add -D happy-dom
```

- [ ] **Step 2: Write the failing test**

Create `test/inject.test.ts`:

```typescript
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "happy-dom/lib/index.js";
import {
  buildButtonRow,
  findAnchor,
  mountButtonRow,
  removeButtonRow,
} from "../src/inject";

GlobalRegistrator.register();

function setBody(html: string) {
  document.body.innerHTML = html;
}

describe("findAnchor", () => {
  test("finds .topictitle inside documentation-hero__content", () => {
    setBody(`
      <main id="app-main">
        <div class="documentation-hero"><div class="documentation-hero__content">
          <ul class="nav-menu-items hierarchy"></ul>
          <div class="topictitle"><h1>View</h1></div>
        </div></div>
      </main>
    `);
    const anchor = findAnchor(document);
    expect(anchor?.className).toBe("topictitle");
  });

  test("prepends to documentation-hero__content when topictitle is missing", () => {
    setBody(`
      <main id="app-main">
        <div class="documentation-hero"><div class="documentation-hero__content">
          <div class="abstract content">Some text</div>
        </div></div>
      </main>
    `);
    const anchor = findAnchor(document);
    expect(anchor?.className).toBe("abstract content");
  });

  test("falls back to the first h1 in app-main when hero content is missing", () => {
    setBody(`<main id="app-main"><section><h1>Tutorial</h1></section></main>`);
    const anchor = findAnchor(document);
    expect(anchor?.tagName).toBe("H1");
  });

  test("returns null when nothing matches", () => {
    setBody(`<main id="app-main"></main>`);
    expect(findAnchor(document)).toBeNull();
  });
});

describe("buildButtonRow", () => {
  test("creates a link for each available format", () => {
    const row = buildButtonRow(
      { markdownUrl: "/a.md", jsonUrl: "/a.json" },
      document
    );
    const links = row.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute("href")).toBe("/a.md");
    expect(links[0]?.textContent).toBe("Markdown");
    expect(links[1]?.getAttribute("href")).toBe("/a.json");
    expect(links[1]?.textContent).toBe("JSON");
  });

  test("omits a link when its url is null", () => {
    const row = buildButtonRow({ markdownUrl: "/a.md", jsonUrl: null }, document);
    expect(row.querySelectorAll("a")).toHaveLength(1);
  });
});

describe("mountButtonRow and removeButtonRow", () => {
  beforeEach(() => {
    setBody(`
      <main id="app-main">
        <div class="documentation-hero"><div class="documentation-hero__content">
          <ul class="nav-menu-items hierarchy"></ul>
          <div class="topictitle"><h1>View</h1></div>
        </div></div>
      </main>
    `);
  });

  test("mounts the row directly before .topictitle", () => {
    const row = buildButtonRow({ markdownUrl: "/a.md", jsonUrl: "/a.json" }, document);
    const mounted = mountButtonRow(document, row);
    expect(mounted).toBe(true);
    const topicTitle = document.querySelector(".topictitle");
    expect(topicTitle?.previousElementSibling?.className).toBe(
      "adde-button-row"
    );
  });

  test("replaces an existing row instead of duplicating it", () => {
    mountButtonRow(
      document,
      buildButtonRow({ markdownUrl: "/a.md", jsonUrl: null }, document)
    );
    mountButtonRow(
      document,
      buildButtonRow({ markdownUrl: "/b.md", jsonUrl: null }, document)
    );
    expect(document.querySelectorAll(".adde-button-row")).toHaveLength(1);
    expect(
      document.querySelector(".adde-button-row a")?.getAttribute("href")
    ).toBe("/b.md");
  });

  test("returns false when there is nowhere to mount", () => {
    setBody(`<main id="app-main"></main>`);
    const mounted = mountButtonRow(
      document,
      buildButtonRow({ markdownUrl: "/a.md", jsonUrl: null }, document)
    );
    expect(mounted).toBe(false);
  });

  test("removeButtonRow removes a mounted row", () => {
    mountButtonRow(
      document,
      buildButtonRow({ markdownUrl: "/a.md", jsonUrl: null }, document)
    );
    removeButtonRow(document);
    expect(document.querySelector(".adde-button-row")).toBeNull();
  });
});

afterAll(() => {
  GlobalRegistrator.unregister();
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
bun test test/inject.test.ts
```

Expected: FAIL, `Cannot find module '../src/inject'`.

- [ ] **Step 4: Write the implementation**

Create `src/inject.ts`:

```typescript
export interface ButtonLinks {
  markdownUrl: string | null;
  jsonUrl: string | null;
}

const ROW_CLASS = "adde-button-row";
const BUTTON_CLASS = "adde-button";

export function findAnchor(root: ParentNode): Element | null {
  const heroContent = root.querySelector(
    "#app-main .documentation-hero__content"
  );
  if (heroContent) {
    const topicTitle = heroContent.querySelector(":scope > .topictitle");
    if (topicTitle) {
      return topicTitle;
    }
    return heroContent.firstElementChild ?? heroContent;
  }
  return root.querySelector("#app-main h1");
}

export function buildButtonRow(
  links: ButtonLinks,
  doc: Document
): HTMLElement {
  const row = doc.createElement("div");
  row.className = ROW_CLASS;

  if (links.markdownUrl) {
    row.appendChild(buildButton(links.markdownUrl, "Markdown", doc));
  }
  if (links.jsonUrl) {
    row.appendChild(buildButton(links.jsonUrl, "JSON", doc));
  }

  return row;
}

function buildButton(
  url: string,
  label: string,
  doc: Document
): HTMLAnchorElement {
  const link = doc.createElement("a");
  link.className = BUTTON_CLASS;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

export function mountButtonRow(root: ParentNode, row: HTMLElement): boolean {
  removeButtonRow(root);

  const anchor = findAnchor(root);
  if (!anchor?.parentElement) {
    return false;
  }

  anchor.parentElement.insertBefore(row, anchor);
  return true;
}

export function removeButtonRow(root: ParentNode): void {
  root.querySelector(`.${ROW_CLASS}`)?.remove();
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
bun test test/inject.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/inject.ts test/inject.test.ts package.json bun.lock
git commit -m "feat: add dom helpers to place and remove the button row"
```

---

## Task 5: Wire the content script and add styling

**Files:**
- Modify: `entrypoints/apple-devdocs.content.ts`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: `getMarkdownUrl`, `getJsonUrl` (Task 2), `urlExists` (Task 3), `buildButtonRow`, `mountButtonRow`, `removeButtonRow` (Task 4).
- Produces: the finished content script. No new exports; this is the integration point.

This file wires already-tested logic together and calls browser APIs (`MutationObserver`, `location`, `fetch` against a live page). It is verified end to end in Task 6, not with a unit test here.

- [ ] **Step 1: Write the styling**

Create `src/styles.css`. Values match the live page, checked in both light and dark mode against `developer.apple.com/documentation/swiftui/view` (see the spec for the source values):

```css
.adde-button-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-family: "SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont,
    "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.adde-button {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #d2d2d7;
  background-color: #fbfbfd;
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 590;
  line-height: 1.4;
  text-decoration: none;
  transition:
    color 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.adde-button:hover,
.adde-button:focus-visible {
  color: #06c;
  border-color: #06c;
  background-color: #f5f5f7;
}

@media (prefers-color-scheme: dark) {
  .adde-button {
    border-color: #424245;
    background-color: #161617;
    color: #f5f5f7;
  }

  .adde-button:hover,
  .adde-button:focus-visible {
    color: #2997ff;
    border-color: #2997ff;
    background-color: #1d1d1f;
  }
}
```

- [ ] **Step 2: Write the content script**

Replace the contents of `entrypoints/apple-devdocs.content.ts`:

```typescript
import { getJsonUrl, getMarkdownUrl } from "../src/url-transform";
import { urlExists } from "../src/existence-check";
import { buildButtonRow, mountButtonRow, removeButtonRow } from "../src/inject";
import "../src/styles.css";

export default defineContentScript({
  matches: [
    "https://developer.apple.com/documentation/*",
    "https://developer.apple.com/tutorials/*",
    "https://developer.apple.com/design/*",
  ],
  main() {
    let generation = 0;
    const appMain = document.querySelector("#app-main") ?? document.body;

    const observer = new MutationObserver(() => {
      void refresh();
    });

    async function refresh() {
      const currentGeneration = ++generation;
      const markdownPath = getMarkdownUrl(location.pathname);
      const jsonPath = getJsonUrl(location.pathname);

      const [markdownOk, jsonOk] = await Promise.all([
        markdownPath
          ? urlExists(new URL(markdownPath, location.origin).toString())
          : Promise.resolve(false),
        jsonPath
          ? urlExists(new URL(jsonPath, location.origin).toString())
          : Promise.resolve(false),
      ]);

      if (currentGeneration !== generation) {
        return;
      }

      observer.disconnect();
      if (!markdownOk && !jsonOk) {
        removeButtonRow(document);
      } else {
        const row = buildButtonRow(
          {
            markdownUrl: markdownOk ? markdownPath : null,
            jsonUrl: jsonOk ? jsonPath : null,
          },
          document
        );
        mountButtonRow(document, row);
      }
      observer.observe(appMain, { childList: true, subtree: true });
    }

    void refresh();
    observer.observe(appMain, { childList: true, subtree: true });
  },
});
```

Note on `observer.disconnect()` around the DOM write: our own button row insertion is itself a mutation. Without disconnecting first, the observer would see its own change and refresh again forever. Disconnect before the write, reconnect after.

- [ ] **Step 3: Build and check for type errors**

```bash
bun run compile
bun run build
```

Expected: both finish with no errors.

- [ ] **Step 4: Commit**

```bash
git add entrypoints/apple-devdocs.content.ts src/styles.css
git commit -m "feat: inject markdown and json buttons into the doc page"
```

---

## Task 6: Verify against the real site

**Files:**
- Create: `scripts/verify.mjs`
- Modify: `package.json` (add `playwright` as a dev dependency, add a `verify` script)

**Interfaces:**
- Consumes: the built extension at `.output/chrome-mv3` (produced by `bun run build` in Task 1/5).
- Produces: a pass/fail report printed to the terminal. Not part of the extension itself.

This task loads the real built extension into real Chromium and checks it against the live Apple Developer site. This is the "does it actually work" check, separate from the unit tests.

- [ ] **Step 1: Add playwright as a dev dependency**

```bash
bun add -D playwright
bunx --bun playwright install chromium
```

- [ ] **Step 2: Write the verification script**

Create `scripts/verify.mjs`:

```javascript
import { chromium } from "playwright";
import path from "node:path";
import process from "node:process";

const extensionPath = path.resolve(".output/chrome-mv3");

const pages = [
  {
    name: "documentation page (has markdown and json)",
    url: "https://developer.apple.com/documentation/swiftui/view",
    expectButtons: 2,
  },
  {
    name: "design page (has markdown and json)",
    url: "https://developer.apple.com/design/human-interface-guidelines",
    expectButtons: 2,
  },
  {
    name: "non-matching page (no buttons)",
    url: "https://developer.apple.com/support/",
    expectButtons: 0,
  },
];

let failed = false;

for (const colorScheme of ["light", "dark"]) {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    colorScheme,
    args: [
      "--headless=new",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  for (const check of pages) {
    const page = await context.newPage();
    await page.goto(check.url, { waitUntil: "load", timeout: 30000 });

    if (check.expectButtons > 0) {
      await page
        .waitForSelector(".adde-button-row a", { timeout: 15000 })
        .catch(() => {});
    } else {
      await page.waitForTimeout(3000);
    }

    const hrefs = await page.$$eval(".adde-button-row a", (as) =>
      as.map((a) => a.getAttribute("href"))
    );

    const ok = hrefs.length === check.expectButtons;
    console.log(
      `[${colorScheme}] ${check.name}: expected ${check.expectButtons} button(s), found ${hrefs.length}. ${ok ? "PASS" : "FAIL"}`
    );
    if (hrefs.length > 0) {
      console.log(`  hrefs: ${JSON.stringify(hrefs)}`);
    }
    if (!ok) {
      failed = true;
    }

    await page.screenshot({
      path: `verify-${colorScheme}-${check.name.replace(/[^a-z0-9]+/gi, "-")}.jpg`,
      type: "jpeg",
      quality: 70,
    });
    await page.close();
  }

  await context.close();
}

if (failed) {
  console.log("VERIFY_FAILED");
  process.exit(1);
}
console.log("VERIFY_PASSED");
```

- [ ] **Step 3: Add the verify script to package.json**

```json
  "scripts": {
    ...
    "verify": "bun run build && bun scripts/verify.mjs"
  }
```

- [ ] **Step 4: Run it**

```bash
bun run verify
```

Expected: `VERIFY_PASSED`, with each line showing `PASS` and the correct href list for the two matching pages, and 0 buttons for the non-matching page. If a line shows `FAIL`, open the matching screenshot and check what rendered.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify.mjs package.json bun.lock
git commit -m "test: add live-site verification script"
```

---

## Task 7: Firefox build check

**Files:** none (build output only, not committed)

**Interfaces:** none.

- [ ] **Step 1: Build the Firefox variant**

```bash
bun run build:firefox
```

Expected: finishes with no errors and creates `.output/firefox-mv2/manifest.json` (or `firefox-mv3`, depending on the installed WXT version).

- [ ] **Step 2: Report to the user**

State the build result. Safari needs a manual `xcrun safari-web-extension-converter .output/chrome-mv3` step on macOS, which cannot run in this environment — tell the user this is the remaining manual step for Safari, and that Chrome/Firefox are verified.

No commit for this task; it only confirms the existing code builds for a second target.

---

## Self-Review

**Spec coverage:**
- URL rules for `/documentation`, `/tutorials`, `/design` -> Task 2.
- Existence check with HEAD + ranged GET fallback -> Task 3.
- Injection point `#app-main .documentation-hero__content`, before `.topictitle`, with the two documented fallbacks -> Task 4.
- SPA navigation via MutationObserver -> Task 5.
- Real `<a>` elements, no click handlers -> Task 4 (`buildButton`).
- Visual design tokens (light/dark, font stack, radius, weight) -> Task 5 (`styles.css`).
- No popup/options/storage -> confirmed in Task 1 (removed from scaffold) and Global Constraints.
- Working verification against the real site -> Task 6.
- Cross-browser (Chrome/Firefox build, Safari manual step documented) -> Task 1 (Chrome default), Task 7 (Firefox), Task 7 (Safari note).

**Placeholder scan:** none found; every step has real code or a real command.

**Type consistency:** `ButtonLinks`, `findAnchor`, `buildButtonRow`, `mountButtonRow`, `removeButtonRow`, `getMarkdownUrl`, `getJsonUrl`, `urlExists` are used with the same names and signatures across Tasks 2, 3, 4, and 5.
