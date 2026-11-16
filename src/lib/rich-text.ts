import sanitizeHtml from "sanitize-html";

/** Text formatting and links only; no WordPress classes, forms, scripts or embeds. */
export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "h4", "strong", "b", "em", "i", "a", "ul", "ol", "li", "br", "hr", "blockquote", "figure", "figcaption", "img", "table", "thead", "tbody", "tr", "th", "td", "sup", "sub", "span", "div"],
    allowedAttributes: {
      a: ["href", "title"], img: ["src", "alt", "width", "height", "loading", "decoding"],
      th: ["colspan", "rowspan"], td: ["colspan", "rowspan"], "*": ["id"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src?.startsWith("/wp-content/uploads/"),
  });
}
