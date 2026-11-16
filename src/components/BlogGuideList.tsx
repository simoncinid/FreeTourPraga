"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { guideImage } from "@/lib/guide-media";
import { guidePath } from "@/lib/public-paths";
import type { SiteContent } from "@/lib/platform/content";
import styles from "./blog-guide-list.module.css";

const PAGE_SIZE = 5;

type Guide = SiteContent["gallery"][number];

export function BlogGuideList({ items }: { items: Guide[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  function onSearch(value: string) {
    setQuery(value);
    setPage(0);
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cerca una guida o un consiglio…"
          aria-label="Cerca articoli"
        />
      </label>

      {slice.length ? (
        <div className="grid gap-8">
          {slice.map((guide) => (
            <Link
              key={guide.title}
              href={guidePath(guide)}
              className="card grid overflow-hidden no-underline text-inherit md:grid-cols-[280px_1fr]"
            >
              <div className="relative min-h-48">
                <Image
                  src={guideImage(guide)}
                  alt={guide.title}
                  fill
                  sizes="(min-width: 768px) 280px, 100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="display-md">{guide.title}</h2>
                <p className="body-md mt-4">{guide.caption}</p>
                <span className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-ink underline underline-offset-4">
                  Leggi la guida <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="card body-md p-8 text-center">
          Nessun articolo corrisponde a “{query.trim()}”.
        </p>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className={styles.pager}>
          <button
            type="button"
            className="button-secondary !px-3 !py-2"
            aria-label="Pagina precedente"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <div className={styles.pages} role="tablist" aria-label="Pagine articoli">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safePage}
                aria-label={`Pagina ${i + 1}`}
                className={`${styles.dot} ${i === safePage ? styles.dotActive : ""}`}
                onClick={() => setPage(i)}
              />
            ))}
          </div>
          <span className={styles.meta}>
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="button-secondary !px-3 !py-2"
            aria-label="Pagina successiva"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
