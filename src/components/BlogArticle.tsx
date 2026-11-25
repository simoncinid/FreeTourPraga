import { articleEdit } from "@/lib/visual-content";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { guideCta, type GuideItem } from "@/lib/guides";
import { guideImage } from "@/lib/guide-media";
import type { BlogBlock } from "@/lib/platform/content";
import styles from "./blog-article.module.css";
import { RichContent } from "./RichContent";

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
}: {
  block: Extract<BlogBlock, { type: "image" | "split" }>;
  guide: GuideItem;
  index: number;
}) {
  return (
    <figure className={styles.figure}>
      <Image
        {...articleEdit(guide, `blocks.${index}.imageUrl`, "image")}
        src={block.imageUrl}
        alt={block.alt}
        width={1200}
        height={800}
        sizes="(min-width: 1152px) 1120px, calc(100vw - 32px)"
        className={styles.bodyImage}
      />
      {block.caption && (
        <figcaption {...articleEdit(guide, `blocks.${index}.caption`)}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function BlogArticle({ guide }: { guide: GuideItem }) {
  const cta = guideCta(guide);
  return (
    <article className={styles.article}>
      <div className={styles.shell}>
        <Link href="/blog" className={styles.back}>
          <ArrowLeft size={14} aria-hidden />
          Tutte le guide
        </Link>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>Il blog di FreeTourPraga</span>
            <h1 {...articleEdit(guide, "title")}>{guide.title}</h1>
            <p {...articleEdit(guide, "caption")}>{guide.caption}</p>
            <span className={styles.copyRule} aria-hidden />
          </div>
          <div className={styles.cover}>
            <Image
              {...articleEdit(guide, "imageUrl", "image")}
              src={guideImage(guide)}
              alt={guide.imageAlt || guide.title}
              fill
              preload
              sizes="(min-width: 1152px) 596px, (min-width: 768px) 54vw, calc(100vw - 32px)"
              className={styles.coverImage}
            />
          </div>
        </header>
        {guide.intro || guide.blocks?.length || cta ? (
          <div className={styles.body}>
            {guide.intro && (
              <div
                {...articleEdit(guide, "introHtml", "html")}
                className={`${styles.prose} ${styles.intro}`}
              >
                {guide.introHtml ? <RichContent html={guide.introHtml} /> : <Paragraphs text={guide.intro} />}
              </div>
            )}
            {(guide.blocks ?? []).map((block, index) => {
              if (block.type === "text")
                return (
                  <section key={index} className={styles.prose}>
                    {block.heading && (
                      <h2 {...articleEdit(guide, `blocks.${index}.heading`)}>
                        {block.heading}
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
                    <ArticleImage block={block} guide={guide} index={index} />
                  </div>
                );
              return (
                <section key={index} className={styles.split}>
                  <div className={styles.splitCopy}>
                    {block.heading && (
                      <h2 {...articleEdit(guide, `blocks.${index}.heading`)}>
                        {block.heading}
                      </h2>
                    )}
                    <div {...articleEdit(guide, `blocks.${index}.html`, "html")}>
                      {block.html ? <RichContent html={block.html} /> : <Paragraphs text={block.text} />}
                    </div>
                  </div>
                  <ArticleImage block={block} guide={guide} index={index} />
                </section>
              );
            })}
            {cta && (
              <div className={styles.articleCta}>
                <Link href={cta.href} className="button-primary">
                  <span
                    {...articleEdit(guide, "ctaLabel")}
                    data-cms-href={JSON.stringify({
                      scope: "article",
                      key: guide.id || `guide:${guide.title}`,
                      path: ["ctaHref"],
                    })}
                  >
                    {cta.label}
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
            className={`button-primary ${styles.articleFooterCta}`}
          >
            <ArrowLeft size={16} aria-hidden />
            Torna a tutte le guide
          </Link>
        </footer>
      </div>
    </article>
  );
}
