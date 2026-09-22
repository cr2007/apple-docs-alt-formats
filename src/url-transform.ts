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
