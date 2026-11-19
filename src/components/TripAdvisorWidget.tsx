"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./tripadvisor.module.css";

export type TripAdvisorReview = {
  author: string;
  place: string;
  rating: number;
  date: string;
  text: string;
  avatarUrl: string;
};

const AUTOPLAY_MS = 5000;

function ReviewCardBody({ review }: { review: TripAdvisorReview }) {
  return (
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
      <div className={styles.circles} aria-label={`${review.rating} su 5`}>
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
    </div>
  );
}

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
  const [tick, setTick] = useState(0);
  const [cardHeight, setCardHeight] = useState<number>();
  const measureRef = useRef<HTMLDivElement>(null);
  const review = reviews[index] || reviews[0];
  const body =
    tripAdvisor.body ||
    "Le parole di chi ha esplorato Praga con FreeTourPraga.";

  function go(next: number) {
    if (!reviews.length) return;
    setIndex((next + reviews.length) % reviews.length);
    setTick((value) => value + 1);
  }

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root || !reviews.length) return;

    const measure = () => {
      const heights = Array.from(root.children, (child) =>
        Math.ceil((child as HTMLElement).getBoundingClientRect().height),
      );
      const next = Math.max(0, ...heights);
      setCardHeight((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reviews]);

  useEffect(() => {
    if (reviews.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % reviews.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reviews.length, tick]);

  const reviewCountLabel = `${tripAdvisor.reviewCount.toLocaleString("it-IT")} recensioni su TripAdvisor`;

  const content = (
    <div className={`${styles.card} card p-7`}>
      <div className={styles.brandRow}>
        <TripAdvisorLogo className={styles.logo} />
        <div>
          <p className={styles.brandName}>TripAdvisor</p>
          <p className="micro-label text-muted">Recensioni verificate</p>
        </div>
      </div>
      <div className={`${styles.showcaseRating} ${styles.cardRating}`}>
        <div className={styles.cardRatingScore}>
          <strong>
            {tripAdvisor.rating.toFixed(1)}
            <span>/5</span>
          </strong>
        </div>
        <div className={styles.cardRatingAction}>
          <ReviewBubbles rating={tripAdvisor.rating} />
          <a
            href={tripAdvisor.profileUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.reviewsButton}
          >
            {reviewCountLabel}
            <ArrowUpRight
              size={13}
              className={styles.reviewsButtonArrow}
              aria-hidden
            />
          </a>
        </div>
      </div>
      {review && (
        <div className={styles.reviewCarousel} aria-live="polite">
          {reviews.length > 1 ? (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              aria-label="Recensione precedente"
              onClick={() => go(index - 1)}
            >
              <ChevronLeft size={22} />
            </button>
          ) : null}
          <div className={styles.reviewStage}>
            <div
              ref={measureRef}
              className={styles.reviewMeasure}
              aria-hidden
            >
              {reviews.map((item) => (
                <div key={`measure-${item.author}-${item.date}`} className={styles.reviewCard}>
                  <ReviewCardBody review={item} />
                </div>
              ))}
            </div>
            <div
              className={styles.reviewCard}
              style={cardHeight ? { height: cardHeight } : undefined}
            >
              <ReviewCardBody review={review} />
            </div>
          </div>
          {reviews.length > 1 ? (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              aria-label="Recensione successiva"
              onClick={() => go(index + 1)}
            >
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  if (layout === "card") {
    return <aside className={styles.embedded}>{content}</aside>;
  }

  return (
    <section className={styles.showcase} aria-labelledby="reviews-title">
      <div className={`container-page ${styles.showcaseGrid}`}>
        <div className={styles.showcaseCopy}>
          <div className={styles.showcaseBrand}>
            <TripAdvisorLogo className={styles.logo} />
            <span>TripAdvisor / Le vostre storie</span>
          </div>
          <h2 id="reviews-title" className={styles.showcaseTitle}>
            {tripAdvisor.title || "Dicono di noi"}
            <span aria-hidden>.</span>
          </h2>
          <div className={styles.showcaseRating}>
            <strong>
              {tripAdvisor.rating.toFixed(1)}
              <span>/5</span>
            </strong>
            <div>
              <ReviewBubbles rating={tripAdvisor.rating} />
              <a
                href={tripAdvisor.profileUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.reviewsButton}
              >
                {reviewCountLabel}
                <ArrowUpRight
                  size={13}
                  className={styles.reviewsButtonArrow}
                  aria-hidden
                />
              </a>
            </div>
          </div>
          <p className="body-md">{body}</p>
        </div>
        <div className={styles.reviewScene}>
          <div className={styles.sceneHalo} aria-hidden />
          <div className={styles.destinationPhoto}>
            <Image
              src="/images/editorial/prague-reviews.jpg"
              alt="I ponti e i tetti di Praga al tramonto"
              fill
              sizes="(min-width: 1024px) 360px, 70vw"
              className={styles.scenePhoto}
            />
          </div>
          {reviews.length > 1 &&
            [1, 2].slice(0, reviews.length - 1).map((offset) => {
              const other = reviews[(index + offset) % reviews.length];
              return (
                <div
                  key={offset}
                  className={`${styles.floatingReview} ${
                    offset === 1 ? styles.backLeft : styles.backRight
                  }`}
                  aria-hidden="true"
                >
                  <ReviewBubbles rating={other.rating} />
                  <p>{other.text}</p>
                  <strong>{other.author}</strong>
                </div>
              );
            })}
          <span
            className={`${styles.floatingLogo} ${styles.orbitOne}`}
            aria-hidden
          >
            <TripAdvisorLogo />
          </span>
          <span
            className={`${styles.floatingLogo} ${styles.orbitTwo}`}
            aria-hidden
          >
            <TripAdvisorLogo />
          </span>
          {review && (
            <div className={styles.frontReview}>
              <div className={styles.quoteMark} aria-hidden>
                “
              </div>
              <div
                className={styles.activeReview}
                key={index}
                aria-live="polite"
                aria-atomic="true"
              >
                <ReviewBubbles rating={review.rating} />
                <blockquote>{review.text}</blockquote>
                <div className={styles.sceneReviewIdentity}>
                  <Image
                    src={review.avatarUrl}
                    alt=""
                    width={38}
                    height={38}
                    className={styles.avatar}
                  />
                  <div>
                    <strong>{review.author}</strong>
                    <span>
                      {review.place} · {review.date}
                    </span>
                  </div>
                  <TripAdvisorLogo className={styles.miniLogo} />
                </div>
              </div>
              {reviews.length > 1 && (
                <div className={styles.sceneControls}>
                  <span>
                    {String(index + 1).padStart(2, "0")}{" "}
                    <span>/ {String(reviews.length).padStart(2, "0")}</span>
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => go(index - 1)}
                      aria-label="Recensione precedente"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(index + 1)}
                      aria-label="Recensione successiva"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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

function ReviewBubbles({ rating }: { rating: number }) {
  return (
    <div
      className={styles.circles}
      role="img"
      aria-label={`Valutazione ${rating} su 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`${styles.circle} ${
            i < Math.round(rating) ? "" : styles.circleEmpty
          }`}
        />
      ))}
    </div>
  );
}
