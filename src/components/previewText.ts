import { sanitizeRichText } from "@/lib/rich-text";
import styles from "./rich-content.module.css";

const previewHtml = new WeakMap<
  HTMLElement,
  { source: string; rendered: string }
>();

export function paintPreviewText(
  node: HTMLElement,
  value: string,
  kind: "text" | "inline" | "html",
) {
  if (kind === "text") {
    if (node.childElementCount || node.textContent !== value)
      node.textContent = value;
    return;
  }

  let cached = previewHtml.get(node);
  if (cached?.source !== value) {
    const container = node.ownerDocument.createElement("div");
    if (value) {
      const wrapper = node.ownerDocument.createElement(
        kind === "html" ? "div" : "span",
      );
      wrapper.className =
        kind === "html"
          ? `rich-content ${styles.content}`
          : "rich-inline inline-copy";
      wrapper.innerHTML = sanitizeRichText(value);
      container.append(wrapper);
    }
    cached = { source: value, rendered: container.innerHTML };
    previewHtml.set(node, cached);
  }

  // Preview image bindings are added after rendering. Ignore those decorations.
  const currentHtml = node.querySelector("[data-cms-rich-image]")
    ? undecoratedHtml(node)
    : node.innerHTML;
  if (currentHtml !== cached.rendered) node.innerHTML = cached.rendered;
}

function undecoratedHtml(node: HTMLElement) {
  const clone = node.cloneNode(true) as HTMLElement;
  for (const image of clone.querySelectorAll("[data-cms-rich-image]")) {
    for (const attribute of [
      "data-cms",
      "data-cms-kind",
      "data-cms-rich-image",
    ])
      image.removeAttribute(attribute);
  }
  return clone.innerHTML;
}

export function previewInlineValue(node: HTMLElement) {
  const formatted = node.matches(".rich-inline")
    ? node
    : node.querySelector(":scope > .rich-inline");
  return formatted?.innerHTML ?? node.innerText;
}

export function hasInlineFormatting(html: string) {
  return /<(?:strong|b|em|i|u|s|strike|mark|a|sup|sub)\b|\sstyle="/i.test(html);
}

export const removedFieldCss = `
[data-cms-removed] {
  display: inline-block !important;
  min-width: 72px !important;
  min-height: 28px !important;
  border-color: transparent !important;
  background: transparent !important;
  color: transparent !important;
  font-size: 0 !important;
  box-shadow: none !important;
  outline: 2px dashed #bd2525 !important;
  outline-offset: 2px;
}
[data-cms-removed] > * { display: none !important; }
`;
