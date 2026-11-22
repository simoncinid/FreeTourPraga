"use client";

import { CardCarousel } from "./CardCarousel";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { TourCard } from "@/components/TourCard";
import styles from "@/app/home.module.css";
import type { Tour } from "@/lib/types";

export type ExperienceItem =
  { title: string; tour: Tour } | { title: string; href: string };

export type ExperienceGroup = {
  title: string;
  subtitle: string;
  items: ExperienceItem[];
};

const IDLE_RESUME_MS = 3000;

export function ExperienceRotator({
  groups,
  intervalSeconds = 5,
}: {
  groups: ExperienceGroup[];
  intervalSeconds?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const selectId = useId();
  const listboxId = useId();
  const count = groups.length;
  const rotateMs = Math.max(3, Math.min(intervalSeconds, 30)) * 1000;

  function clearResumeTimer() {
    if (resumeTimer.current != null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }

  /** Pausa il cambio categoria; riparte dopo 3s senza interazione. */
  const pauseForInteraction = useCallback(() => {
    setPaused(true);
    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      setPaused(false);
    }, IDLE_RESUME_MS);
  }, []);

  useEffect(() => () => clearResumeTimer(), []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onInteract = () => pauseForInteraction();
    root.addEventListener("scroll", onInteract, {
      capture: true,
      passive: true,
    });
    root.addEventListener("touchstart", onInteract, { passive: true });
    root.addEventListener("touchmove", onInteract, { passive: true });
    root.addEventListener("wheel", onInteract, { passive: true });
    root.addEventListener("pointerdown", onInteract);

    return () => {
      root.removeEventListener("scroll", onInteract, true);
      root.removeEventListener("touchstart", onInteract);
      root.removeEventListener("touchmove", onInteract);
      root.removeEventListener("wheel", onInteract);
      root.removeEventListener("pointerdown", onInteract);
    };
  }, [pauseForInteraction]);

  useEffect(() => {
    if (
      paused ||
      hovered ||
      count < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, rotateMs);
    return () => window.clearInterval(timer);
  }, [count, paused, hovered, rotateMs]);

  if (!count) return null;
  const group = groups[index] ?? groups[0];

  function go(next: number) {
    setIndex((next + count) % count);
    setMenuOpen(false);
    pauseForInteraction();
  }

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`${styles.experienceTabsDesktop} mb-6 flex flex-wrap justify-center gap-2 md:justify-start`}
        role="tablist"
        aria-label="Gruppi di esperienze"
      >
        {groups.map((item, itemIndex) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            id={`gruppo-tab-${itemIndex}`}
            aria-selected={itemIndex === index}
            aria-controls="gruppo-pannello"
            className={`rounded-full px-4 py-2 text-left text-sm font-medium ${
              itemIndex === index
                ? "bg-primary text-on-primary"
                : "bg-surface-soft text-ink"
            }`}
            onClick={() => go(itemIndex)}
          >
            {item.title}
          </button>
        ))}
        <Link href="/tour" className={styles.allToursPill}>
          Vedi tutti i tour
          <ArrowRight
            size={15}
            className={styles.allToursPillArrow}
            aria-hidden
          />
        </Link>
      </div>
      <div className={styles.experienceTabsMobile}>
        <div ref={menuRef} className={styles.experienceMenu}>
          <button
            id={selectId}
            type="button"
            className={styles.experienceMenuTrigger}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-controls={listboxId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.experienceMenuValue}>{group.title}</span>
            <ChevronDown
              size={16}
              aria-hidden
              className={
                menuOpen ? styles.experienceMenuChevronOpen : undefined
              }
            />
          </button>
          {menuOpen && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Gruppi di esperienze"
              className={styles.experienceMenuList}
            >
              {groups.map((item, itemIndex) => (
                <li key={item.title} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={itemIndex === index}
                    className={`${styles.experienceMenuOption} ${
                      itemIndex === index
                        ? styles.experienceMenuOptionActive
                        : ""
                    }`}
                    onClick={() => go(itemIndex)}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/tour" className={styles.allToursPill}>
          Vedi tutti i tour
          <ArrowRight
            size={14}
            className={styles.allToursPillArrow}
            aria-hidden
          />
        </Link>
      </div>
      <div
        key={group.title}
        id="gruppo-pannello"
        role="tabpanel"
        aria-labelledby={`gruppo-tab-${index} ${selectId}`}
        className="experience-panel"
      >
        <h3 className="display-md mb-6">{group.title}</h3>
        <CardCarousel
          key={group.title}
          label={`Tour: ${group.title}`}
          autoPlay={false}
          peekMobile
        >
          {group.items.map((item) =>
            "tour" in item ? (
              <TourCard key={item.title} tour={item.tour} title={item.title} />
            ) : (
              <Link
                key={item.title}
                href={item.href}
                className="card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <div className="relative flex aspect-[4/3] items-end bg-navy p-4">
                  <Image
                    src="/images/prague-diorama.webp"
                    alt=""
                    fill
                    sizes="(min-width:1024px) 350px, 100vw"
                    className="object-contain p-8 pb-16"
                  />
                  <span className="absolute left-3 top-3 bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[1.3px] text-on-primary">
                    Su richiesta
                  </span>
                  <p className="relative font-display text-2xl leading-tight text-white">
                    {item.title}
                  </p>
                </div>
                <div className="grid flex-1 gap-3 p-4">
                  <p className="body-sm">
                    Scrivici per itinerario, date e disponibilità.
                  </p>
                  <div className="mt-auto flex justify-end border-t border-hairline-soft pt-3">
                    <span className="button-secondary !min-h-0 !px-3 !py-2 text-[10px]">
                      Scrivici
                    </span>
                  </div>
                </div>
              </Link>
            ),
          )}
        </CardCarousel>
      </div>
    </div>
  );
}
