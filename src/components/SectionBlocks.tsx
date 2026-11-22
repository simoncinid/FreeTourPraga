import Image from "next/image";
import type { ContentSectionBlock } from "@/lib/types";
export function SectionBlocks({
  blocks = [],
}: {
  blocks?: ContentSectionBlock[];
}) {
  return (
    <div className="grid gap-8">
      {blocks.map((b, i) => (
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
              {b.heading && <h2 className="display-md mb-3">{b.heading}</h2>}
              <p className="body-md whitespace-pre-wrap">{b.text}</p>
            </div>
          )}
          {b.type !== "text" && b.imageUrl && (
            <figure>
              <Image
                src={b.imageUrl}
                alt={b.alt}
                width={1200}
                height={800}
                className="h-auto w-full rounded-xl object-cover"
              />
              {b.caption && (
                <figcaption className="mt-2 text-sm">{b.caption}</figcaption>
              )}
            </figure>
          )}
        </section>
      ))}
    </div>
  );
}
