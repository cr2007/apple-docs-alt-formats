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
      observer.observe(document.body, { childList: true, subtree: true });
    }

    void refresh();
    observer.observe(document.body, { childList: true, subtree: true });
  },
});
