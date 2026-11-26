"use client";

import { RichInline } from "./RichInline";
import styles from "./public-ui.module.css";
import type { Tour } from "@/lib/types";

export function GoogleMap({ tour, preview = false }: { tour: Tour; preview?: boolean }) {
  const info = (key: "meetingPoint" | "meetingAddress" | "meetingInstructions") => {
    const html = tour.formattedCopy?.[key];
    return html ? <RichInline html={html} /> : tour[key] || (preview ? "Informazione facoltativa" : "");
  };
  return (
    <section id="punto-incontro" className="card overflow-hidden">
      <div className="grid gap-3 p-6">
        <h2 className="display-md">Il punto d’incontro</h2>
        <p className="body-md">
          <span data-tour-field="formattedCopy.meetingPoint" data-tour-kind="inline">{info("meetingPoint")}</span> ·{" "}
          <span data-tour-field="formattedCopy.meetingAddress" data-tour-kind="inline">{info("meetingAddress")}</span>
        </p>
        {(tour.meetingInstructions || preview) && (
          <p className="body-md" data-tour-field="formattedCopy.meetingInstructions" data-tour-kind="inline">
            {info("meetingInstructions")}
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
