"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { TourCard } from "@/components/TourCard";
import styles from "@/app/home.module.css";
import type { Tour } from "@/lib/types";

export type ExperienceItem =
  | { title: string; tour: Tour }
  | { title: string; href: string };

export type ExperienceGroup = {
  title: string;
  subtitle: string;
  items: ExperienceItem[];
};

export function ExperienceRotator({ groups }: { groups: ExperienceGroup[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = groups.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 6000);
    return () => window.clearInterval(id);
  }, [paused, count]);

  if (!count) return null;
  const group = groups[index] ?? groups[0];

  function go(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="mb-6 flex flex-wrap justify-start gap-2"
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
            className={`rounded-full px-4 py-2 text-left text-sm font-semibold ${
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
      <div
        key={group.title}
        id="gruppo-pannello"
        role="tabpanel"
        aria-labelledby={`gruppo-tab-${index}`}
        className="experience-panel"
      >
        <h3 className="display-md mb-6">{group.title}</h3>
        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                  <Image src="/images/prague-diorama.webp" alt="" fill sizes="(min-width:1024px) 350px, 100vw" className="object-contain p-8 pb-16" />
                  <span className="absolute left-3 top-3 bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[1.3px] text-on-primary">
                    In preparazione
                  </span>
                  <p className="relative font-display text-2xl leading-tight text-white">
                    {item.title}
                  </p>
                </div>
                <div className="grid flex-1 gap-3 p-4">
                  <p className="body-sm">
                    Itinerario in preparazione. Scrivici per date e dettagli.
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
        </div>
      </div>
    </div>
  );
}
