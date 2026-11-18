"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function monthKey(value: string) {
  return value.slice(0, 7);
}

function formatDay(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDayShort(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const weekday = date
    .toLocaleDateString("it-IT", { weekday: "short" })
    .replace(/\.$/, "");
  const day = date.toLocaleDateString("it-IT", { day: "numeric" });
  const month = date
    .toLocaleDateString("it-IT", { month: "short" })
    .replace(/\.$/, "");
  const year = date.toLocaleDateString("it-IT", { year: "numeric" });
  return `${weekday} ${day} ${month}. ${year}`;
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SlotDatePicker({
  days,
  value,
  onChange,
  required = true,
}: {
  days: string[];
  value: string;
  onChange: (day: string) => void;
  required?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const available = useMemo(() => [...days].sort(), [days]);
  const availableSet = useMemo(() => new Set(available), [available]);
  const months = useMemo(
    () => [...new Set(available.map(monthKey))],
    [available],
  );
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [month, setMonth] = useState(
    () => monthKey(value || available[0] || new Date().toISOString()),
  );

  useEffect(() => {
    if (value) setMonth(monthKey(value));
    else if (available[0]) setMonth(monthKey(available[0]));
  }, [value, available]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    // Il pannello deve vivere dentro <dialog>, altrimenti resta sotto il top-layer.
    const host =
      (triggerRef.current.closest("dialog") as HTMLElement | null) ||
      document.body;
    setPortalTarget(host);

    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const hostEl =
        (trigger.closest("dialog") as HTMLElement | null) || document.body;
      const hostRect =
        hostEl === document.body
          ? {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : hostEl.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 280), hostRect.width - 16);
      const gap = 6;
      const estimatedHeight = 320;
      const spaceBelow = hostRect.top + hostRect.height - rect.bottom - gap;
      const openUp =
        spaceBelow < estimatedHeight && rect.top - hostRect.top > spaceBelow;
      const left = Math.min(
        Math.max(hostRect.left + 8, rect.left),
        hostRect.left + hostRect.width - width - 8,
      );

      setPanelStyle({
        position: "fixed",
        zIndex: 100,
        left,
        width,
        top: openUp ? undefined : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
        maxHeight: openUp
          ? Math.max(180, rect.top - hostRect.top - 12)
          : Math.max(180, spaceBelow - 8),
        overflowY: "auto",
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    // Evita che lo stesso click di apertura chiuda subito il pannello.
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("keydown", onKey);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [year, monthNumber] = month.split("-").map(Number);
  const offset =
    (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthIndex = months.indexOf(month);
  const canPrev = monthIndex > 0;
  const canNext = monthIndex >= 0 && monthIndex < months.length - 1;

  const panel =
    open && portalTarget
      ? createPortal(
          <div
            ref={panelRef}
            id={listId}
            className="slot-date-panel"
            role="dialog"
            aria-label="Seleziona la data del tour"
            style={panelStyle}
          >
            <div className="slot-date-monthbar">
              <button
                type="button"
                aria-label="Mese precedente"
                disabled={!canPrev}
                onClick={() => canPrev && setMonth(months[monthIndex - 1])}
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <strong>{formatMonth(month)}</strong>
              <button
                type="button"
                aria-label="Mese successivo"
                disabled={!canNext}
                onClick={() => canNext && setMonth(months[monthIndex + 1])}
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>

            <div className="slot-date-grid">
              {WEEKDAYS.map((day) => (
                <span key={day} className="slot-date-weekday">
                  {day}
                </span>
              ))}
              {Array.from({ length: offset }, (_, index) => (
                <span key={`blank-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const date = `${month}-${String(index + 1).padStart(2, "0")}`;
                const enabled = availableSet.has(date);
                const selected = value === date;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!enabled}
                    aria-pressed={selected}
                    aria-label={formatDay(date)}
                    className={
                      selected
                        ? "slot-date-day is-selected"
                        : enabled
                          ? "slot-date-day is-available"
                          : "slot-date-day"
                    }
                    onClick={() => {
                      onChange(date);
                      setOpen(false);
                    }}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {months.length === 0 && (
              <p className="slot-date-empty">Nessuna data disponibile.</p>
            )}
          </div>,
          portalTarget,
        )
      : null;

  return (
    <div className="slot-date-picker" ref={rootRef}>
      <input type="hidden" name="day" value={value} required={required} />
      <button
        ref={triggerRef}
        type="button"
        className="slot-date-trigger text-input"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <span className={value ? "slot-date-value" : "slot-date-placeholder"}>
          {value ? formatDayShort(value) : "Scegli una data"}
        </span>
        <span className="slot-date-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {panel}
    </div>
  );
}
