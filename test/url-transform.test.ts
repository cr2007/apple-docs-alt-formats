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

  test("strips a trailing slash before appending .md", () => {
    expect(getMarkdownUrl("/documentation/swiftui/view/")).toBe(
      "/documentation/swiftui/view.md"
    );
  });

  test("strips a trailing slash before adding the tutorials/data prefix", () => {
    expect(getMarkdownUrl("/design/human-interface-guidelines/")).toBe(
      "/tutorials/data/design/human-interface-guidelines.md"
    );
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

  test("strips a trailing slash before adding the tutorials/data prefix", () => {
    expect(getJsonUrl("/design/human-interface-guidelines/")).toBe(
      "/tutorials/data/design/human-interface-guidelines.json"
    );
  });
});
