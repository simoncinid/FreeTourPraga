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
}: {
  block: Extract<BlogBlock, { type: "image" | "split" }>;
}) {
  return (
    <figure className={styles.figure}>
      <Image
        src={block.imageUrl}
        alt={block.alt}
        width={1200}
        height={800}
        sizes="(min-width: 1152px) 1120px, calc(100vw - 32px)"
        className={styles.bodyImage}
      />
      {block.caption && <figcaption>{block.caption}</figcaption>}
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
            <h1>{guide.title}</h1>
            <p>{guide.caption}</p>
            <span className={styles.copyRule} aria-hidden />
          </div>
          <div className={styles.cover}>
            <Image
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
              <div className={`${styles.prose} ${styles.intro}`}>
                <Paragraphs text={guide.intro} />
              </div>
            )}
            {(guide.blocks ?? []).map((block, index) => {
              if (block.type === "text")
                return (
                  <section key={index} className={styles.prose}>
                    {block.heading && <h2>{block.heading}</h2>}
                    {block.html ? <RichContent html={block.html} /> : <Paragraphs text={block.text} />}
                  </section>
                );
              if (block.type === "image")
                return (
                  <div key={index} className={styles.wide}>
                    <ArticleImage block={block} />
                  </div>
                );
              return (
                <section key={index} className={styles.split}>
                  <div className={styles.splitCopy}>
                    {block.heading && <h2>{block.heading}</h2>}
                    <Paragraphs text={block.text} />
                  </div>
                  <ArticleImage block={block} />
                </section>
              );
            })}
            {cta && (
              <div className={styles.articleCta}>
                <Link href={cta.href} className="button-primary">
                  {cta.label}
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>
            )}
          </div>
        ) : null}
        <footer className={styles.articleFooter}>
          <Link href="/blog">
            <ArrowLeft size={16} aria-hidden />
            Torna a tutte le guide
          </Link>
        </footer>
      </div>
    </article>
  );
}
