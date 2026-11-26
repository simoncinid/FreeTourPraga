"use client";
import type { SiteContent } from "@/lib/platform/content";
import { SiteInlineText, SiteRichText, siteInlineEdit } from "./SiteRichText";

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
const tripAdvisorMarkSrc =
  "https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logomark.svg";

function WriteReviewCta({
  profileUrl,
  googleReviewUrl,
}: {
  profileUrl: string;
  googleReviewUrl?: string;
}) {
  return (
    <div className={styles.writeReview}>
      <p>Hai esplorato Praga con noi? Lascia una recensione.</p>
      <div className={styles.writeReviewActions}>
        <a
          className={styles.writeReviewBtn}
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className={styles.tripadvisorIconBox}>
            <Image unoptimized
              src={tripAdvisorMarkSrc}
              alt=""
              width={16}
              height={16}
            />
          </span>
          Recensisci su Tripadvisor
          <ArrowUpRight
            size={15}
            className={styles.reviewsButtonArrow}
            aria-hidden
          />
        </a>
        {googleReviewUrl ? (
          <a
            className={`${styles.writeReviewBtn} ${styles.writeReviewBtnGoogle}`}
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.tripadvisorIconBox}>
              <Image unoptimized
                src="https://www.google.com/favicon.ico"
                alt=""
                width={16}
                height={16}
              />
            </span>
            Recensisci su Google
            <ArrowUpRight
              size={15}
              className={styles.reviewsButtonArrow}
              aria-hidden
            />
          </a>
        ) : null}
      </div>
    </div>
  );
}

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
  googleReviewUrl,
  formattedText,
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
  googleReviewUrl?: string;
  formattedText?: SiteContent["formattedText"];
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
            <div ref={measureRef} className={styles.reviewMeasure} aria-hidden>
              {reviews.map((item) => (
                <div
                  key={`measure-${item.author}-${item.date}`}
                  className={styles.reviewCard}
                >
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
            <span>Tripadvisor</span>
          </div>
          <h2 id="reviews-title" className={styles.showcaseTitle}>
            <span {...siteInlineEdit("globals.tripAdvisorTitle")}>
              <SiteInlineText content={{ formattedText }} path="globals.tripAdvisorTitle">
                {tripAdvisor.title || "Dicono di noi"}
              </SiteInlineText>
            </span>
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
          <SiteRichText content={{ formattedText }} path="globals.tripAdvisorBody" text={body} className="body-md" />
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
        <div className={styles.writeReviewSlot}>
          <WriteReviewCta
            profileUrl={tripAdvisor.profileUrl}
            googleReviewUrl={googleReviewUrl}
          />
        </div>
      </div>
    </section>
  );
}

function TripAdvisorLogo({ className }: { className?: string }) {
  return (
    <Image unoptimized
      className={className}
      src={tripAdvisorMarkSrc}
      alt="Tripadvisor"
      width={48}
      height={48}
    />
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
