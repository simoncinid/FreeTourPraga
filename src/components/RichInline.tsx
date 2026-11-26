import { richHasText, sanitizeRichText } from "@/lib/rich-text";
import type { HTMLAttributes, ReactNode } from "react";

/** Inline HTML snippet for titles / short labels (no wrapper block). */
export function RichInline({
  html,
  as: Tag = "span",
  className,
  ...rest
}: {
  html: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "strong";
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={className ? `rich-inline ${className}` : "rich-inline"}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
      {...rest}
    />
  );
}

export function InlineCopy({ html, children }: { html?: string; children: ReactNode }) {
  return richHasText(html) ? <RichInline html={html!} className="inline-copy" /> : children;
}
