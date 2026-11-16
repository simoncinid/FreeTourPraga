"use client";

import { tourPath } from "@/lib/public-paths";
import styles from "./public-ui.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Clock,
  Footprints,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { formatMoney, minutesToLabel } from "@/lib/format";
import { addToCart } from "@/lib/cart";
import type { Tour } from "@/lib/types";

export function TourCard({ tour, title }: { tour: Tour; title?: string }) {
  const router = useRouter();
  const name = title || tour.title;
  const href = tourPath(tour);
  const nextSlot = [...(tour.slots || [])]
    .filter((slot) => slot.capacity - slot.reserved >= 1)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )[0];

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!nextSlot) {
      router.push(href);
      return;
    }
    addToCart({
      tourSlug: tour.slug,
      tourTitle: tour.title,
      slotId: nextSlot.id,
      startsAt: nextSlot.startsAt,
      adults: 1,
      children: 0,
      infants: 0,
      unitInfantCents: tour.infantPriceCents,
      unitAdultCents: tour.basePriceCents,
      unitChildCents: tour.childPriceCents,
      imageUrl: tour.imageUrl,
    });
    router.push("/carrello?added=1");
  }

  return (
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
        <span className={styles.tourCardBadge}>In italiano 🇮🇹</span>
      </Link>
      <div className="grid flex-1 gap-3 p-4">
        <Link href={href} className="title-md no-underline text-ink">
          {name}
        </Link>
        <p className="body-sm line-clamp-2">{tour.shortDescription}</p>
        <div className="grid gap-2 text-sm text-muted">
          <span className="flex items-center gap-2">
            <Clock size={16} /> {minutesToLabel(tour.durationMinutes)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} /> {tour.meetingPoint}
          </span>
          <span
            className="flex items-center gap-2"
            aria-label={`Difficoltà a piedi: ${tour.walkingDifficulty} su 5`}
          >
            <Footprints size={16} /> A piedi{" "}
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
              onClick={handleAddToCart}
              disabled={tour.operationalReviewRequired}
              title={
                nextSlot
                  ? "Aggiungi la prossima partenza disponibile"
                  : "Apri il tour per scegliere data e orario"
              }
            >
              <ShoppingCart size={14} aria-hidden />
              Carrello
            </button>
          </div>
          <Link href={href} className={styles.tourCardCtaWide}>
            Scopri
            <ArrowUpRight
              size={15}
              className={styles.tourCardCtaArrow}
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
