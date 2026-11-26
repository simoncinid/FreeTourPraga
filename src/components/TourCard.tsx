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
import { RemovedTourText } from "./RemovedContentStyles";
import { TourEditableText } from "./TourEditableText";
import { RichContent } from "./RichContent";
import { RichInline } from "./RichInline";
import { richHasText, richOrPlain } from "@/lib/rich-text";
import { minutesToLabel } from "@/lib/format";
import type { Tour } from "@/lib/types";

export function TourCard({ tour, title, editable = false }: { tour: Tour; title?: string; editable?: boolean }) {
  const edit = (path: string, kind = "plain") => ({ "data-tour-field": path, "data-tour-kind": editable ? kind : undefined });
  const [booking, setBooking] = useState(false);
  const preview = tour.cardPreview;
  const nameHtml = richOrPlain(
    preview?.title?.includes("<") ? preview.title : undefined,
    tour.formattedCopy?.title,
  );
  const name =
    (preview?.title && !preview.title.includes("<") ? preview.title : "") ||
    title ||
    tour.title;
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
        data-tour-id={tour.id}
        className={`${styles.tourCard} card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card`}
      >
        <RemovedTourText tour={tour} />
        <Link
          href={href}
          className="relative aspect-[4/3] block overflow-hidden"
        >
          <Image
            {...edit("imageUrl", "image")}
            src={tour.imageUrl}
            unoptimized={editable}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        </Link>
        <div className={styles.tourCardBody}>
          <Link href={href} className={`no-underline ${styles.tourCardTitle}`}>
            {richHasText(nameHtml) ? (
              <RichInline as="span" html={nameHtml} {...edit("cardPreview.title", "inline")} />
            ) : (
              <span {...edit("cardPreview.title", "inline")}>{name}</span>
            )}
          </Link>
          {preview?.description || tour.formattedCopy?.shortDescription ? (
            <div className={styles.tourCardDesc} {...edit("cardPreview.description", "html")}>
              <RichContent
                html={
                  (preview?.description ||
                    tour.formattedCopy?.shortDescription)!
                }
              />
            </div>
          ) : (
            <p className={styles.tourCardDesc} {...edit("cardPreview.description", "html")}>{tour.shortDescription}</p>
          )}
          <details className={styles.tourCardItinerary} open={editable || undefined}>
            <summary className="underline">
              <TourEditableText tour={tour} path="cardPreview.itineraryLabel" text={preview?.itineraryLabel || "Itinerario completo"} editable={editable} />
            </summary>
            <div {...edit("cardPreview.itinerary", "html")}>{preview?.itinerary ? (
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
            </div>
          </details>
          <details className={styles.tourCardPrices}>
            <summary><TourEditableText tour={tour} path="cardPreview.pricesLabel" text={preview?.pricesLabel || "Prezzi"} editable={editable} /></summary>
            <TourFacts tour={tour} section="prices" />
          </details>
          <ul className={styles.tourCardMeta}>
            {preview?.facts ? (
              preview.facts.map((fact, index) => (fact || editable) && (
                <li className={styles.tourCardCustomFact} key={index} {...edit(`cardPreview.facts.${index}`, "html")}>
                  <RichContent html={fact || "Lorem ipsum"} />
                </li>
              ))
            ) : (
              <>
                <li>
                  <Clock size={20} aria-hidden />{" "}
                  <TourEditableText tour={tour} path="durationLabel" text={tour.durationLabel || minutesToLabel(tour.durationMinutes)} editable={editable} />
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
            {tour.operatingDays ? (
              <li>
                <strong>Giorni</strong> · {tour.operatingDays}
              </li>
            ) : null}
            {tour.departureTime ? (
              <li>
                <strong>Orario</strong> · {tour.departureTime}
                {tour.arrivalMinutes !== undefined
                  ? ` · Presentarsi ${tour.arrivalMinutes} minuti prima`
                  : ""}
              </li>
            ) : null}
            {tour.guide?.trim() || editable ? (
              <li>
                <strong>Guida</strong> ·{" "}
                <TourEditableText tour={tour} path="guide" text={tour.guide?.trim() || "Nome guida"} editable={editable} />
              </li>
            ) : null}
          </ul>
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
                data-tour-hide-parent
                className={styles.tourCardCartCompact}
                onClick={() => setBooking(true)}
              >
                <Pointer size={15} strokeWidth={2.25} aria-hidden />
                <TourEditableText tour={tour} path="cardPreview.bookLabel" text={preview?.bookLabel || "Prenota"} editable={editable} />
              </button>
            </div>
            <Link href={href} data-tour-hide-parent className={styles.tourCardCtaWide}>
              <TourEditableText tour={tour} path="cardPreview.detailsLabel" text={preview?.detailsLabel || "Scopri di più"} editable={editable} />
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
