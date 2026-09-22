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
