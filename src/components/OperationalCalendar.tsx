"use client";
import { AdminNotice } from "./AdminNotice";
import { RecordDrawer, recordsCss } from "./AdminRecords";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LockOpen,
  Trash2,
} from "lucide-react";
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
const WEEKDAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const RULE_ACTIONS = {
  close: "Chiudi",
  open: "Apri o aggiungi orari",
  capacity: "Modifica capienza",
  remove: "Elimina orari indicati",
};

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
function shiftDate(iso: string, days: number) {
  const cursor = new Date(`${iso}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}
function weekday(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}
function tone(slots: { closed?: boolean; capacity: number; reserved: number }[]) {
  if (!slots.length) return "";
  const open = slots.filter((slot) => !slot.closed);
  if (!open.length) return "cal-red";
  const cap = open.reduce((sum, slot) => sum + slot.capacity, 0);
  const left = open.reduce(
    (sum, slot) => sum + Math.max(0, slot.capacity - slot.reserved),
    0,
  );
  if (left <= 0) return "cal-red";
  if (left <= Math.max(2, Math.ceil(cap * 0.25))) return "cal-amber";
  return "cal-green";
}

export function OperationalCalendar({
  tours,
  busy,
  save,
  fixedTourId,
  closedDates = [],
  notices = [],
  refresh,
}: {
  tours: CatalogTour[];
  busy: boolean;
  fixedTourId?: string;
  closedDates?: string[];
  notices?: { id: string; text: string; at: string }[];
  refresh: (signal?: AbortSignal) => Promise<void>;
  save: (body: unknown) => Promise<unknown>;
}) {
  useEffect(() => {
    if (busy) return;
    let pending: AbortController | undefined;
    const timer = window.setInterval(() => {
      if (pending || document.visibilityState !== "visible") return;
      pending = new AbortController();
      void refresh(pending.signal).catch(() => {}).finally(() => {
        pending = undefined;
      });
    }, 10000);
    return () => {
      window.clearInterval(timer);
      pending?.abort();
    };
  }, [busy, refresh]);
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
  const [modalDates, setModalDates] = useState<string[]>([]);
  const [action, setAction] = useState("close");
  const [times, setTimes] = useState("");
  const [capacity, setCapacity] = useState(25);
  const [multi, setMulti] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [mark, setMark] = useState<{ from: string; to: string } | null>(null);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(monthBounds(today.slice(0, 7)).to);
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [bulkTimes, setBulkTimes] = useState("");
  const [bulkAction, setBulkAction] = useState("close");
  const [bulkCapacity, setBulkCapacity] = useState(25);
  const [ruleId, setRuleId] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [newTime, setNewTime] = useState("10:00");
  const [newTourId, setNewTourId] = useState("");
  const [slotCapacity, setSlotCapacity] = useState<Record<string, number>>({});
  const [slotTourFilter, setSlotTourFilter] = useState("");
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  const [previousTours, setPreviousTours] = useState(tours);
  if (previousTours !== tours) {
    setPreviousTours(tours);
    if (!fixedTourId && tours.length) {
      setIds((current) => {
        if (current.length === previousTours.length) return tours.map((t) => t.id);
        const valid = new Set(tours.map((t) => t.id));
        return current.filter((id) => valid.has(id));
      });
    }
  }

  const selected = tours.filter((t) => ids.includes(t.id));
  const allSelected = tours.length > 0 && ids.length === tours.length;
  const viewRange = monthBounds(month);
  const viewStart = mark?.from ?? viewRange.from;
  const viewEnd = mark?.to ?? viewRange.to;
  const [year, mo] = month.split("-").map(Number);
  const monthTitle = `${MONTH_NAMES[mo - 1]} - ${year}`;
  const multipleMonths = viewStart.slice(0, 7) !== viewEnd.slice(0, 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const viewDays =
    Math.round((Date.parse(viewEnd) - Date.parse(viewStart)) / 86400000) + 1;
  const tourMenuLabel = allSelected
    ? "Tutti i tour"
    : ids.length === 1
      ? tours.find((t) => t.id === ids[0])?.title || "1 tour"
      : `${ids.length} tour`;
  const single = ids.length === 1 ? tours.find((t) => t.id === ids[0]) : undefined;
  const editingRule = single?.calendarRules?.find((rule) => rule.id === ruleId);

  const slotsByDate = new Map<string, Array<CatalogTour["slots"][number] & {
    tourTitle: string;
    date: string;
    time: string;
    minParticipants?: number;
  }>>();
  const globallyClosed = new Set(closedDates);
  for (const tour of selected) {
    for (const slot of tour.slots) {
      if (slot.removed && slot.reserved === 0) continue;
      const local = pragueLocal(slot.startsAt);
      const date = local.slice(0, 10);
      const slots = slotsByDate.get(date) ?? [];
      slots.push({
          ...slot,
          tourId: tour.id,
          closed: slot.closed || globallyClosed.has(date),
          tourTitle: tour.title,
          date,
          time: local.slice(11, 16),
          minParticipants: tour.minParticipants,
      });
      slotsByDate.set(date, slots);
    }
  }
  function slotsOn(date: string) {
    return slotsByDate.get(date) ?? [];
  }
  const daySlots = modalDates.flatMap(slotsOn);
  const dayTourOptions = Array.from(
    new Map(
      daySlots.map((slot) => [slot.tourId, slot.tourTitle] as const),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1], "it"));
  const filteredDaySlots = slotTourFilter
    ? daySlots.filter((slot) => slot.tourId === slotTourFilter)
    : daySlots;
  const daySlotsByTour = dayTourOptions
    .map(([tourId, tourTitle]) => ({
      tourId,
      tourTitle,
      slots: filteredDaySlots
        .filter((slot) => slot.tourId === tourId)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
        ),
    }))
    .filter((group) => group.slots.length > 0);
  const [previousModalDates, setPreviousModalDates] = useState(modalDates);
  if (previousModalDates !== modalDates) {
    setPreviousModalDates(modalDates);
    setSlotTourFilter("");
    setExpandedSlotId(null);
    setNewTourId(ids.length === 1 ? ids[0] : "");
  }
  /** Solo tour con almeno una partenza nel giorno/i aperti nel drawer. */
  const addTourOptions = dayTourOptions.map(([id, title]) => ({
    id,
    title,
  }));
  const effectiveNewTourId =
    newTourId && addTourOptions.some((tour) => tour.id === newTourId)
      ? newTourId
      : addTourOptions.length === 1
        ? addTourOptions[0].id
        : slotTourFilter &&
            addTourOptions.some((tour) => tour.id === slotTourFilter)
          ? slotTourFilter
          : "";
  const lastEdit = selected
    .flatMap((tour) => [
      ...(tour.calendarLog ?? []),
      ...(tour.calendarRules ?? []).flatMap((rule) =>
        rule.at ? [{ at: rule.at, actor: rule.actor || "staff", from: rule.from, to: rule.to }] : [],
      ),
    ])
    .filter((entry) =>
      modalDates.some((date) => date >= entry.from && date <= entry.to),
    )
    .sort((a, b) => b.at.localeCompare(a.at))[0];

  async function run(body: Record<string, unknown>) {
    if (!ids.length) {
      setMessage("Seleziona almeno un tour.");
      return;
    }
    try {
      const result = (await save({ tourIds: ids, weekdays: [0, 1, 2, 3, 4, 5, 6], times: [], ...body })) as {
        warnings?: string[];
      } | null;
      setMessage(result?.warnings?.filter(Boolean).join(" ") || "Calendario aggiornato. Le prenotazioni esistenti sono conservate.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Modifica non salvata.");
    }
  }

  async function applyBulk(nextFrom: string, nextTo: string, nextAction = bulkAction) {
    const parsed = parseCalendarTimes(bulkTimes);
    if (!parsed.ok) {
      setMessage(parsed.error);
      return;
    }
    if (!days.length) {
      setMessage("Seleziona almeno un giorno della settimana.");
      return;
    }
    if (
      nextAction !== "close" &&
      nextAction !== "restore" &&
      nextAction !== "remove" &&
      bulkCapacity < 1
    ) {
      setMessage("Indica la capienza.");
      return;
    }
    await run({
      from: nextFrom,
      to: nextTo,
      weekdays: days,
      times: parsed.times,
      action: nextAction,
      ruleId: nextAction === "restore" ? undefined : editingRule?.id,
      capacity:
        nextAction === "close" || nextAction === "restore" || nextAction === "remove"
          ? undefined
          : bulkCapacity,
    });
  }

  return (
    <section className="card operational-calendar">
      <h2 className="display-md">Calendario operativo</h2>
      <div className="calendar-toolbar">
        <div className="calendar-month-nav">
          <button
            type="button"
            aria-label="Mese precedente"
            onClick={() => {
              setMark(null);
              setMonth((value) => shiftMonth(value, -1));
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <strong aria-live="polite">
            {multipleMonths ? `${viewStart} – ${viewEnd}` : monthTitle}
          </strong>
          <button
            type="button"
            aria-label="Mese successivo"
            onClick={() => {
              setMark(null);
              setMonth((value) => shiftMonth(value, 1));
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="calendar-toolbar-tools">
          <button
            type="button"
            className="button-primary calendar-program-trigger"
            onClick={() => setBulkOpen(true)}
          >
            Programmazione
          </button>
          {!fixedTourId && (
            <details className="calendar-tour-menu">
              <summary title={tourMenuLabel}>
                <span className="table-cell-line">{tourMenuLabel}</span>
              </summary>
              <div className="calendar-tour-menu-panel" aria-label="Tour selezionati">
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
                {tours.map((tour) => (
                  <label key={tour.id}>
                    <input
                      type="checkbox"
                      checked={ids.includes(tour.id)}
                      onChange={(e) =>
                        setIds(
                          e.target.checked
                            ? [...ids, tour.id]
                            : ids.filter((id) => id !== tour.id),
                        )
                      }
                    />
                    <span className="table-cell-line" title={tour.title}>
                      {tour.title}
                    </span>
                  </label>
                ))}
              </div>
            </details>
          )}
          {single && (
            <Link className="button-secondary" href={`/admin/tour/${single.slug}`}>
              Modifica impostazioni tour
            </Link>
          )}
        </div>
      </div>
      {/* foto1 — scorciatoie + intervallo nascosti (non eliminati)
      <div className="calendar-filters">
        {(
          [
            ["Oggi", today, today],
            ["Ieri", shiftDate(today, -1), shiftDate(today, -1)],
            ["Questo mese", monthBounds(today.slice(0, 7)).from, monthBounds(today.slice(0, 7)).to],
            ["Mese scorso", monthBounds(shiftMonth(today.slice(0, 7), -1)).from, monthBounds(shiftMonth(today.slice(0, 7), -1)).to],
            ["Prossimo mese", monthBounds(shiftMonth(today.slice(0, 7), 1)).from, monthBounds(shiftMonth(today.slice(0, 7), 1)).to],
          ] as const
        ).map(([label, start, end]) => (
          <button
            key={label}
            type="button"
            className="button-secondary"
            onClick={() => {
              setMonth(start.slice(0, 7));
              setMark({ from: start, to: end });
              setFrom(start);
              setTo(end);
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="button-secondary"
          aria-pressed={multi}
          onClick={() => {
            setMulti((value) => !value);
            setPicked([]);
          }}
        >
          {multi ? `${picked.length} giorni` : "Più giorni"}
        </button>
        {multi && picked.length > 0 && (
          <button
            type="button"
            className="button-primary"
            onClick={() => setModalDates([...picked].sort())}
          >
            Gestisci
          </button>
        )}
        <label>
          Dal
          <input className="text-input" type="date" aria-label="Dal" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Al
          <input className="text-input" type="date" aria-label="Al" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            if (from && to && from <= to && Date.parse(to) - Date.parse(from) <= 366 * 86400000) {
              setMonth(from.slice(0, 7));
              setMark({ from, to });
              setMessage("");
            } else {
              setMessage("Scegli un intervallo valido di massimo un anno.");
            }
          }}
        >
          Intervallo
        </button>
        <p className="calendar-legend">
          <span className="cal-green">Aperto</span>
          <span className="cal-amber">Ultimi</span>
          <span className="cal-red">Chiuso</span>
        </p>
      </div>
      */}
      {message && !modalDates.length && <AdminNotice key={message} message={message} />}
      {notices.slice(0, 3).map((notice) => (
        <AdminNotice key={notice.id} message={notice.text} />
      ))}
      <div className="calendar-workspace">
        <div className="calendar-view">
          <div className="calendar-month-grid grid grid-cols-7 gap-1">
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
              <strong key={day}>{day}</strong>
            ))}
            {Array.from(
              { length: (new Date(`${viewStart}T12:00:00Z`).getUTCDay() + 6) % 7 },
              (_, i) => (
                <span key={`b${i}`} />
              ),
            )}
            {Array.from({ length: viewDays }, (_, i) => {
              const date = iso(
                new Date(Date.parse(`${viewStart}T12:00:00Z`) + i * 86400000),
              );
              const slots = slotsOn(date);
              const open = slots.filter((slot) => !slot.closed);
              const reserved = slots.reduce((sum, slot) => sum + slot.reserved, 0);
              const capacity = slots.reduce((sum, slot) => sum + slot.capacity, 0);
              const left = open.reduce(
                (sum, slot) => sum + Math.max(0, slot.capacity - slot.reserved),
                0,
              );
              const marked = !!mark && date >= mark.from && date <= mark.to;
              return (
                <button
                  type="button"
                  className={`rounded border text-sm ${tone(slots)} ${picked.includes(date) ? "cal-picked" : ""} ${marked ? "cal-marked" : ""}`}
                  key={date}
                  aria-label={`Giorno ${date}`}
                  title={`${reserved} prenotati su ${capacity} · ${left} liberi`}
                  aria-pressed={picked.includes(date)}
                  onClick={() => {
                    if (multi) {
                      setPicked((current) =>
                        current.includes(date)
                          ? current.filter((item) => item !== date)
                          : [...current, date],
                      );
                      return;
                    }
                    setModalDates([date]);
                    setAction("close");
                    setTimes("");
                    setMessage("");
                  }}
                >
                  <strong>{multipleMonths ? date.slice(5).split("-").reverse().join("/") : Number(date.slice(8))}</strong>
                  <small>
                    {open.length
                      ? `${open.map((slot) => slot.time).slice(0, 2).join(" ")}${open.length > 2 ? "…" : ""} · ${left}`
                      : slots.length
                        ? "chiuso"
                        : "—"}
                  </small>
                  {slots.length > 0 && <small>{reserved}/{capacity} prenotati</small>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {bulkOpen && (
        <RecordDrawer
          title="Programmazione"
          subtitle="Operazioni di massa sul calendario"
          close={() => setBulkOpen(false)}
          locked={busy}
        >
          <form
            className="calendar-program-panel"
            onSubmit={(event) => {
              event.preventDefault();
              void applyBulk(from, to);
            }}
          >
            {!!single?.calendarRules?.length && (
              <label>
                Regole salvate
                <select
                  className="text-input"
                  value={editingRule?.id ?? ""}
                  onChange={(event) => {
                    const rule = single.calendarRules?.find(
                      (item) => item.id === event.target.value,
                    );
                    setRuleId(rule?.id ?? "");
                    if (!rule) return;
                    setFrom(rule.from);
                    setTo(rule.to);
                    setDays(rule.weekdays);
                    setBulkTimes(rule.times.join(", "));
                    setBulkAction(rule.action);
                    setBulkCapacity(
                      rule.capacity ?? single.schedule?.capacity ?? single.maxGuests,
                    );
                  }}
                >
                  <option value="">Nuova regola</option>
                  {single.calendarRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {RULE_ACTIONS[rule.action as keyof typeof RULE_ACTIONS]} ·{" "}
                      {rule.from} – {rule.to}
                      {rule.times.length > 0 ? ` · ${rule.times.join(", ")}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <fieldset className="calendar-program-days">
              <legend>Giorni della settimana</legend>
              <div className="calendar-weekdays">
                {WEEKDAYS.map((label, index) => (
                  <label key={label}>
                    <input
                      type="checkbox"
                      checked={days.includes(index)}
                      onChange={(event) =>
                        setDays(
                          event.target.checked
                            ? [...days, index]
                            : days.filter((day) => day !== index),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Operazione
              <select
                className="text-input"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                {Object.entries(RULE_ACTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
                <option value="restore">Ripristina programmazione base</option>
              </select>
            </label>
            <label>
              Orari
              <input
                className="text-input"
                value={bulkTimes}
                placeholder="Tutti · 10:00, 14:30"
                onChange={(e) => setBulkTimes(e.target.value)}
              />
            </label>
            {bulkAction !== "close" &&
              bulkAction !== "restore" &&
              bulkAction !== "remove" && (
                <label>
                  Posti
                  <input
                    className="text-input"
                    type="number"
                    min={1}
                    max={10000}
                    value={bulkCapacity}
                    onChange={(e) => setBulkCapacity(Number(e.target.value))}
                  />
                </label>
              )}
            <div className="calendar-program-range">
              <label>
                Dal
                <input
                  className="text-input"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                Al
                <input
                  className="text-input"
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </div>
            <p className="calendar-program-hint">
              Applica esegue l’operazione sul periodo Dal–Al. I tasti sotto sono
              scorciatoie: mese aperto in calendario, oppure tutto l’anno.
            </p>
            <footer className={recordsCss.drawerFooter}>
              <div className="calendar-program-actions">
                <button
                  className="button-primary"
                  type="submit"
                  disabled={busy || !ids.length}
                >
                  {editingRule && bulkAction !== "restore"
                    ? "Salva regola sull’intervallo"
                    : "Applica all’intervallo"}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  disabled={busy || !ids.length}
                  onClick={() => {
                    const bounds = monthBounds(month);
                    setFrom(bounds.from);
                    setTo(bounds.to);
                    void applyBulk(bounds.from, bounds.to);
                  }}
                >
                  Applica al mese ({MONTH_NAMES[mo - 1]})
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  disabled={busy || !ids.length}
                  onClick={() => void applyBulk(`${year}-01-01`, `${year}-12-31`)}
                >
                  Applica a tutto il {year}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  disabled={busy || !ids.length}
                  onClick={() => void applyBulk(from, to, "restore")}
                >
                  Ripristina orari base sull’intervallo
                </button>
              </div>
            </footer>
          </form>
        </RecordDrawer>
      )}
      {!!modalDates.length && (
        <RecordDrawer
          title={
            modalDates.length === 1
              ? modalDates[0].split("-").reverse().join("/")
              : `${modalDates.length} giorni`
          }
          subtitle="Operazioni sul giorno"
          close={() => setModalDates([])}
          locked={busy}
        >
          <div className="calendar-day-panel">
            <div className="calendar-day-panel-body">
            {!ids.length && (
              <p className="calendar-program-hint">
                Seleziona almeno un tour dal menu in alto per applicare modifiche.
              </p>
            )}
            {message && (
              <p className="calendar-program-hint" role="status">
                {message}
              </p>
            )}

            <section className="calendar-day-section" id="calendar-day-partenze">
              <div className="calendar-day-section-head">
                <h4>Partenze del giorno</h4>
                {dayTourOptions.length > 1 && (
                  <label className="calendar-day-tour-filter">
                    <select
                      className="text-input"
                      aria-label="Filtra per tour"
                      value={slotTourFilter}
                      onChange={(event) => {
                        setSlotTourFilter(event.target.value);
                        setExpandedSlotId(null);
                      }}
                    >
                      <option value="">Tutti i tour</option>
                      {dayTourOptions.map(([tourId, tourTitle]) => (
                        <option key={tourId} value={tourId}>
                          {tourTitle}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {daySlots.length === 0 ? (
                <p className="calendar-program-hint">Nessun orario su questo giorno.</p>
              ) : filteredDaySlots.length === 0 ? (
                <p className="calendar-program-hint">
                  Nessuna partenza per il tour selezionato.
                </p>
              ) : (
                <div className="calendar-day-slot-groups">
                  {daySlotsByTour.map((group) => (
                    <div key={group.tourId} className="calendar-day-slot-group">
                      {dayTourOptions.length > 1 && !slotTourFilter && (
                          <h5 className="calendar-day-slot-group-title">
                            <span
                              className="calendar-day-slot-group-name"
                              title={group.tourTitle}
                            >
                              {group.tourTitle}
                            </span>
                            <span className="calendar-day-slot-group-count">
                              {group.slots.length}{" "}
                              {group.slots.length === 1
                                ? "partenza"
                                : "partenze"}
                            </span>
                          </h5>
                        )}
                      <ul className="calendar-day-slots">
                        {group.slots.map((slot) => {
                          const free = slot.closed
                            ? 0
                            : Math.max(0, slot.capacity - slot.reserved);
                          const status = slot.removed
                            ? "rimosso"
                            : slot.closed
                              ? "chiuso"
                              : "aperto";
                          const open = expandedSlotId === slot.id;
                          const when =
                            (modalDates.length > 1
                              ? `${slot.date.slice(8)}/${slot.date.slice(5, 7)} · `
                              : "") + slot.time;
                          return (
                            <li
                              key={slot.id}
                              className={
                                open
                                  ? "calendar-day-slot is-open"
                                  : "calendar-day-slot"
                              }
                            >
                              <button
                                type="button"
                                className="calendar-day-slot-toggle"
                                aria-expanded={open}
                                onClick={() =>
                                  setExpandedSlotId(open ? null : slot.id)
                                }
                              >
                                <span className="calendar-day-slot-toggle-main">
                                  <strong>{when}</strong>
                                  <span className="calendar-day-slot-meta">
                                    {slot.reserved}/{slot.capacity} prenotati ·{" "}
                                    {free} liberi
                                    {slot.minParticipants &&
                                    slot.reserved < slot.minParticipants
                                      ? ` · minimo ${slot.minParticipants}`
                                      : ""}
                                  </span>
                                </span>
                                <span className="calendar-day-slot-toggle-side">
                                  <span
                                    className={`calendar-day-status cal-${status === "aperto" ? "green" : status === "chiuso" ? "red" : "amber"}`}
                                  >
                                    {status}
                                  </span>
                                  <ChevronDown
                                    size={16}
                                    className="calendar-day-slot-chevron"
                                    aria-hidden
                                  />
                                </span>
                              </button>
                              {open && (
                                <div className="calendar-day-slot-body">
                                  <div className="calendar-day-slot-capacity">
                                    <span className="calendar-day-slot-capacity-label">
                                      Posti
                                    </span>
                                    <div className="calendar-day-slot-capacity-row">
                                      <input
                                        className="text-input"
                                        type="number"
                                        min={1}
                                        max={10000}
                                        aria-label="Posti"
                                        value={
                                          slotCapacity[slot.id] ??
                                          slot.capacity
                                        }
                                        onChange={(event) =>
                                          setSlotCapacity((current) => ({
                                            ...current,
                                            [slot.id]: Number(
                                              event.target.value,
                                            ),
                                          }))
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="button-primary"
                                        disabled={busy}
                                        onClick={() =>
                                          void run({
                                            tourIds: [slot.tourId],
                                            from: slot.date,
                                            to: slot.date,
                                            weekdays: [weekday(slot.date)],
                                            times: [slot.time],
                                            action: "capacity",
                                            capacity:
                                              slotCapacity[slot.id] ??
                                              slot.capacity,
                                          })
                                        }
                                      >
                                        Salva posti
                                      </button>
                                      <div className="calendar-day-slot-tools">
                                        {slot.closed && !slot.removed && (
                                          <button
                                            type="button"
                                            className="calendar-day-icon-btn calendar-day-icon-open"
                                            disabled={busy}
                                            aria-label="Riapri partenza"
                                            title="Riapri partenza"
                                            onClick={() =>
                                              void run({
                                                tourIds: [slot.tourId],
                                                from: slot.date,
                                                to: slot.date,
                                                weekdays: [
                                                  weekday(slot.date),
                                                ],
                                                times: [slot.time],
                                                action: "open",
                                                capacity: slot.capacity,
                                              })
                                            }
                                          >
                                            <LockOpen size={16} />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className="calendar-day-icon-btn calendar-day-icon-danger"
                                          disabled={busy}
                                          aria-label="Elimina orario"
                                          title="Elimina orario"
                                          onClick={() =>
                                            void run({
                                              tourIds: [slot.tourId],
                                              from: slot.date,
                                              to: slot.date,
                                              weekdays: [
                                                weekday(slot.date),
                                              ],
                                              times: [slot.time],
                                              action: "remove",
                                            })
                                          }
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              className="calendar-day-section calendar-day-section-add"
              id="calendar-day-aggiungi"
            >
              <h4>Aggiungi un orario</h4>
              <p className="calendar-program-hint">
                Crea una nuova partenza su{" "}
                {modalDates.length === 1
                  ? "questo giorno"
                  : "i giorni selezionati"}
                , per un solo tour.
              </p>
              <label>
                Tour
                <select
                  className="text-input"
                  value={effectiveNewTourId}
                  onChange={(e) => setNewTourId(e.target.value)}
                  required
                >
                  {addTourOptions.length !== 1 && (
                    <option value="">Seleziona un tour</option>
                  )}
                  {addTourOptions.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="calendar-program-range">
                <label>
                  Orario
                  <input
                    className="text-input"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </label>
                <label>
                  Posti disponibili
                  <input
                    className="text-input"
                    type="number"
                    min={1}
                    max={10000}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                </label>
              </div>
              <button
                type="button"
                className="button-primary"
                disabled={busy || !effectiveNewTourId}
                onClick={() => {
                  if (!effectiveNewTourId) {
                    setMessage("Seleziona il tour per la nuova partenza.");
                    return;
                  }
                  const parsed = parseCalendarTimes(newTime);
                  if (!parsed.ok) {
                    setMessage(parsed.error);
                    return;
                  }
                  void run({
                    tourIds: [effectiveNewTourId],
                    dates: modalDates,
                    from: modalDates[0],
                    to: modalDates[0],
                    times: parsed.times,
                    action: "open",
                    capacity,
                  });
                }}
              >
                Aggiungi orario
              </button>
            </section>

            <section
              className="calendar-day-section calendar-day-section-bulk"
              id="calendar-day-azione"
            >
              <h4>Azione su tutte le partenze</h4>
              <p className="calendar-program-hint">
                Applica la stessa operazione a tutti gli orari del giorno (o solo a quelli indicati).
              </p>
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
                  <option value="restore">Ripristina programmazione base</option>
                </select>
              </label>
              <label>
                Orari coinvolti
                <input
                  className="text-input"
                  value={times}
                  placeholder="Vuoto = tutti · oppure 10:00, 14:30"
                  onChange={(e) => setTimes(e.target.value)}
                />
              </label>
              {action !== "close" && action !== "restore" && (
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
              <button
                type="button"
                className="button-primary"
                disabled={busy || !ids.length || !modalDates.length}
                onClick={() => {
                  const parsed = parseCalendarTimes(times);
                  if (!parsed.ok) {
                    setMessage(parsed.error);
                    return;
                  }
                  void run({
                    dates: modalDates,
                    from: modalDates[0],
                    to: modalDates[0],
                    times: parsed.times,
                    action,
                    capacity:
                      action === "close" || action === "restore" ? undefined : capacity,
                  });
                }}
              >
                Applica al giorno
              </button>
            </section>

            <p className="calendar-program-hint">
              {lastEdit
                ? `Ultima modifica: ${lastEdit.actor || "staff"} il ${new Date(lastEdit.at!).toLocaleString("it-IT", { timeZone: "Europe/Prague", dateStyle: "short", timeStyle: "short" })}`
                : "Nessuna modifica registrata su questi giorni."}
            </p>
            </div>
            <nav className="calendar-day-jump" aria-label="Sezioni rapide">
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  document
                    .getElementById("calendar-day-aggiungi")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Aggiungi un orario
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  document
                    .getElementById("calendar-day-azione")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Azione su tutte le partenze
              </button>
            </nav>
          </div>
        </RecordDrawer>
      )}
    </section>
  );
}
