const DATA_PATH_PREFIX = "/tutorials/data/";

function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

export function getMarkdownUrl(rawPathname: string): string | null {
  const pathname = stripTrailingSlash(rawPathname);
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

export function getJsonUrl(rawPathname: string): string | null {
  const pathname = stripTrailingSlash(rawPathname);
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
