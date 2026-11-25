"use client";

import { useState } from "react";
import Image from "next/image";
import type { TripadvisorReview } from "@/lib/tripadvisor-listing";
import styles from "./tripadvisor-official.module.css";

const logoSrc =
  "https://www.tripadvisor.it/img/cdsi/img2/branding/v2/Tripadvisor_lockup_horizontal_secondary_registered-18034-2.svg";

const writeReviewUrl =
  "https://www.tripadvisor.it/UserReviewEdit-g274707-d7365510-Free_Tour_Praga-Prague_Bohemia.html";

function Bubbles({
  rating,
  small,
  label,
}: {
  rating: number;
  small?: boolean;
  label: string;
}) {
  return (
    <div
      className={small ? `${styles.bubbles} ${styles.smallBubbles}` : styles.bubbles}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.min(1, Math.max(0, rating - index));
        if (fill >= 0.99) return <span key={index} />;
        if (fill <= 0.01) return <span key={index} className={styles.empty} />;
        return (
          <span
            key={index}
            className={styles.partial}
            style={{
              background: `linear-gradient(to right, var(--rating-green) ${fill * 100}%, transparent ${fill * 100}%)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function TripadvisorShowcase({
  rating,
  reviewCount,
  reviews,
  profileUrl,
}: {
  rating: number;
  reviewCount: number;
  reviews: TripadvisorReview[];
  profileUrl: string;
}) {
  const [index, setIndex] = useState(0);
  const review = reviews[index] ?? reviews[0];
  const score = rating.toLocaleString("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const count = reviewCount.toLocaleString("it-IT");

  if (!review) return null;

  function step(direction: number) {
    setIndex((current) => (current + direction + reviews.length) % reviews.length);
  }

  return (
    <section className={styles.block} aria-label="Recensioni Tripadvisor">
      <div className={styles.summary}>
        <a className={styles.heading} href={profileUrl} target="_blank" rel="noreferrer">
          <Image unoptimized className={styles.logo} src={logoSrc} alt="Tripadvisor" width={148} height={30} />
        </a>

        <div className={styles.score}>
          <span className={styles.scoreValue}>{score}</span>
          <Bubbles
            rating={rating}
            label={`Valutazione ${score} su 5, ${count} recensioni`}
          />
          <span className={styles.count}>({count})</span>
        </div>

        <a className={styles.reviewButton} href={writeReviewUrl} target="_blank" rel="noreferrer">
          Recensiscici su Tripadvisor
        </a>
      </div>

      <article className={styles.reviewCard}>
        <Image unoptimized className={styles.avatar} src={review.avatar} alt="" width={52} height={52} />
        <div className={styles.reviewContent}>
          <a
            className={styles.username}
            href={review.profileUrl}
            target="_blank"
            rel="noreferrer"
          >
            {review.author}
          </a>
          <div className={styles.date}>
            {review.date} su{" "}
            <a href={review.url} target="_blank" rel="noreferrer">
              Tripadvisor
            </a>
          </div>
          <Bubbles
            small
            rating={review.rating}
            label={`Punteggio ${review.rating} su 5`}
          />
          <h3 className={styles.reviewTitle}>
            <a href={review.url} target="_blank" rel="noreferrer">
              {review.title}
            </a>
          </h3>
          <p className={styles.reviewText}>{review.body}</p>
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          aria-label="Recensione precedente"
          onClick={() => step(-1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5L8 12L15 19" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label="Recensione successiva"
          onClick={() => step(1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5L16 12L9 19" />
          </svg>
        </button>
      </article>
    </section>
  );
}
