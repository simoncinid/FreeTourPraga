"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Ticket,
  Wallet,
  CircleCheck,
  Clock3,
  ArrowUpRight,
  Inbox,
  CalendarDays,
  Plus,
  Mail,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PlatformState, Reservation } from "@/lib/platform/model";
import { formatMoney } from "@/lib/format";
import { pragueLocal } from "@/lib/platform/time";
import { RecordDrawer, recordsCss } from "./AdminRecords";
import css from "./admin-overview.module.css";

type RangeMode = "oggi" | "ieri" | "domani" | "range";

const date = (value: string) =>
  new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function money(rows: Reservation[]) {
  const sums = new Map<string, number>();
  for (const row of rows) {
    const currency = row.currency || "EUR";
    sums.set(currency, (sums.get(currency) || 0) + row.totalCents);
  }
  return sums.size
    ? [...sums].map(([currency, cents]) => ({
        currency,
        text: formatMoney(cents, currency),
      }))
    : [{ currency: "EUR", text: formatMoney(0) }];
}

function pragueToday() {
  return pragueLocal(new Date().toISOString()).slice(0, 10);
}

function shiftDay(day: string, delta: number) {
  const base = new Date(`${day}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + delta);
  return base.toISOString().slice(0, 10);
}

function bookingDay(
  booking: Reservation,
  tours: PlatformState["tours"],
) {
  const tour = tours.find((row) => row.slug === booking.tourSlug);
  const slot = tour?.slots.find((row) => row.id === booking.slotId);
  return pragueLocal(slot?.startsAt || booking.createdAt).slice(0, 10);
}

export function AdminOverview({
  data,
  busy,
  filterSlot,
  updateInquiry,
}: {
  data: Pick<PlatformState, "bookings" | "inquiries" | "tours" | "jobs">;
  busy: boolean;
  filterSlot: HTMLDivElement | null;
  updateInquiry: (id: string, status: string) => Promise<unknown>;
}) {
  const today = pragueToday();
  const [now, setNow] = useState(() => Date.now()),
    [page, setPage] = useState(0),
    [size, setSize] = useState(4),
    [selected, setSelected] = useState<string | null>(null),
    [mode, setMode] = useState<RangeMode>("oggi"),
    [from, setFrom] = useState(today),
    [to, setTo] = useState(today);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize(
        Math.max(1, Math.min(5, Math.floor(entry.contentRect.height / 76))),
      ),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const range = useMemo(() => {
    if (mode === "oggi") return { from: today, to: today };
    if (mode === "ieri") {
      const day = shiftDay(today, -1);
      return { from: day, to: day };
    }
    if (mode === "domani") {
      const day = shiftDay(today, 1);
      return { from: day, to: day };
    }
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    return { from: start, to: end };
  }, [mode, from, to, today]);

  const scoped = useMemo(() => {
    return data.bookings.filter((row) => {
      if (row.status === "cancelled") return false;
      const day = bookingDay(row, data.tours);
      return day >= range.from && day <= range.to;
    });
  }, [data.bookings, data.tours, range.from, range.to]);

  const collected = scoped.filter((row) => row.paymentStatus === "paid"),
    outstanding = scoped.filter((row) => row.paymentStatus !== "paid");
  const rows = data.inquiries
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    pending = rows.filter((row) => row.status === "new").length;
  const pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages - 1),
    inquiry = rows.find((row) => row.id === selected);
  const departures = data.tours
    .filter((tour) => tour.published)
    .flatMap((tour) =>
      tour.slots
        .filter(
          (slot) => !slot.closed && new Date(slot.startsAt).getTime() >= now,
        )
        .map((slot) => ({ tour, slot })),
    )
    .sort((a, b) => a.slot.startsAt.localeCompare(b.slot.startsAt))
    .slice(0, 3);
  const metrics = [
    {
      label: "Prenotazioni attive",
      icon: Ticket,
      tone: css.blue,
      values: [{ currency: "", text: String(scoped.length) }],
      note: "Escluse le cancellazioni",
      href: "/admin/prenotazioni",
    },
    {
      label: "Vendite",
      icon: Wallet,
      tone: css.orange,
      values: money(scoped),
      note: "Totale nel periodo filtrato",
      href: "/admin/prenotazioni",
    },
    {
      label: "Incassato",
      icon: CircleCheck,
      tone: css.green,
      values: money(collected),
      note: `${collected.length} prenotazioni saldate`,
      href: "/admin/prenotazioni",
    },
    {
      label: "Da incassare",
      icon: Clock3,
      tone: css.amber,
      values: money(outstanding),
      note: `${outstanding.length} prenotazioni da saldare`,
      href: "/admin/prenotazioni",
    },
  ];

  const filters = (
    <div className={css.filters} role="group" aria-label="Periodo KPI">
      <div className={css.filterPresets}>
        {(
          [
            ["oggi", "Oggi"],
            ["ieri", "Ieri"],
            ["domani", "Domani"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={mode === value ? css.filterActive : css.filterBtn}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={css.filterRange}>
        <label>
          <span>Dal</span>
          <input
            type="date"
            className={css.filterDate}
            value={mode === "range" ? from : range.from}
            onChange={(e) => {
              setFrom(e.target.value);
              setMode("range");
            }}
          />
        </label>
        <label>
          <span>Al</span>
          <input
            type="date"
            className={css.filterDate}
            value={mode === "range" ? to : range.to}
            min={mode === "range" ? from : range.from}
            onChange={(e) => {
              setTo(e.target.value);
              setMode("range");
            }}
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className={css.overview}>
      {filterSlot ? createPortal(filters, filterSlot) : null}
      <section
        className={css.metrics}
        aria-label="Riepilogo prenotazioni e incassi"
      >
        {metrics.map((metric) => (
          <Link className={css.metric} href={metric.href} key={metric.label}>
            <div className={css.metricHeader}>
              <span className={`${css.metricIcon} ${metric.tone}`}>
                <metric.icon size={17} />
              </span>
              <span>{metric.label}</span>
              <ArrowUpRight size={14} className={css.metricArrow} />
            </div>
            <div className={css.values}>
              {metric.values.map((value) => (
                <strong key={value.currency}>{value.text}</strong>
              ))}
            </div>
            <p>{metric.note}</p>
          </Link>
        ))}
      </section>
      <div className={css.panels}>
        <aside className={css.side}>
          <section className={`${css.card} ${css.departures}`}>
            <header className={css.cardHeader}>
              <div className={css.cardTitle}>
                <span className={`${css.metricIcon} ${css.orange}`}>
                  <CalendarDays size={17} />
                </span>
                <h2>Prossime partenze</h2>
              </div>
              <Link href="/admin/calendario" aria-label="Apri calendario">
                <ArrowUpRight size={16} />
              </Link>
            </header>
            <div className={css.departureList}>
              {departures.length ? (
                departures.map(({ tour, slot }) => (
                  <Link
                    href="/admin/calendario"
                    key={slot.id}
                    className={css.departure}
                  >
                    <div className={css.dateBox}>
                      <strong>
                        {new Date(slot.startsAt).toLocaleTimeString("it-IT", {
                          timeZone: "Europe/Prague",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                      <span>
                        {new Date(slot.startsAt).toLocaleDateString("it-IT", {
                          timeZone: "Europe/Prague",
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className={css.departureInfo}>
                      <strong>{tour.title}</strong>
                      <span>
                        {slot.reserved} prenotati ·{" "}
                        {Math.max(0, slot.capacity - slot.reserved)} posti
                        disponibili
                      </span>
                    </div>
                    <ArrowRight size={14} />
                  </Link>
                ))
              ) : (
                <div className={css.empty}>
                  <CalendarDays size={24} />
                  <p>Nessuna partenza in programma</p>
                </div>
              )}
            </div>
          </section>
          <section className={`${css.card} ${css.shortcuts}`}>
            <header>
              <h2>Accessi rapidi</h2>
              <p>Le operazioni di ogni giorno</p>
            </header>
            <div className={css.shortcutGrid}>
              {[
                {
                  label: "Nuova prenotazione",
                  icon: Plus,
                  href: "/admin/prenotazioni/nuova",
                  note: "Inserisci una prenotazione",
                },
                {
                  label: "Calendario",
                  icon: CalendarDays,
                  href: "/admin/calendario",
                  note: "Partenze e disponibilità",
                },
                {
                  label: "Email",
                  icon: Mail,
                  href: "/admin/pre-tour",
                  note: `${data.jobs.filter((job) => job.status === "queued").length} invii in coda`,
                },
                {
                  label: "Richieste",
                  icon: Inbox,
                  href: "/admin/richieste",
                  note: `${pending} da gestire`,
                },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <link.icon size={17} />
                  <div>
                    <strong>{link.label}</strong>
                    <span>{link.note}</span>
                  </div>
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          </section>
        </aside>
        <section className={`${css.card} ${css.requests}`}>
          <header className={css.cardHeader}>
            <div className={css.cardTitle}>
              <span className={`${css.metricIcon} ${css.blue}`}>
                <Inbox size={17} />
              </span>
              <div>
                <h2>Richieste dal sito</h2>
                <p>
                  {pending} da gestire · {rows.length} totali
                </p>
              </div>
            </div>
            <Link href="/admin/richieste">
              Vedi tutte <ArrowUpRight size={14} />
            </Link>
          </header>
          <div ref={list} className={css.requestList}>
            {rows.length ? (
              rows.slice(current * size, (current + 1) * size).map((row) => (
                <button
                  type="button"
                  key={row.id}
                  className={css.requestRow}
                  onClick={() => setSelected(row.id)}
                >
                  <div>
                    <strong>{row.name}</strong>
                    <span
                      className={`${css.badge} ${row.status === "new" ? css.waiting : css.handled}`}
                    >
                      {row.status === "new" ? "Da gestire" : "Gestita"}
                    </span>
                  </div>
                  <p>{row.message}</p>
                  <small>
                    {row.type} · {date(row.createdAt)}
                  </small>
                </button>
              ))
            ) : (
              <div className={css.empty}>
                <Inbox size={27} />
                <p>Nessuna richiesta ricevuta</p>
                <span>I nuovi messaggi compariranno qui.</span>
              </div>
            )}
          </div>
          <footer className={css.cardFooter}>
            <span>
              {rows.length
                ? `${current * size + 1}–${Math.min((current + 1) * size, rows.length)} di ${rows.length} richieste`
                : "Tutto aggiornato"}
            </span>
            <div>
              <button
                type="button"
                className={css.pageButton}
                aria-label="Richieste precedenti"
                disabled={!current}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className={css.pageButton}
                aria-label="Richieste successive"
                disabled={current >= pages - 1}
                onClick={() => setPage(current + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </footer>
        </section>
      </div>
      {inquiry && (
        <RecordDrawer
          title={inquiry.name}
          subtitle="Richiesta dal sito"
          close={() => setSelected(null)}
          locked={busy}
        >
          <dl className={recordsCss.facts}>
            <div>
              <dt>Email</dt>
              <dd>{inquiry.email}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{inquiry.phone || "Non indicato"}</dd>
            </div>
            <div>
              <dt>Tipologia</dt>
              <dd>{inquiry.type}</dd>
            </div>
            <div>
              <dt>Ricevuta</dt>
              <dd>{date(inquiry.createdAt)}</dd>
            </div>
          </dl>
          <label className={recordsCss.message}>
            Messaggio
            <textarea readOnly value={inquiry.message} />
          </label>
          <footer className={recordsCss.drawerFooter}>
            <button
              type="button"
              className="button-primary"
              disabled={busy}
              onClick={() =>
                void updateInquiry(
                  inquiry.id,
                  inquiry.status === "new" ? "handled" : "new",
                )
              }
            >
              {inquiry.status === "new"
                ? "Segna come gestita"
                : "Riapri richiesta"}
            </button>
          </footer>
        </RecordDrawer>
      )}
    </div>
  );
}
