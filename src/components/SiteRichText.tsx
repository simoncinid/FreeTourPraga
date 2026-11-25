import type { SiteContent } from "@/lib/platform/content";
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
      {html ? <RichContent html={html} /> : text}
    </div>
  );
}
