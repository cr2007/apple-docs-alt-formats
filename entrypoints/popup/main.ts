const SOURCE_URL = "https://github.com/cr2007/apple-docs-alt-formats";
const AUTHOR = "CSK";

/**
 * Populates the popup with the extension's own metadata: name,
 * version, build target, and build time. Everything except the
 * author line and source link is read live from the manifest and
 * WXT's build-time environment, so it never drifts out of sync with
 * an actual release.
 */
function renderPopup(): void {
  const manifest = browser.runtime.getManifest();

  // Step 1: identity, read straight from the built manifest.
  setText("name", manifest.name);
  setText("description", manifest.description ?? "");
  setText("version", manifest.version);

  // Step 2: build metadata, from WXT's compile-time constants.
  setText(
    "target",
    `${import.meta.env.BROWSER} (Manifest V${import.meta.env.MANIFEST_VERSION})`
  );
  setText("build-time", new Date(__BUILD_TIME__).toLocaleString());

  // Step 3: static author/source info.
  setText("author", AUTHOR);
  const link = document.getElementById("source-link");
  if (link instanceof HTMLAnchorElement) {
    link.href = SOURCE_URL;
  }
}

function setText(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

renderPopup();
