"use client";

import { tourHeadlinePrice } from "@/lib/participant-pricing";
import { TourFacts } from "./TourFacts";
import { tourPath } from "@/lib/public-paths";
import styles from "./public-ui.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QuickBooking } from "@/components/QuickBooking";
import { ArrowUpRight, Languages, Pointer } from "lucide-react";
import { Clock, Footprints, MapPin } from "@/components/FlatIcons";
import { RichContent } from "./RichContent";
import { minutesToLabel } from "@/lib/format";
import type { Tour } from "@/lib/types";

export function TourCard({ tour, title }: { tour: Tour; title?: string }) {
  const [booking, setBooking] = useState(false);
  const preview = tour.cardPreview;
  const name = preview?.title || title || tour.title;
  const intensity = Math.min(
    5,
    Math.max(1, Math.round(tour.walkingDifficulty || 1)),
  );
  const intensityLabel = [
    "Molto basso",
    "Basso",
    "Medio",
    "Alto",
    "Molto alto",
  ][intensity - 1];
  const href = tourPath(tour);
  const price = tourHeadlinePrice(tour);

  return (
    <>
      <article
        className={`${styles.tourCard} card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card`}
      >
        <Link
          href={href}
          className="relative aspect-[4/3] block overflow-hidden"
        >
          <Image
            src={tour.imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        </Link>
        <div className={styles.tourCardBody}>
          <Link href={href} className={`no-underline ${styles.tourCardTitle}`}>
            {name}
          </Link>
          {preview?.description || tour.formattedCopy?.shortDescription ? (
            <div className={styles.tourCardDesc}>
              <RichContent
                html={
                  (preview?.description ||
                    tour.formattedCopy?.shortDescription)!
                }
              />
            </div>
          ) : (
            <p className={styles.tourCardDesc}>{tour.shortDescription}</p>
          )}
          <details className={styles.tourCardItinerary}>
            <summary className="underline">
              {preview?.itineraryLabel || "Itinerario completo"}
            </summary>
            {preview?.itinerary ? (
              <RichContent html={preview.itinerary} />
            ) : tour.highlights.length ? (
              <ul className="mt-2 list-disc pl-5">
                {tour.highlights.map((stop, index) => (
                  <li key={index}>
                    {tour.formattedCopy?.highlights?.[index] ? (
                      <RichContent
                        html={tour.formattedCopy.highlights[index]!}
                      />
                    ) : (
                      stop
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 whitespace-pre-wrap">{tour.description}</p>
            )}
          </details>
          <ul className={styles.tourCardMeta}>
            {preview?.facts ? (
              preview.facts.filter(Boolean).map((fact, index) => (
                <li className={styles.tourCardCustomFact} key={index}>
                  <RichContent html={fact} />
                </li>
              ))
            ) : (
              <>
                <li>
                  <Clock size={20} aria-hidden />{" "}
                  {tour.durationLabel || minutesToLabel(tour.durationMinutes)}
                </li>
                <li>
                  <Languages size={20} aria-hidden /> {tour.language}
                </li>
                <li>
                  <MapPin size={20} aria-hidden /> {tour.meetingPoint}
                </li>
              </>
            )}
            <li className={styles.tourCardIntensity}>
              <span>Intensità · {intensityLabel}</span>
              <span
                className="flex gap-1"
                role="img"
                aria-label={`${intensity} su 5`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Footprints
                    key={index}
                    size={18}
                    aria-hidden
                    className={
                      index < intensity
                        ? styles.intensityActive
                        : styles.intensityInactive
                    }
                  />
                ))}
              </span>
            </li>
          </ul>
          <div className={styles.tourCardFacts}>
            <TourFacts
              tour={tour}
              pricesOnly={preview?.facts !== undefined}
            />
          </div>
          <div className={styles.tourCardFooter}>
            <div className="flex items-center justify-between gap-3">
              <span
                className={styles.tourCardPrice}
                aria-label="Prezzo per persona"
              >
                {price.showFrom ? "da " : ""}
                <strong>{price.text}</strong>
              </span>
              <button
                type="button"
                className={styles.tourCardCartCompact}
                onClick={() => setBooking(true)}
              >
                <Pointer size={15} strokeWidth={2.25} aria-hidden />
                {preview?.bookLabel || "Prenota"}
              </button>
            </div>
            <Link href={href} className={styles.tourCardCtaWide}>
              {preview?.detailsLabel || "Scopri di più"}
              <ArrowUpRight
                size={15}
                className={styles.tourCardCtaArrow}
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </article>
      {booking && (
        <QuickBooking tour={tour} onClose={() => setBooking(false)} />
      )}
    </>
  );
}
