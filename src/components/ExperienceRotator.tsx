"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type ExperienceGroup = {
  title: string;
  items: { title: string; href: string }[];
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
        className="mb-6 flex flex-wrap gap-2"
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
      <div
        id="gruppo-pannello"
        role="tabpanel"
        aria-labelledby={`gruppo-tab-${index}`}
        className="grid gap-4"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="display-md">{group.title}</h3>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {group.items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="card flex items-center justify-between gap-4 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <span className="title-md">{item.title}</span>
              <ArrowRight className="shrink-0 text-primary" size={18} aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
