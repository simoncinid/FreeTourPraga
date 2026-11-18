"use client";

import { tourPath } from "@/lib/public-paths";
import styles from "./public-ui.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QuickBooking } from "@/components/QuickBooking";
import { ArrowUpRight, Pointer } from "lucide-react";
import { Clock, Footprints, MapPin } from "@/components/FlatIcons";
import { formatMoney, minutesToLabel } from "@/lib/format";
import type { Tour } from "@/lib/types";

export function TourCard({ tour, title }: { tour: Tour; title?: string }) {
  const [booking, setBooking] = useState(false);
  const name = title || tour.title;
  const href = tourPath(tour);

  return (
    <>
    <article
      className={`${styles.tourCard} card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card`}
    >
      <Link href={href} className="relative aspect-[4/3] block overflow-hidden">
        <Image
          src={tour.imageUrl}
          alt={name}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover"
        />
      </Link>
      <div className="grid flex-1 gap-3 p-4">
        <Link href={href} className={`title-md no-underline text-ink ${styles.tourCardTitle}`}>
          {name}
        </Link>
        <p className={`body-sm ${styles.tourCardDesc}`}>{tour.shortDescription}</p>
        <div className="grid gap-2 text-sm text-muted">
          <span className="flex items-center gap-2">
            <Clock size={16} /> {minutesToLabel(tour.durationMinutes)}
            <span aria-hidden>–</span>
            <span>In italiano 🇮🇹</span>
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} /> {tour.meetingPoint}
          </span>
          <span
            className="flex items-center gap-2"
            aria-label={`Difficoltà a piedi: ${tour.walkingDifficulty} su 5`}
          >
            <Footprints size={16} /> {tour.walkingLabel || "A piedi"}{" "}
            <span className="ml-1 flex gap-0.5">
              {Array.from({ length: 5 }, (_, index) => (
                <Footprints
                  key={index}
                  size={14}
                  className={
                    index < tour.walkingDifficulty
                      ? "text-ink/70"
                      : "text-hairline"
                  }
                  fill="currentColor"
                />
              ))}
            </span>
          </span>
        </div>
        <div className="mt-auto grid gap-3 border-t border-hairline-soft pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {tour.priceLabel ? "" : "da "}
              <strong className="text-base text-ink">
                {tour.priceLabel || formatMoney(tour.basePriceCents)}
              </strong>
            </span>
            <button
              type="button"
              className={styles.tourCardCartCompact}
              onClick={() => setBooking(true)}

            >
              <Pointer size={15} strokeWidth={2.25} aria-hidden />
              Prenota
            </button>
          </div>
          <Link href={href} className={styles.tourCardCtaWide}>
            Scopri di più
            <ArrowUpRight
              size={15}
              className={styles.tourCardCtaArrow}
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
    {booking && <QuickBooking tour={tour} onClose={() => setBooking(false)} />}
    </>
  );
}
