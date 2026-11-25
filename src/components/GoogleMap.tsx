"use client";

import styles from "./public-ui.module.css";
import type { Tour } from "@/lib/types";

export function GoogleMap({ tour }: { tour: Tour }) {
  return (
    <section id="punto-incontro" className="card overflow-hidden">
      <div className="grid gap-3 p-6">
        <h2 className="display-md">Il punto d’incontro</h2>
        <p className="body-md">
          <span data-tour-field="meetingPoint">{tour.meetingPoint}</span> ·{" "}
          <span data-tour-field="meetingAddress">{tour.meetingAddress}</span>
        </p>
        {tour.meetingInstructions && (
          <p className="body-md" data-tour-field="meetingInstructions">
            {tour.meetingInstructions}
          </p>
        )}
      </div>
      <div className="aspect-[4/3] border-y md:aspect-[16/7]">
        <iframe
          title={`Mappa di ${tour.title}`}
          src={tour.mapEmbedUrl}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
      <div className={`map-directions p-5 ${styles.meetingPanel}`}>
        <a
          className={`button-primary ${styles.mapDirectionsBtn}`}
          href={tour.mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          Apri le indicazioni
        </a>
      </div>
    </section>
  );
}
