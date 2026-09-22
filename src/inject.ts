/** The two alternate URLs a button row can link to. Either may be absent. */
export interface ButtonLinks {
  markdownUrl: string | null;
  jsonUrl: string | null;
}

/**
 * Shared as both the row's `id` and its `class`: one page mounts at
 * most one row, so the same name works for direct lookup and styling.
 */
const ROW_ID_AND_CLASS = "adde-button-row";
const BUTTON_CLASS = "adde-button";
const MARKDOWN_BUTTON_ID = "adde-button-markdown";
const JSON_BUTTON_ID = "adde-button-json";

/**
 * Finds the element the button row should be inserted directly before.
 *
 * Tries three DocC page shapes in order, matching the spec's documented
 * fallback chain:
 * Step 1.1: `.topictitle` inside `#app-main .documentation-hero__content`
 *   (a normal `/documentation` page).
 * Step 1.2: the hero content's first child (a page with no eyebrow/title
 *   block, so the row is simply prepended).
 * Step 1.3: the first `h1` anywhere in `#app-main` (a `/tutorials` or
 *   `/design` page without the hero wrapper).
 *
 * @param root - The document (or a subtree of it) to search.
 * @returns The element to insert before, or `null` if none of the three
 *   shapes matched.
 */
export function findAnchor(root: ParentNode): Element | null {
  const heroContent = root.querySelector(
    "#app-main .documentation-hero__content"
  );
  if (heroContent) {
    const topicTitle = heroContent.querySelector(":scope > .topictitle");
    if (topicTitle) {
      return topicTitle;
    }
    return heroContent.firstElementChild ?? heroContent;
  }
  return root.querySelector("#app-main h1");
}

/**
 * Builds the button row element, with one link per available alternate.
 *
 * @param links - Which alternates to render. A `null` url omits that button.
 * @param doc - The document to create elements in.
 * @returns A detached `<div>` containing zero, one, or two `<a>` buttons.
 */
export function buildButtonRow(
  links: ButtonLinks,
  doc: Document
): HTMLElement {
  const row = doc.createElement("div");
  row.id = ROW_ID_AND_CLASS;
  row.className = ROW_ID_AND_CLASS;

  if (links.markdownUrl) {
    row.appendChild(
      buildButton(links.markdownUrl, "Markdown", MARKDOWN_BUTTON_ID, doc)
    );
  }
  if (links.jsonUrl) {
    row.appendChild(buildButton(links.jsonUrl, "JSON", JSON_BUTTON_ID, doc));
  }

  return row;
}

/**
 * Builds one button as a real link, never a click handler, so the
 * browser's native right-click menu (open in new tab, copy link) works.
 */
function buildButton(
  url: string,
  label: string,
  id: string,
  doc: Document
): HTMLAnchorElement {
  const link = doc.createElement("a");
  link.id = id;
  link.className = BUTTON_CLASS;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

/**
 * Mounts a button row into the page, replacing any row already there.
 *
 * Step 2.1: remove an existing row first, so repeated calls (on route
 * change) never leave two rows stacked.
 * Step 2.2: find the anchor element; if the page has none of the three
 * known shapes, there is nowhere to mount and the row is dropped.
 * Step 2.3: insert the row as the anchor's previous sibling.
 *
 * @param root - The document to mount into.
 * @param row - A row built by {@link buildButtonRow}.
 * @returns `true` if the row was mounted, `false` if no anchor was found.
 */
export function mountButtonRow(root: ParentNode, row: HTMLElement): boolean {
  removeButtonRow(root);

  const anchor = findAnchor(root);
  if (!anchor?.parentElement) {
    return false;
  }

  anchor.parentElement.insertBefore(row, anchor);
  return true;
}

/** Removes the mounted button row, if one is present. A no-op otherwise. */
export function removeButtonRow(root: ParentNode): void {
  root.querySelector(`.${ROW_ID_AND_CLASS}`)?.remove();
}
