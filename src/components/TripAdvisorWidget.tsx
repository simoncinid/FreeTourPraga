"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import styles from "./tripadvisor.module.css";

export type TripAdvisorReview = {
  author: string;
  place: string;
  rating: number;
  date: string;
  text: string;
  avatarUrl: string;
};

export function TripAdvisorWidget({
  tripAdvisor,
  layout = "section",
}: {
  tripAdvisor: {
    profileUrl: string;
    title?: string;
    body?: string;
    rating: number;
    reviewCount: number;
    reviews: TripAdvisorReview[];
  };
  layout?: "section" | "card";
}) {
  const reviews = tripAdvisor.reviews;
  const [index, setIndex] = useState(0);
  const review = reviews[index] || reviews[0];
  const filled = Math.round(Math.min(5, Math.max(0, tripAdvisor.rating)));

  function go(next: number) {
    if (!reviews.length) return;
    setIndex((next + reviews.length) % reviews.length);
  }

  const content = (
    <div className={`${styles.card} card p-7`}>
      <div className={styles.brandRow}>
        <TripAdvisorLogo className={styles.logo} />
        <div>
          <p className={styles.brandName}>TripAdvisor</p>
          <p className="micro-label text-muted">Recensioni verificate</p>
        </div>
      </div>
      <h2 className="display-md mb-2">
        {tripAdvisor.title || "Dicono di noi"}
      </h2>
      <p className="body-sm">
        {tripAdvisor.body ||
          "Le parole di chi ha esplorato Praga con noi."}
      </p>
      <div className={styles.ratingBlock}>
        <strong className={styles.score}>
          {tripAdvisor.rating.toFixed(1)}
        </strong>
        <div className={styles.ratingMeta}>
          <div
            className={styles.circles}
            aria-label={`Valutazione ${tripAdvisor.rating} su 5`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`${styles.circle} ${
                  i < filled ? "" : styles.circleEmpty
                }`}
              />
            ))}
          </div>
          <p className={styles.ratingCount}>
            {tripAdvisor.reviewCount.toLocaleString("it-IT")} recensioni su
            TripAdvisor
          </p>
        </div>
      </div>
      {review && (
        <div className={styles.reviewCard} aria-live="polite">
          {reviews.length > 1 && (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              aria-label="Recensione precedente"
              onClick={() => go(index - 1)}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div className={styles.reviewInner}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewIdentity}>
                <Image
                  src={review.avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  className={styles.avatar}
                />
                <div>
                  <p className={styles.reviewAuthor}>{review.author}</p>
                  <p className={styles.reviewPlace}>{review.place}</p>
                </div>
              </div>
              <p className={styles.reviewDate}>{review.date}</p>
            </div>
            <div
              className={styles.circles}
              aria-label={`${review.rating} su 5`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`${styles.circle} ${
                    i < review.rating ? "" : styles.circleEmpty
                  }`}
                />
              ))}
            </div>
            <p className={styles.reviewText}>{review.text}</p>
            <div className={styles.reviewFooter}>
              {reviews.length > 1 ? (
                <p className={styles.counter}>
                  {index + 1}/{reviews.length}
                </p>
              ) : (
                <span />
              )}
              <a
                href={tripAdvisor.profileUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.cta}
              >
                Vedi tutte le recensioni
                <ExternalLink size={14} aria-hidden />
              </a>
            </div>
          </div>
          {reviews.length > 1 && (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              aria-label="Recensione successiva"
              onClick={() => go(index + 1)}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (layout === "card") {
    return <aside className={styles.embedded}>{content}</aside>;
  }

  return (
    <section className={`${styles.section} section`}>
      <div className="container-page grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="micro-label text-primary">TripAdvisor</p>
          <h2 className="display-lg my-4">
            {tripAdvisor.title || "Dicono di noi"}
          </h2>
          <p className="body-md max-w-xl">
            {tripAdvisor.body ||
              "Le parole di chi ha esplorato Praga con noi."}
          </p>
        </div>
        {content}
      </div>
    </section>
  );
}

function TripAdvisorLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      role="img"
      aria-label="TripAdvisor"
    >
      <circle cx="24" cy="24" r="24" fill="#00AA6C" />
      <circle cx="17" cy="22" r="7.2" fill="#fff" />
      <circle cx="31" cy="22" r="7.2" fill="#fff" />
      <circle cx="17" cy="22" r="2.6" fill="#034B33" />
      <circle cx="31" cy="22" r="2.6" fill="#034B33" />
      <path
        d="M24 31.8c-2.4 0-4.4-1.2-5.2-2.8.9 1.9 2.9 3.2 5.2 3.2s4.3-1.3 5.2-3.2c-.8 1.6-2.8 2.8-5.2 2.8z"
        fill="#fff"
        opacity="0.92"
      />
    </svg>
  );
}
