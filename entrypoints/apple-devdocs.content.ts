export default defineContentScript({
  matches: [
    "https://developer.apple.com/documentation/*",
    "https://developer.apple.com/tutorials/*",
    "https://developer.apple.com/design/*",
  ],
  main() {
    console.debug("apple-devdocs-md-json-buttons: content script loaded");
  },
});
