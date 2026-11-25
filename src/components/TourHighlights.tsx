"use client";

import { RichContent } from "./RichContent";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./tour-panels.module.css";

type HighlightRow = {
  text: string;
  html?: string;
  images: string[];
  index?: number;
};

export function TourHighlights({ items }: { items: HighlightRow[] }) {
  const titleId = useId();
  const [open, setOpen] = useState<{
    row: number;
    index: number;
  } | null>(null);

  const activeImages = open ? items[open.row]?.images || [] : [];
  const activeSrc = open ? activeImages[open.index] : null;
  const activeLabel = open ? items[open.row]?.text : "";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowLeft") {
        setOpen((current) => {
          if (!current) return current;
          const total = items[current.row]?.images.length || 0;
          if (total < 2) return current;
          return {
            ...current,
            index: (current.index - 1 + total) % total,
          };
        });
      }
      if (event.key === "ArrowRight") {
        setOpen((current) => {
          if (!current) return current;
          const total = items[current.row]?.images.length || 0;
          if (total < 2) return current;
          return {
            ...current,
            index: (current.index + 1) % total,
          };
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, items]);

  return (
    <>
      <div className={styles.highlightList}>
        {items.map((item, row) => (
          <div key={row} className={styles.highlightRow}>
            <div className={styles.highlightCopy}>
              <CheckCircle2 className="shrink-0 text-primary" size={22} />
              <div className="body-md"
                data-tour-field={item.html ? `formattedCopy.highlights.${item.index ?? row}` : `highlights.${item.index ?? row}`}
                data-tour-kind={item.html ? "html" : "text"}>
                {item.html ? <RichContent html={item.html} /> : item.text}
              </div>
            </div>
            {item.images.length > 0 && (
              <div className={styles.highlightThumbs}>
                {item.images.slice(0, 4).map((src, index) => (
                  <button
                    key={`${item.text}-${src}-${index}`}
                    type="button"
                    className={styles.highlightThumb}
                    aria-label={`Apri foto ${index + 1}: ${item.text}`}
                    onClick={() => setOpen({ row, index })}
                  >
                    <Image
                      data-tour-field={`highlightGalleries.${item.index ?? row}.${index}`}
                      data-tour-kind="image"
                      src={src}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {open && activeSrc && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            className={styles.lightboxClose}
            aria-label="Chiudi galleria"
            onClick={() => setOpen(null)}
          >
            <X size={22} />
          </button>
          <p id={titleId} className={styles.lightboxCaption}>
            {activeLabel}
          </p>
          {activeImages.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              aria-label="Foto precedente"
              onClick={(event) => {
                event.stopPropagation();
                setOpen({
                  row: open.row,
                  index:
                    (open.index - 1 + activeImages.length) %
                    activeImages.length,
                });
              }}
            >
              <ChevronLeft size={28} />
            </button>
          )}
          <div
            className={styles.lightboxStage}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeSrc}
              alt={activeLabel || "Foto del tour"}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
          {activeImages.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              aria-label="Foto successiva"
              onClick={(event) => {
                event.stopPropagation();
                setOpen({
                  row: open.row,
                  index: (open.index + 1) % activeImages.length,
                });
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
