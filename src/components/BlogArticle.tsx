import { articleEdit } from "@/lib/visual-content";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { guideCta, type GuideItem } from "@/lib/guides";
import { guideImage } from "@/lib/guide-media";
import type { BlogBlock } from "@/lib/platform/content";
import styles from "./blog-article.module.css";
import { RichContent } from "./RichContent";
import { RemovedContentStyles } from "./RemovedContentStyles";
import { InlineCopy, RichInline } from "./RichInline";
import { richHasText } from "@/lib/rich-text";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter((paragraph) => paragraph.trim())
        .map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
    </>
  );
}

function ArticleImage({
  block,
  guide,
  index,
  preview,
}: {
  block: Extract<BlogBlock, { type: "image" | "split" }>;
  guide: GuideItem;
  index: number;
  preview: boolean;
}) {
  return (
    <figure className={styles.figure}>
      <Image
        {...articleEdit(guide, `blocks.${index}.imageUrl`, "image")}
        src={block.imageUrl}
        unoptimized={preview}
        alt={block.alt}
        width={1200}
        height={800}
        sizes="(min-width: 1152px) 1120px, calc(100vw - 32px)"
        className={styles.bodyImage}
      />
      {(block.caption || preview) && (
        <figcaption {...articleEdit(guide, `blocks.${index}.captionHtml`, "inline")}>
          {block.captionHtml ? <RichInline html={block.captionHtml} /> : block.caption || "Didascalia facoltativa"}
        </figcaption>
      )}
    </figure>
  );
}

export function BlogArticle({ guide, preview = false }: { guide: GuideItem; preview?: boolean }) {
  const cta = guideCta(guide);
  return (
    <article className={styles.article}>
      <RemovedContentStyles fields={guide.hiddenText ?? []} />
      <div className={styles.shell}>
        <Link href="/blog" data-cms-hide-parent className={styles.back}>
          <ArrowLeft size={14} aria-hidden />
          <span {...articleEdit(guide, "backLabel")}><InlineCopy html={guide.formattedText?.backLabel}>{guide.backLabel?.trim() || "Tutte le guide"}</InlineCopy></span>
        </Link>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker} {...articleEdit(guide, "kicker")}>
              <InlineCopy html={guide.formattedText?.kicker}>{guide.kicker?.trim() || "Il blog di FreeTourPraga"}</InlineCopy>
            </span>
            {richHasText(guide.titleHtml) ? (
              <RichInline
                as="h1"
                html={guide.titleHtml!}
                {...articleEdit(guide, "titleHtml", "inline")}
              />
            ) : (
              <h1 {...articleEdit(guide, "titleHtml", "inline")}>{guide.title}</h1>
            )}
            {richHasText(guide.captionHtml) ? (
              <RichInline
                as="p"
                html={guide.captionHtml!}
                {...articleEdit(guide, "captionHtml", "inline")}
              />
            ) : (
              <p {...articleEdit(guide, "captionHtml", "inline")}>{guide.caption}</p>
            )}
            <span className={styles.copyRule} aria-hidden />
          </div>
          <div className={styles.cover}>
            <Image
              {...articleEdit(guide, "imageUrl", "image")}
              src={guideImage(guide)}
              unoptimized={preview}
              alt={guide.imageAlt || guide.title}
              fill
              preload
              sizes="(min-width: 1152px) 596px, (min-width: 768px) 54vw, calc(100vw - 32px)"
              className={styles.coverImage}
            />
          </div>
        </header>
        {guide.intro || guide.blocks?.length || cta || preview ? (
          <div className={styles.body}>
            {(guide.intro || preview) && (
              <div
                {...articleEdit(guide, "introHtml", "html")}
                className={`${styles.prose} ${styles.intro}`}
              >
                {guide.introHtml ? <RichContent html={guide.introHtml} /> : guide.intro ? <Paragraphs text={guide.intro} /> : <p>Introduzione facoltativa</p>}
              </div>
            )}
            {(guide.blocks ?? []).map((block, index) => {
              if (block.type === "text")
                return (
                  <section key={index} className={styles.prose}>
                    {(block.heading || preview) && (
                      <h2 {...articleEdit(guide, `blocks.${index}.headingHtml`, "inline")}>
                        {block.headingHtml ? <RichInline html={block.headingHtml} /> : block.heading || "Titolo facoltativo"}
                      </h2>
                    )}
                    <div
                      {...articleEdit(
                        guide,
                        `blocks.${index}.html`,
                        "html",
                      )}
                    >
                      {block.html ? (
                        <RichContent html={block.html} />
                      ) : (
                        <Paragraphs text={block.text} />
                      )}
                    </div>
                  </section>
                );
              if (block.type === "image")
                return (
                  <div key={index} className={styles.wide}>
                    <ArticleImage block={block} guide={guide} index={index} preview={preview} />
                  </div>
                );
              return (
                <section key={index} className={styles.split}>
                  <div className={styles.splitCopy}>
                    {(block.heading || preview) && (
                      <h2 {...articleEdit(guide, `blocks.${index}.headingHtml`, "inline")}>
                        {block.headingHtml ? <RichInline html={block.headingHtml} /> : block.heading || "Titolo facoltativo"}
                      </h2>
                    )}
                    <div {...articleEdit(guide, `blocks.${index}.html`, "html")}>
                      {block.html ? <RichContent html={block.html} /> : <Paragraphs text={block.text} />}
                    </div>
                  </div>
                  <ArticleImage block={block} guide={guide} index={index} preview={preview} />
                </section>
              );
            })}
            {cta && (
              <div className={styles.articleCta}>
                <Link href={cta.href} data-cms-hide-parent className="button-primary">
                  <span
                    {...articleEdit(guide, "ctaLabel")}
                    data-cms-href={JSON.stringify({
                      scope: "article",
                      key: guide.id || `guide:${guide.title}`,
                      path: ["ctaHref"],
                    })}
                  >
                    <InlineCopy html={guide.formattedText?.ctaLabel}>{cta.label}</InlineCopy>
                  </span>
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>
            )}
          </div>
        ) : null}
        <footer className={styles.articleFooter}>
          <Link
            href="/blog"
            data-cms-hide-parent
            className={`button-primary ${styles.articleFooterCta}`}
          >
            <ArrowLeft size={16} aria-hidden />
            <span {...articleEdit(guide, "footerBackLabel")}><InlineCopy html={guide.formattedText?.footerBackLabel}>{guide.footerBackLabel?.trim() || "Torna a tutte le guide"}</InlineCopy></span>
          </Link>
        </footer>
      </div>
    </article>
  );
}
