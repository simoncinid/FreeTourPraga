"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { guidePath } from "@/lib/public-paths";
import { guideImage } from "@/lib/guide-media";
import type { SiteContent } from "@/lib/platform/content";

const PAGE_SIZE = 6; // desktop: 2 righe × 3 colonne

type Guide = SiteContent["gallery"][number];

export function HomeGallery({ items }: { items: Guide[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = items.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  if (!items.length) return null;

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((photo) => (
          <Link
            key={photo.title}
            href={guidePath(photo)}
            className="card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card"
          >
            <figure>
              <div className="relative aspect-[4/3]">
                <Image
                  src={guideImage(photo)}
                  alt={photo.title}
                  fill
                  sizes="(min-width:1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-5">
                <strong className="title-md">{photo.title}</strong>
                <p className="body-sm mt-2">{photo.caption}</p>
              </figcaption>
            </figure>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            className="button-secondary !px-3 !py-2"
            aria-label="Pagina precedente"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Pagine guide">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safePage}
                aria-label={`Pagina ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === safePage ? "bg-primary" : "bg-ink/20 hover:bg-ink/40"
                }`}
                onClick={() => setPage(i)}
              />
            ))}
          </div>
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
