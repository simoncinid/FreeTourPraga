"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { guideImage } from "@/lib/guide-media";
import { guidePath } from "@/lib/public-paths";
import type { SiteContent } from "@/lib/platform/content";
import { scrollWindowToTop } from "@/lib/scroll-window";
import styles from "./blog-guide-list.module.css";

type Guide = SiteContent["gallery"][number];

const PAGE_SIZE = {
  list: 5,
  grid: 6,
} as const;

export function BlogGuideList({
  items,
  layout,
}: {
  items: Guide[];
  layout: "list" | "grid";
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE[layout];

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function goToPage(next: number) {
    setPage(next);
    scrollWindowToTop();
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Cerca una guida o un consiglio…"
          aria-label="Cerca articoli"
        />
      </label>

      {filtered.length ? (
        <div className={layout === "grid" ? styles.grid : styles.list}>
          {visible.map((guide) => (
            <Link
              key={guide.title}
              data-cms-reference="article"
              href={guidePath(guide)}
              className={`${styles.article} card overflow-hidden no-underline text-inherit`}
            >
              <div className={styles.articleMedia}>
                <Image
                  src={guideImage(guide)}
                  alt={guide.title}
                  fill
                  sizes={
                    layout === "list"
                      ? "(min-width: 768px) 240px, 27vw"
                      : "(min-width: 768px) 33vw, 86vw"
                  }
                  className="object-cover"
                />
              </div>
              <div className={styles.articleBody}>
                <h2 className={`title-md ${styles.articleTitle}`}>
                  {guide.title}
                </h2>
                <p className={`body-sm ${styles.articleCaption}`}>
                  {guide.caption}
                </p>
                <span className={styles.articleCta}>
                  Leggi la guida <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="card body-md p-8 text-center">
          {query.trim()
            ? `Nessun articolo corrisponde a “${query.trim()}”.`
            : "Nessuna guida in questo elenco."}
        </p>
      )}
      {filtered.length > pageSize && (
        <nav className={styles.pagination} aria-label="Pagine degli articoli">
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina precedente"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span aria-live="polite">
            Pagina {currentPage} di {totalPages}
          </span>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina successiva"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
