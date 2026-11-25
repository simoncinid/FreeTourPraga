import { pageEdit } from "@/lib/visual-content";
import { SectionBlocks } from "./SectionBlocks";
import type { ContentPage } from "@/lib/platform/model";
import { RichContent } from "./RichContent";
export function ContentBlock({
  page,
  pageKey,
}: {
  page: ContentPage;
  pageKey?: string;
}) {
  return (
    <section className="section">
      <div className="container-page max-w-4xl">
        <p
          {...(pageKey ? pageEdit(pageKey, "subtitle") : {})}
          className="micro-label text-primary"
        >
          {page.subtitle}
        </p>
        <h1
          {...(pageKey ? pageEdit(pageKey, "title") : {})}
          className="display-xl my-5"
        >
          {page.title}
        </h1>
        <div
          {...(pageKey
            ? pageEdit(
                pageKey,
                "bodyHtml", "html",
              )
            : {})}
          className="body-md whitespace-pre-wrap"
        >
          {page.bodyHtml ? <RichContent html={page.bodyHtml} /> : page.body}
        </div>
        <div className="mt-8">
          <SectionBlocks
            binding={
              pageKey
                ? { scope: "page", key: pageKey, path: ["contentBlocks"] }
                : undefined
            }
            blocks={page.contentBlocks}
          />
        </div>
      </div>
    </section>
  );
}
