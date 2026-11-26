import { cms, type ContentBinding } from "@/lib/visual-content";
import { RichInline } from "./RichInline";
import { RichContent } from "./RichContent";
import Image from "next/image";
import type { ContentSectionBlock } from "@/lib/types";
export function SectionBlocks({
  blocks = [],
  binding,
  tourEditable = false,
}: {
  blocks?: ContentSectionBlock[];
  binding?: ContentBinding;
  tourEditable?: boolean;
}) {
  return (
    <div className="grid gap-8">
      {blocks.map((b, i) => {
        const field = (name: string, kind: "text" | "image" | "html" | "inline" = "text") =>
          binding
            ? cms(
                { ...binding, path: [...binding.path, String(i), name] },
                kind,
              )
            : tourEditable
              ? {
                  "data-tour-field": `contentBlocks.${i}.${name}`,
                  "data-tour-kind": kind,
                }
              : {};
        return (
          <section
            key={i}
            className={
              b.type === "split"
                ? "grid items-center gap-6 md:grid-cols-2"
                : "grid gap-3"
            }
          >
            {b.type !== "image" && (
              <div
                className={
                  b.type === "split" && b.imagePosition === "left"
                    ? "md:order-2"
                    : ""
                }
              >
                {b.heading && (
                  <h2 {...field("headingHtml", "inline")} className="display-md mb-3">
                    {b.headingHtml ? <RichInline html={b.headingHtml} /> : b.heading}
                  </h2>
                )}
                <div {...field("html", "html")} className="body-md whitespace-pre-wrap">
                  {b.html ? <RichContent html={b.html} /> : b.text}
                </div>
              </div>
            )}
            {b.type !== "text" && b.imageUrl && (
              <figure>
                <Image
                  {...field("imageUrl", "image")}
                  src={b.imageUrl}
                  alt={b.alt}
                  width={1200}
                  height={800}
                  className="h-auto w-full rounded-xl object-cover"
                />
                {b.caption && (
                  <figcaption {...field("captionHtml", "inline")} className="mt-2 text-sm">
                    {b.captionHtml ? <RichInline html={b.captionHtml} /> : b.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </section>
        );
      })}
    </div>
  );
}
