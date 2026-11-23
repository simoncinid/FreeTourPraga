"use client";
import { siteEdit } from "@/lib/visual-content";

import { useState } from "react";
import styles from "./public-ui.module.css";

export type MeetingPoint = {
  label: string;
  address: string;
  mapUrl: string;
  binding?: string;
};

export function MeetingPoints({ points }: { points: MeetingPoint[] }) {
  const [index, setIndex] = useState(0);
  const current = points[Math.min(index, points.length - 1)];
  if (!current) return null;

  return (
    <section className="container-page py-12">
      <h2 className="display-lg mb-5">Dove ci incontriamo</h2>
      <div className="card grid overflow-hidden md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-80">
          <iframe
            className="h-full min-h-80 w-full"
            title={`Mappa ${current.label}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(current.address)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
        </div>
        <fieldset
          className={`grid content-start gap-4 p-6 ${styles.meetingPanel}`}
        >
          <legend className="sr-only">Seleziona punto d’incontro</legend>
          {points.map((p, i) => (
            <label key={p.address} className="flex items-start gap-3">
              <input
                type="radio"
                name="meeting-point"
                checked={i === index}
                onChange={() => setIndex(i)}
              />
              <span>
                <strong>{p.label}</strong>
                <small
                  {...(p.binding ? siteEdit(p.binding) : {})}
                  className="block"
                >
                  {p.address}
                </small>
              </span>
            </label>
          ))}
          <a
            href={current.mapUrl}
            className={`button-primary ${styles.mapDirectionsBtn}`}
            target="_blank"
            rel="noreferrer"
          >
            Apri le indicazioni
          </a>
        </fieldset>
      </div>
    </section>
  );
}
