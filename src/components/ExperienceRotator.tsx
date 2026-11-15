"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TourCard } from "@/components/TourCard";
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
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
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="button-secondary !min-h-0 !px-3 !py-2"
            aria-label="Gruppo precedente"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="button-secondary !min-h-0 !px-3 !py-2"
            aria-label="Gruppo successivo"
            onClick={() => go(index + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        key={group.title}
        id="gruppo-pannello"
        role="tabpanel"
        aria-labelledby={`gruppo-tab-${index}`}
        className="experience-panel"
      >
        <h3 className="display-md">{group.title}</h3>
        {group.subtitle && <p className="body-md mt-2 mb-6">{group.subtitle}</p>}
        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {group.items.map((item) =>
            "tour" in item ? (
              <TourCard key={item.title} tour={item.tour} title={item.title} />
            ) : (
              <article
                key={item.title}
                className="card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <div className="relative flex aspect-[4/3] items-end bg-navy p-4">
                  <span className="absolute left-3 top-3 bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[1.3px] text-on-primary">
                    In italiano
                  </span>
                  <p className="font-display text-2xl leading-tight text-white">
                    {item.title}
                  </p>
                </div>
                <div className="grid flex-1 gap-3 p-4">
                  <p className="body-sm">
                    Itinerario in preparazione. Scrivici per date e dettagli.
                  </p>
                  <div className="mt-auto flex justify-end border-t border-hairline-soft pt-3">
                    <Link
                      href={item.href}
                      className="button-secondary !min-h-0 !px-3 !py-2 text-[10px]"
                    >
                      Scrivici
                    </Link>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
