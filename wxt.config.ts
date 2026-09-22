import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Apple Docs Alt Formats",
    description:
      "Add Markdown and JSON buttons to Apple Developer Documentation pages.",
    homepage_url: "https://github.com/cr2007/apple-docs-alt-formats",
  },
  vite: () => ({
    define: {
      // Baked in at build time, so the popup can show exactly when
      // this specific build was produced. See types.d.ts for the
      // matching ambient declaration.
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  }),
});
