/** A HEAD response with this status means the server rejects the HEAD method itself. */
const METHOD_NOT_ALLOWED = 405;

/**
 * Checks whether a URL resolves, without downloading its body.
 *
 * Step 1: try a `HEAD` request. Its status decides the result directly,
 * unless the server rejects `HEAD` outright (some CDNs do).
 * Step 2: only then fall back to a ranged `GET` (`bytes=0-0`), which
 * still avoids downloading the full response.
 * A network error at either step is treated as "does not exist," never
 * thrown, so a caller can await this directly before deciding to show
 * a button.
 *
 * @param url - The absolute URL to check.
 * @returns `true` if the URL resolves with a successful status.
 */
export async function urlExists(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    if (headResponse.status !== METHOD_NOT_ALLOWED) {
      return headResponse.ok;
    }
  } catch {
    // The HEAD request failed outright (not just an HTTP error status).
    // Fall through to the GET fallback below instead of giving up.
  }

  try {
    const getResponse = await fetch(url, { headers: { Range: "bytes=0-0" } });
    return getResponse.ok;
  } catch {
    return false;
  }
}
