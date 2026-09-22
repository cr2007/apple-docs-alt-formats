import { getJsonUrl, getMarkdownUrl } from "../src/url-transform";
import { urlExists } from "../src/existence-check";
import { buildButtonRow, mountButtonRow, removeButtonRow } from "../src/inject";
import "../src/styles.css";

/**
 * Injects the Markdown/JSON button row into Apple Developer Docs pages.
 *
 * Apple's docs are a single-page app (DocC): navigating between pages
 * never reloads the document, so `main()` re-derives and re-mounts the
 * row on every route change, not just once at load.
 */
export default defineContentScript({
  matches: [
    "https://developer.apple.com/documentation/*",
    "https://developer.apple.com/tutorials/*",
    "https://developer.apple.com/design/*",
  ],
  main() {
    // Step 1: a generation counter discards a stale in-flight refresh.
    // Without it, a slow existence check from a page the user has
    // already navigated away from could mount stale buttons after a
    // newer refresh already finished.
    let generation = 0;

    // Step 2: watch document.body, not a captured #app-main reference,
    // so the subscription survives DocC ever replacing #app-main itself
    // instead of just mutating its children.
    const observer = new MutationObserver(() => {
      void refresh();
    });

    async function refresh() {
      const currentGeneration = ++generation;

      // Step 3: compute both alternate URLs and check them in parallel.
      // Either button can appear without the other.
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

      // Step 4: a newer refresh already started and will finish the
      // DOM write instead, so this stale one bails before touching it.
      if (currentGeneration !== generation) {
        return;
      }

      // Step 5: disconnect before writing to the DOM, then reconnect
      // after. Mounting or removing the row is itself a mutation; without
      // this, the observer would see its own write and refresh forever.
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
      observer.observe(document.body, { childList: true, subtree: true });
    }

    void refresh();
    observer.observe(document.body, { childList: true, subtree: true });
  },
});
