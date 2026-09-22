import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
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
    expect(row.id).toBe("adde-button-row");
    const links = row.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.id).toBe("adde-button-markdown");
    expect(links[0]?.getAttribute("href")).toBe("/a.md");
    expect(links[0]?.textContent).toBe("Markdown");
    expect(links[1]?.id).toBe("adde-button-json");
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
