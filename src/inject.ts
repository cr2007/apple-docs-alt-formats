export interface ButtonLinks {
  markdownUrl: string | null;
  jsonUrl: string | null;
}

const ROW_CLASS = "adde-button-row";
const ROW_ID = "adde-button-row";
const BUTTON_CLASS = "adde-button";
const MARKDOWN_BUTTON_ID = "adde-button-markdown";
const JSON_BUTTON_ID = "adde-button-json";

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

export function buildButtonRow(
  links: ButtonLinks,
  doc: Document
): HTMLElement {
  const row = doc.createElement("div");
  row.id = ROW_ID;
  row.className = ROW_CLASS;

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

export function mountButtonRow(root: ParentNode, row: HTMLElement): boolean {
  removeButtonRow(root);

  const anchor = findAnchor(root);
  if (!anchor?.parentElement) {
    return false;
  }

  anchor.parentElement.insertBefore(row, anchor);
  return true;
}

export function removeButtonRow(root: ParentNode): void {
  root.querySelector(`.${ROW_CLASS}`)?.remove();
}
