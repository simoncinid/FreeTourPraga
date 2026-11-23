"use client";
import { AdminNotice } from "./AdminNotice";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseCalendarTimes } from "@/lib/platform/calendar-times";
import type { CatalogTour } from "@/lib/platform/model";
import { pragueLocal } from "@/lib/platform/time";

const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { from, to };
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function OperationalCalendar({
  tours,
  busy,
  save,
  fixedTourId,
}: {
  tours: CatalogTour[];
  busy: boolean;
  fixedTourId?: string;
  save: (body: unknown) => Promise<unknown>;
}) {
  useEffect(() => {
    const dismiss = (event: MouseEvent | KeyboardEvent) => {
      const escape = "key" in event && event.key === "Escape";
      if ("key" in event && !escape) return;
      for (const popover of document.querySelectorAll<HTMLDetailsElement>(
        ".calendar-tour-menu[open], .compact-popover[open]",
      )) {
        if (escape || !popover.contains(event.target as Node)) {
          popover.open = false;
          if (escape) popover.querySelector<HTMLElement>("summary")?.focus();
        }
      }
    };
    document.addEventListener("click", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, []);

  const today = pragueLocal(new Date().toISOString()).slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [ids, setIds] = useState<string[]>(
    fixedTourId ? [fixedTourId] : tours.map((t) => t.id),
  );
  const [message, setMessage] = useState("");
  const [dayModal, setDayModal] = useState("");
  const [action, setAction] = useState("close");
  const [times, setTimes] = useState("");
  const [capacity, setCapacity] = useState(25);
  const dialog = useRef<HTMLDialogElement>(null);

  const [previousTours, setPreviousTours] = useState(tours);
  if (previousTours !== tours) {
    setPreviousTours(tours);
    if (!fixedTourId && tours.length) {
      setIds((current) => {
        const valid = new Set(tours.map((t) => t.id));
        const next = current.filter((id) => valid.has(id));
        return next.length ? next : tours.map((t) => t.id);
      });
    }
  }

  const selected = tours.filter((t) => ids.includes(t.id));
  const allSelected = tours.length > 0 && ids.length === tours.length;
  const viewRange = monthBounds(month);
  const viewStart = viewRange.from;
  const viewEnd = viewRange.to;
  const [year, mo] = month.split("-").map(Number);
  const monthTitle = `${MONTH_NAMES[mo - 1]} - ${year}`;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const viewDays =
    Math.round((Date.parse(viewEnd) - Date.parse(viewStart)) / 86400000) + 1;
  const tourMenuLabel = allSelected
    ? "Tutti i tour"
    : ids.length === 1
      ? tours.find((t) => t.id === ids[0])?.title || "1 tour"
      : `${ids.length} tour`;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (dayModal) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [dayModal]);

  function openDay(date: string) {
    setDayModal(date);
    setAction("close");
    setTimes("");
    setCapacity(25);
    setMessage("");
  }

  async function applyDay() {
    if (!dayModal || !ids.length) {
      setMessage("Seleziona almeno un tour.");
      return;
    }
    const parsed = parseCalendarTimes(times);
    if (!parsed.ok) {
      setMessage(parsed.error);
      return;
    }
    setMessage("");
    try {
      await save({
        tourIds: ids,
        from: dayModal,
        to: dayModal,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        times: parsed.times,
        action,
        capacity: action === "close" ? undefined : capacity,
      });
      setDayModal("");
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operazione non riuscita");
    }
  }

  const daySlots = dayModal
    ? selected.flatMap((t) =>
        t.slots
          .filter((s) => pragueLocal(s.startsAt).slice(0, 10) === dayModal)
          .map((s) => ({
            ...s,
            tourTitle: t.title,
            time: pragueLocal(s.startsAt).slice(11, 16),
          })),
      )
    : [];

  return (
    <section className="card operational-calendar">
      <h2 className="display-md">Calendario operativo</h2>
      <div className="calendar-toolbar">
        <div className="calendar-month-nav">
          <button
            type="button"
            aria-label="Mese precedente"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <ChevronLeft size={18} />
          </button>
          <strong aria-live="polite">{monthTitle}</strong>
          <button
            type="button"
            aria-label="Mese successivo"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {!fixedTourId && (
          <details className="calendar-tour-menu">
            <summary title={tourMenuLabel}>
              <span className="table-cell-line">{tourMenuLabel}</span>
            </summary>
            <div
              className="calendar-tour-menu-panel"
              aria-label="Tour selezionati"
            >
              <label>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) =>
                    setIds(e.target.checked ? tours.map((t) => t.id) : [])
                  }
                />
                <span className="table-cell-line">Tutti i tour</span>
              </label>
              {tours.map((t) => (
                <label key={t.id}>
                  <input
                    type="checkbox"
                    checked={ids.includes(t.id)}
                    onChange={(e) =>
                      setIds(
                        e.target.checked
                          ? [...ids, t.id]
                          : ids.filter((id) => id !== t.id),
                      )
                    }
                  />
                  <span className="table-cell-line" title={t.title}>
                    {t.title}
                  </span>
                </label>
              ))}
            </div>
          </details>
        )}
      </div>
      {message && <AdminNotice key={message} message={message} />}
      <div className="calendar-workspace">
        <div className="calendar-view">
          <div className="calendar-month-grid grid grid-cols-7 gap-1">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
              <strong key={d}>{d}</strong>
            ))}
            {Array.from(
              {
                length:
                  (new Date(`${viewStart}T12:00:00Z`).getUTCDay() + 6) % 7,
              },
              (_, i) => (
                <span key={`b${i}`} />
              ),
            )}
            {Array.from({ length: viewDays }, (_, i) => {
              const date = iso(
                new Date(Date.parse(`${viewStart}T12:00:00Z`) + i * 86400000),
              );
              const slots = selected.flatMap((t) =>
                t.slots.filter(
                  (s) => pragueLocal(s.startsAt).slice(0, 10) === date,
                ),
              );
              return (
                <button
                  type="button"
                  className="rounded border text-sm"
                  key={date}
                  aria-label={`Giorno ${date}`}
                  onClick={() => openDay(date)}
                >
                  <strong>{Number(date.slice(8))}</strong>
                  <small className="table-cell-line">
                    {slots.filter((s) => !s.closed).length} orari
                  </small>
                  <small className="table-cell-line">
                    {slots.reduce((n, s) => n + s.reserved, 0)} pax
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="calendar-day-modal"
        onClose={() => setDayModal("")}
        onCancel={(e) => {
          e.preventDefault();
          setDayModal("");
        }}
      >
        <div className="calendar-day-modal-head">
          <h3>
            Operazioni del{" "}
            {dayModal
              ? dayModal.slice(0, 10).split("-").reverse().join("/")
              : ""}
          </h3>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setDayModal("")}
          >
            Chiudi
          </button>
        </div>
        {!ids.length && (
          <p className="calendar-day-modal-hint">
            Seleziona almeno un tour dal menu in alto per applicare modifiche.
          </p>
        )}
        {daySlots.length > 0 && (
          <ul className="calendar-day-modal-slots">
            {daySlots.map((s) => (
              <li key={s.id}>
                <strong>{s.time}</strong>
                <span className="table-cell-line">
                  {s.tourTitle} · {s.reserved}/{s.capacity} ·{" "}
                  {s.closed ? "Chiuso" : "Aperto"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="calendar-day-modal-form">
          <label>
            Operazione
            <select
              className="text-input"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="close">Chiudi partenze</option>
              <option value="open">Apri / aggiungi orari</option>
              <option value="capacity">Modifica capienza</option>
            </select>
          </label>
          <label>
            Orari
            <input
              className="text-input"
              value={times}
              placeholder="Tutti · oppure 10:00, 14:30 · 10:00-12:00"
              onChange={(e) => setTimes(e.target.value)}
            />
          </label>
          <p className="calendar-day-modal-format">
            Accetta tutti / Tutti / TUTTI, orari singoli o elenchi (10:00,
            14:30) e intervalli ogni 30 minuti (10:00-12:00).
          </p>
          {action !== "close" && (
            <label>
              Posti per orario
              <input
                className="text-input"
                type="number"
                min={1}
                max={10000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
          )}
        </div>
        <div className="calendar-day-modal-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setDayModal("")}
          >
            Annulla
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={busy || !ids.length || !dayModal}
            onClick={() => void applyDay()}
          >
            Applica a {selected.length} tour
          </button>
        </div>
      </dialog>
    </section>
  );
}
