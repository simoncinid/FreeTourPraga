import sanitizeHtml from "sanitize-html";

/** True when HTML (or plain) contains visible text after stripping tags. */
export function richHasText(value?: string | null) {
  if (!value) return false;
  return Boolean(
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** Prefer rich HTML when it has visible text; otherwise plain. */
export function richOrPlain(html?: string | null, plain?: string | null) {
  return richHasText(html) ? String(html) : plain || "";
}

const fontSizeNames = [
  "xx-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
] as const;

/** Convert legacy <font> (execCommand) into <span style="…"> before sanitize strips them. */
export function normalizeLegacyFonts(html: string) {
  if (!html.includes("<font")) return html;
  return html.replace(
    /<font\b([^>]*)>([\s\S]*?)<\/font>/gi,
    (_match, attrs: string, inner: string) => {
      const styles: string[] = [];
      const face = /\bface\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const color = /\bcolor\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const size = /\bsize\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const faceValue = face?.[1] || face?.[2] || face?.[3];
      const colorValue = color?.[1] || color?.[2] || color?.[3];
      const sizeValue = Number(size?.[1] || size?.[2] || size?.[3] || "");
      if (faceValue) styles.push(`font-family: ${faceValue}`);
      if (colorValue) styles.push(`color: ${colorValue}`);
      if (sizeValue >= 1 && sizeValue <= 7)
        styles.push(`font-size: ${fontSizeNames[sizeValue - 1]}`);
      if (!styles.length) return inner;
      return `<span style="${styles.join("; ")}">${inner}</span>`;
    },
  );
}

/** Text formatting and links only; no WordPress classes, forms, scripts or embeds. */
export function sanitizeRichText(html: string) {
  return sanitizeHtml(normalizeLegacyFonts(html), {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "mark",
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
      "*": ["id", "style"],
    },
    allowedStyles: {
      "*": {
        "font-family": [/^[a-zA-Z0-9 ,'"]+$/],
        "font-size": [/^(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|\d{1,2}(?:\.\d+)?(?:px|pt|em|rem|%))$/],
        "font-weight": [/^(?:normal|bold|[1-9]00)$/],
        "font-style": [/^(?:normal|italic|oblique)$/],
        "text-decoration": [/^(?:none|(?:underline|line-through)(?: (?:underline|line-through))?)$/],
        "text-decoration-line": [/^(?:none|(?:underline|line-through)(?: (?:underline|line-through))?)$/],
        "text-align": [/^(?:left|right|center|justify|start|end)$/],
        color: [
          /^#[a-f\d]{3,8}$/i,
          /^rgba?\([\d.,%\s]+\)$/i,
          /^hsla?\([\d.,%\s]+\)$/i,
          /^[a-z]+$/i,
        ],
        "background-color": [
          /^#[a-f\d]{3,8}$/i,
          /^rgba?\([\d.,%\s]+\)$/i,
          /^hsla?\([\d.,%\s]+\)$/i,
          /^[a-z]+$/i,
        ],
      },
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
