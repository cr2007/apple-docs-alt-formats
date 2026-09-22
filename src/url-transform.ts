/** A path under this prefix is already a rendered Markdown or JSON alternate, not a doc page. */
const DATA_PATH_PREFIX = "/tutorials/data/";

/** `/documentation/*` pages serve Markdown directly, with no `/tutorials/data` prefix. */
const DIRECT_MARKDOWN_PREFIX = "/documentation/";

/** Sections whose Markdown and JSON alternates both live under `/tutorials/data`. */
const REWRITE_PREFIXES = ["/documentation/", "/tutorials/", "/design/"];

/**
 * Removes a single trailing slash, so `/design/foo/` and `/design/foo`
 * produce the same alternate URL. Leaves the root path `/` untouched.
 *
 * Step 1.1: normalize the pathname before any prefix check runs, so
 * every rule below only ever sees a slash-free path.
 */
function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * Builds the `/tutorials/data` alternate path for a normalized pathname.
 *
 * Step 1.2: every rewritten alternate (JSON always, Markdown outside
 * `/documentation`) shares this exact shape, so it lives in one place.
 */
function toDataPath(pathname: string, extension: "md" | "json"): string {
  return `/tutorials/data${pathname}.${extension}`;
}

/**
 * Returns whether a normalized pathname is one of the sections Apple
 * publishes Markdown/JSON alternates for.
 */
function isSupportedSection(pathname: string): boolean {
  return REWRITE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Computes the Markdown alternate URL for an Apple Developer Docs page.
 *
 * `/documentation/*` pages serve Markdown at the same path with `.md`
 * appended. `/tutorials/*` and `/design/*` pages serve it under
 * `/tutorials/data` instead. Every other path, and a path that is
 * already a `/tutorials/data` alternate, has no Markdown version.
 *
 * @param rawPathname - `location.pathname` from the current page, with
 *   or without a trailing slash.
 * @returns The Markdown alternate path, or `null` if the page has none.
 */
export function getMarkdownUrl(rawPathname: string): string | null {
  // Step 2.1: normalize, then reject an already-rendered alternate.
  const pathname = stripTrailingSlash(rawPathname);
  if (pathname.startsWith(DATA_PATH_PREFIX)) {
    return null;
  }

  // Step 2.2: /documentation pages serve Markdown directly, no rewrite.
  if (pathname.startsWith(DIRECT_MARKDOWN_PREFIX)) {
    return `${pathname}.md`;
  }

  // Step 2.3: every other supported section is rewritten under
  // /tutorials/data. An unsupported section has no Markdown alternate.
  if (isSupportedSection(pathname)) {
    return toDataPath(pathname, "md");
  }
  return null;
}

/**
 * Computes the JSON alternate URL for an Apple Developer Docs page.
 *
 * Unlike Markdown, every supported section's JSON alternate lives
 * under `/tutorials/data`, `/documentation/*` included. A path outside
 * the three supported sections, or already a `/tutorials/data`
 * alternate, has no JSON version.
 *
 * @param rawPathname - `location.pathname` from the current page, with
 *   or without a trailing slash.
 * @returns The JSON alternate path, or `null` if the page has none.
 */
export function getJsonUrl(rawPathname: string): string | null {
  // Step 3.1: normalize, then reject an already-rendered alternate.
  const pathname = stripTrailingSlash(rawPathname);
  if (pathname.startsWith(DATA_PATH_PREFIX)) {
    return null;
  }

  // Step 3.2: any supported section's JSON alternate is always
  // rewritten under /tutorials/data, with no direct-serve case.
  if (!isSupportedSection(pathname)) {
    return null;
  }
  return toDataPath(pathname, "json");
}
