"use client";

import { useState } from "react";

const reviewsUrl =
  "https://www.tripadvisor.it/WidgetEmbed-selfserveprop?locationId=7365510&lang=it&format=inner&display=true&display_version=2&border=true&nreviews=4&rating=true&writereviewlink=true&popIdx=true&iswide=false";

export function OfficialTripAdvisorWidget() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="mt-5">
      {loaded ? (
        <iframe
          title="Recensioni ufficiali Tripadvisor di Free Tour Praga"
          src={reviewsUrl}
          className="block h-[480px] w-[240px] max-w-full"
          referrerPolicy="origin"
        />
      ) : (
        <button
          type="button"
          className="button-secondary"
          onClick={() => setLoaded(true)}
        >
          Carica il widget ufficiale di Tripadvisor
        </button>
      )}
    </div>
  );
}
