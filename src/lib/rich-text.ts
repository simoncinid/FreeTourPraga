import sanitizeHtml from "sanitize-html";

/** Text formatting and links only; no WordPress classes, forms, scripts or embeds. */
export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "a",
      "ul",
      "ol",
      "li",
      "br",
      "hr",
      "blockquote",
      "figure",
      "figcaption",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "sup",
      "sub",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      "*": ["id"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => {
      if (frame.tag !== "img") return false;
      const src = frame.attribs.src || "";
      if (
        /^\/api\/media\/[-a-f0-9]{36}\.webp$/.test(src) ||
        /^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|webp|jpe?g|avif)$/.test(
          src,
        )
      )
        return false;
      if (
        src.startsWith("/wp-content/uploads/") &&
        !/[\\?#\u0000]/.test(src) &&
        !src.includes("..")
      )
        return false;
      try {
        const url = new URL(src);
        return !(
          url.protocol === "https:" &&
          (url.hostname === "images.unsplash.com" ||
            (!!process.env.MEDIA_PUBLIC_BASE &&
              url.origin === new URL(process.env.MEDIA_PUBLIC_BASE).origin))
        );
      } catch {
        return true;
      }
    },
  });
}
