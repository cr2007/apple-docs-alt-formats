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
