"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { TourPhoto } from "@/lib/types";
import styles from "./tour-gallery.module.css";

export function TourGallery({
  title,
  photos,
  editPaths,
  editable = false,
}: {
  title: string;
  photos: TourPhoto[];
  editPaths?: string[];
  editable?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [lastLoaded, setLastLoaded] = useState(photos[0]);
  const thumbnails = useRef<HTMLDivElement>(null);
  const active = photos[selected];
  const rows = Math.min(3, Math.ceil(photos.length / 2));
  if (!active) return null;

  function select(index: number) {
    const next = (index + photos.length) % photos.length;
    setSelected(next);
    const list = thumbnails.current;
    const button = list?.children[next] as HTMLElement | undefined;
    if (list && button) {
      const top = button.offsetTop;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (top + button.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = top + button.offsetHeight - list.clientHeight;
    }
  }

  return (
    <div
      className={`${styles.gallery} ${photos.length === 1 ? styles.single : ""}`}
      role="region"
      aria-roledescription="carosello"
      aria-label={`Foto del tour: ${title}`}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        select(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? photos.length - 1
              : selected + (event.key === "ArrowRight" ? 1 : -1),
        );
      }}
    >
      <div className={styles.main} aria-busy={lastLoaded?.url !== active.url}>
        {lastLoaded && lastLoaded.url !== active.url && (
          <Image
            src={lastLoaded.url}
            unoptimized={editable}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 768px) 70vw, 100vw"
            className={styles.photo}
          />
        )}
        <Image
          key={active.url}
          data-tour-field={editPaths?.[selected]}
          data-tour-kind="image"
          src={active.url}
          unoptimized={editable}
          alt={active.alt}
          fill
          preload={selected === 0}
          loading="eager"
          sizes="(min-width: 768px) 70vw, 100vw"
          className={styles.photo}
          onLoad={() => setLastLoaded(active)}
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.previous}`}
              aria-label="Foto precedente"
              onClick={() => select(selected - 1)}
            >
              <ChevronLeft aria-hidden="true" size={25} />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              aria-label="Foto successiva"
              onClick={() => select(selected + 1)}
            >
              <ChevronRight aria-hidden="true" size={25} />
            </button>
          </>
        )}
        <span className={styles.counter} aria-live="polite" aria-atomic="true">
          {selected + 1} / {photos.length}
        </span>
      </div>
      <div
        ref={thumbnails}
        className={styles.thumbnails}
        aria-label="Miniature del tour"
        style={{
          gridTemplateRows: `repeat(${rows}, calc((var(--gallery-height) - ${(rows - 1) * 12}px) / ${rows}))`,
        }}
      >
        {photos.map((photo, index) => (
          <button
            type="button"
            key={photo.url}
            className={styles.thumbnail}
            aria-label={`Mostra foto ${index + 1}: ${photo.alt}`}
            aria-pressed={selected === index}
            onClick={() => select(index)}
          >
            <Image
              data-tour-field={editPaths?.[index]}
              data-tour-kind="image"
              src={photo.url}
              unoptimized={editable}
              alt=""
              fill
              sizes="(min-width: 768px) 15vw, 25vw"
              className={styles.thumbnailPhoto}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
