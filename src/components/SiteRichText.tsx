import type { SiteContent } from "@/lib/platform/content";
import { richHasText } from "@/lib/rich-text";
import type { ReactNode } from "react";
import { InlineCopy } from "./RichInline";
import { siteEdit } from "@/lib/visual-content";
import { RichContent } from "./RichContent";

export function SiteRichText({
  content,
  path,
  text,
  className,
}: {
  content: Pick<SiteContent, "formattedText">;
  path: string;
  text: string;
  className?: string;
}) {
  const key = path.replaceAll(".", "-");
  const html = content.formattedText?.[key];
  return (
    <div {...siteEdit(`formattedText.${key}`, "html")} className={className}>
      {richHasText(html) ? <RichContent html={html!} /> : text}
    </div>
  );
}


export const siteInlineEdit = (path: string) =>
  siteEdit(`formattedText.${path.replaceAll(".", "-")}`, "inline");

export function SiteInlineText({
  content,
  path,
  children,
}: {
  content: Pick<SiteContent, "formattedText">;
  path: string;
  children: ReactNode;
}) {
  const html = content.formattedText?.[path.replaceAll(".", "-")];
  return <InlineCopy html={html}>{children}</InlineCopy>;
}
