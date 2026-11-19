"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const IDLE_RESUME_MS = 3000;
/** Larghezza CSS del bottone pallino (globals.css). */
const DOT_BUTTON_WIDTH = 24;

export function CardCarousel({
  children,
  label,
  autoPlay = true,
  intervalMs = 5000,
  limitToDotRowMobile = false,
}: {
  children: ReactNode;
  label: string;
  autoPlay?: boolean;
  /** Intervallo scorrimento automatico in ms (blog = 3000). */
  intervalMs?: number;
  /**
   * Solo mobile: mostra al massimo N slide, con N = pallini che stanno in una riga.
   * I pallini restano sempre visibili. Desktop invariato.
   */
  limitToDotRowMobile?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const allChildren = Children.toArray(children);
  const [perPage, setPerPage] = useState(1);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  /**
   * Solo mobile: max slide = quanti pallini stanno in una riga.
   * Infinity su desktop / prima della misura.
   */
  const [mobileSlideCap, setMobileSlideCap] = useState(Number.POSITIVE_INFINITY);
  const visibleChildren =
    limitToDotRowMobile &&
    Number.isFinite(mobileSlideCap) &&
    mobileSlideCap < allChildren.length
      ? allChildren.slice(0, Math.max(1, mobileSlideCap))
      : allChildren;
  const count = visibleChildren.length;
  const pages = Math.max(1, Math.ceil(count / perPage));
  const rotateMs = Math.max(2000, Math.min(intervalMs, 30000));

  function clearResumeTimer() {
    if (resumeTimer.current != null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }

  function pauseForInteraction() {
    setPaused(true);
    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      setPaused(false);
    }, IDLE_RESUME_MS);
  }

  useEffect(() => () => clearResumeTimer(), []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setPerPage(query.matches ? 3 : 1);
      setPage(0);
      track.current?.scrollTo({ left: 0 });
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!limitToDotRowMobile) {
      setMobileSlideCap(Number.POSITIVE_INFINITY);
      return;
    }
    const el = root.current;
    if (!el) return;

    const check = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setMobileSlideCap(Number.POSITIVE_INFINITY);
        return;
      }
      const width = el.clientWidth;
      const fit = Math.max(1, Math.floor(width / DOT_BUTTON_WIDTH));
      setMobileSlideCap(fit);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [limitToDotRowMobile]);

  useEffect(() => {
    if (page > pages - 1) {
      setPage(0);
      track.current?.scrollTo({ left: 0 });
    }
  }, [page, pages]);

  function go(next: number) {
    const el = track.current;
    if (!el) return;
    const target = (next + pages) % pages;
    el.scrollTo({
      left:
        pages > 1
          ? ((el.scrollWidth - el.clientWidth) * target) / (pages - 1)
          : 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  useEffect(() => {
    if (
      !autoPlay ||
      paused ||
      hovered ||
      pages < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el) return;
      const span = el.scrollWidth - el.clientWidth;
      if (span <= 0) return;
      const current = Math.round((el.scrollLeft / span) * (pages - 1));
      el.scrollTo({
        left: (span * ((current + 1) % pages)) / (pages - 1),
        behavior: "smooth",
      });
    }, rotateMs);
    return () => window.clearInterval(id);
  }, [paused, hovered, pages, autoPlay, rotateMs]);

  if (!allChildren.length) return null;

  return (
    <div
      ref={root}
      className="card-carousel"
      role="region"
      aria-roledescription="carosello"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-carousel-stage">
        {pages > 1 && (
          <button
            type="button"
            className="card-carousel-nav card-carousel-nav-prev"
            aria-label="Schede precedenti"
            onClick={() => {
              pauseForInteraction();
              go(page - 1);
            }}
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        )}
        <div
          ref={track}
          className="card-carousel-track"
          onScroll={() => {
            const el = track.current;
            if (!el) return;
            setPage(
              el.scrollWidth > el.clientWidth
                ? Math.round(
                    (el.scrollLeft / (el.scrollWidth - el.clientWidth)) *
                      (pages - 1),
                  )
                : 0,
            );
          }}
          onPointerDown={pauseForInteraction}
          onTouchStart={pauseForInteraction}
          onTouchMove={pauseForInteraction}
          onWheel={pauseForInteraction}
        >
          {visibleChildren.map((child, index) => (
            <div
              key={
                isValidElement(child) && child.key != null
                  ? String(child.key)
                  : index
              }
              className="card-carousel-slide"
              role="group"
              aria-label={`${index + 1} di ${count}`}
            >
              {child}
            </div>
          ))}
        </div>
        {pages > 1 && (
          <button
            type="button"
            className="card-carousel-nav card-carousel-nav-next"
            aria-label="Schede successive"
            onClick={() => {
              pauseForInteraction();
              go(page + 1);
            }}
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        )}
      </div>
      {pages > 1 && (
        <div className="card-carousel-dots" role="tablist" aria-label="Pagine">
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-label={`Vai alla pagina ${index + 1} di ${pages}`}
              aria-current={page === index ? "true" : undefined}
              onClick={() => {
                pauseForInteraction();
                go(index);
              }}
            >
              <span />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
