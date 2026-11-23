"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";

type Option = { value: string; label: string };

export function TourPackageSelect({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 400 });
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(rect.width, 600, innerWidth - 24);
      setPosition({
        width,
        left: Math.max(12, Math.min(rect.left, innerWidth - width - 12)),
        top:
          rect.bottom + 280 > innerHeight
            ? Math.max(12, rect.top - 278)
            : rect.bottom + 6,
      });
    };
    const outside = (e: PointerEvent) => {
      if (
        !trigger.current?.contains(e.target as Node) &&
        !panel.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    place();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    panel.current?.querySelector("input")?.focus();
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  const filtered = options.filter((o) =>
    o.label.toLocaleLowerCase("it").includes(query.toLocaleLowerCase("it")),
  );
  return (
    <div className="tour-package-select">
      <span className="tour-package-label" id="tour-package-label">
        Tour abbinati al pacchetto
      </span>
      <button
        ref={trigger}
        type="button"
        className="tour-package-trigger"
        aria-labelledby="tour-package-label"
        aria-expanded={open}
        aria-controls={open ? "tour-package-options" : undefined}
        onClick={() => {
          setQuery("");
          setOpen(!open);
        }}
      >
        <span>
          {value.length
            ? `${value.length} tour selezionat${value.length === 1 ? "o" : "i"}`
            : "Seleziona i tour da abbinare"}
        </span>
        <ChevronDown size={16} />
      </button>
      {value.length > 0 && (
        <div className="tour-package-tags">
          {value.map((id) => (
            <span key={id}>
              {options.find((o) => o.value === id)?.label ?? id}
              <button
                type="button"
                aria-label={`Rimuovi ${options.find((o) => o.value === id)?.label ?? id}`}
                onClick={() => toggle(id)}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      {open &&
        createPortal(
          <div
            ref={panel}
            id="tour-package-options"
            className="tour-package-popover"
            style={{ position: "fixed", ...position }}
          >
            <div className="tour-package-search">
              <Search size={15} />
              <input
                aria-label="Cerca tour da abbinare"
                placeholder="Cerca un tour…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </div>
            <div className="tour-package-options">
              {filtered.map((o) => (
                <label key={o.value}>
                  <input
                    type="checkbox"
                    checked={value.includes(o.value)}
                    onChange={() => toggle(o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
              {!filtered.length && <p>Nessun tour trovato</p>}
            </div>
            <div className="tour-package-footer">
              <button
                type="button"
                disabled={!value.length}
                onClick={() => onChange([])}
              >
                Deseleziona tutti
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                Fatto
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
