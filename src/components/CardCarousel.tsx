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
const DESKTOP_MQ = "(min-width: 1024px)";

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

export function CardCarousel({
  children,
  label,
  autoPlay = true,
  intervalMs = 5000,
  limitToDotRowMobile = false,
  hideNav = false,
  peekMobile = false,
  equalHeight = true,
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
  /** Nasconde le frecce (restano i pallini). */
  hideNav?: boolean;
  /** Mobile: slide non a tutta larghezza + leggero nudge per suggerire lo scroll. */
  peekMobile?: boolean;
  /** DV: se false le card restano alte quanto il contenuto (niente spazio bianco). */
  equalHeight?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const allChildren = Children.toArray(children);
  const [desktop, setDesktop] = useState(false);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  /**
   * Solo mobile: max slide = quanti pallini stanno in una riga.
   * Infinity su desktop / prima della misura.
   */
  const [mobileSlideCap, setMobileSlideCap] = useState(
    Number.POSITIVE_INFINITY,
  );
  const visibleChildren =
    limitToDotRowMobile &&
    !desktop &&
    Number.isFinite(mobileSlideCap) &&
    mobileSlideCap < allChildren.length
      ? allChildren.slice(0, Math.max(1, mobileSlideCap))
      : allChildren;
  const perPage = desktop ? 3 : 1;
  const pageGroups = chunk(visibleChildren, perPage);
  const pages = Math.max(1, pageGroups.length);
  const activePage = page < pages ? page : 0;
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

  useLayoutEffect(() => {
    const query = window.matchMedia(DESKTOP_MQ);
    const update = () => {
      setDesktop(query.matches);
      setPage(0);
      track.current?.scrollTo({ left: 0 });
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!limitToDotRowMobile) {
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
      track.current?.scrollTo({ left: 0 });
    }
  }, [page, pages]);

  // MV peek: breve spostamento a sx per mostrare che si può scrollare a dx.
  useEffect(() => {
    if (!peekMobile || desktop) return;
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let backTimer = 0;
    const startTimer = window.setTimeout(() => {
      el.scrollTo({ left: 22, behavior: "smooth" });
      backTimer = window.setTimeout(() => {
        el.scrollTo({ left: 0, behavior: "smooth" });
      }, 520);
    }, 700);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(backTimer);
    };
  }, [peekMobile, desktop, visibleChildren.length]);

  function go(next: number) {
    const target = (next + pages) % pages;
    setPage(target);
    if (desktop) return;

    const el = track.current;
    if (!el) return;
    const instant = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollTo({
      left:
        pages > 1
          ? ((el.scrollWidth - el.clientWidth) * target) / (pages - 1)
          : 0,
      behavior: instant ? "instant" : "smooth",
    });
  }

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).has("cms-preview") ||
      !autoPlay ||
      paused ||
      hovered ||
      pages < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      const next = (activePage + 1) % pages;
      setPage(next);
      if (desktop) return;
      const el = track.current;
      if (!el) return;
      const span = el.scrollWidth - el.clientWidth;
      if (span <= 0) return;
      el.scrollTo({
        left: (span * next) / (pages - 1),
        behavior: "smooth",
      });
    }, rotateMs);
    return () => window.clearInterval(id);
  }, [paused, hovered, pages, autoPlay, rotateMs, activePage, desktop]);

  if (!allChildren.length) return null;

  function renderSlide(child: ReactNode, index: number, total: number) {
    return (
      <div
        key={
          isValidElement(child) && child.key != null ? String(child.key) : index
        }
        className="card-carousel-slide"
        role="group"
        aria-label={`${index + 1} di ${total}`}
      >
        {child}
      </div>
    );
  }

  return (
    <div
      ref={root}
      className={`card-carousel${peekMobile ? " card-carousel-peek" : ""}${
        desktop ? " card-carousel-desktop" : ""
      }${!equalHeight ? " card-carousel-auto-height" : ""}`}
      role="region"
      aria-roledescription="carosello"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-carousel-stage">
        {pages > 1 && !hideNav && (
          <button
            type="button"
            className="card-carousel-nav card-carousel-nav-prev"
            aria-label="Schede precedenti"
            onClick={() => {
              pauseForInteraction();
              go(activePage - 1);
            }}
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        )}
        {desktop ? (
          <div className="card-carousel-viewport">
            <div
              className="card-carousel-track card-carousel-track-desktop"
              style={{
                transform: `translate3d(-${activePage * 100}%, 0, 0)`,
              }}
            >
              {pageGroups.map((group, pageIndex) => (
                <div key={pageIndex} className="card-carousel-page">
                  {group.map((child, index) =>
                    renderSlide(
                      child,
                      pageIndex * perPage + index,
                      visibleChildren.length,
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
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
          >
            {visibleChildren.map((child, index) =>
              renderSlide(child, index, visibleChildren.length),
            )}
          </div>
        )}
        {pages > 1 && !hideNav && (
          <button
            type="button"
            className="card-carousel-nav card-carousel-nav-next"
            aria-label="Schede successive"
            onClick={() => {
              pauseForInteraction();
              go(activePage + 1);
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
              aria-current={activePage === index ? "true" : undefined}
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
