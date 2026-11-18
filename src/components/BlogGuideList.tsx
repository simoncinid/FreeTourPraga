"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CardCarousel } from "@/components/CardCarousel";
import { guideImage } from "@/lib/guide-media";
import { guidePath } from "@/lib/public-paths";
import type { SiteContent } from "@/lib/platform/content";
import styles from "./blog-guide-list.module.css";

type Guide = SiteContent["gallery"][number];

export function BlogGuideList({ items }: { items: Guide[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it");
    if (!q) return items;
    return items.filter((guide) => {
      const haystack = [
        guide.title,
        guide.caption,
        guide.intro || "",
        guide.imageAlt || "",
      ]
        .join(" ")
        .toLocaleLowerCase("it");
      return haystack.includes(q);
    });
  }, [items, query]);

  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca una guida o un consiglio…"
          aria-label="Cerca articoli"
        />
      </label>

      {filtered.length ? (
        <CardCarousel
          key={query}
          label="Articoli del blog"
          autoPlay={false}
        >
          {filtered.map((guide) => (
            <Link
              key={guide.title}
              href={guidePath(guide)}
              className={`${styles.article} card overflow-hidden no-underline text-inherit`}
            >
              <div className={styles.articleMedia}>
                <Image
                  src={guideImage(guide)}
                  alt={guide.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 86vw"
                  className="object-cover"
                />
              </div>
              <div className={styles.articleBody}>
                <h2 className={`title-md ${styles.articleTitle}`}>{guide.title}</h2>
                <p className={`body-sm ${styles.articleCaption}`}>{guide.caption}</p>
                <span className={styles.articleCta}>
                  Leggi la guida <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </CardCarousel>
      ) : (
        <p className="card body-md p-8 text-center">
          Nessun articolo corrisponde a “{query.trim()}”.
        </p>
      )}
    </div>
  );
}
