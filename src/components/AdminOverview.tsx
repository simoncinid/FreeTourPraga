"use client";
import { useEffect, useRef, useState } from "react";
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
import { RecordDrawer, recordsCss } from "./AdminRecords";
import css from "./admin-overview.module.css";
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
export function AdminOverview({
  data,
  busy,
  updateInquiry,
}: {
  data: Pick<PlatformState, "bookings" | "inquiries" | "tours" | "jobs">;
  busy: boolean;
  updateInquiry: (id: string, status: string) => Promise<unknown>;
}) {
  const [now, setNow] = useState(() => Date.now()),
    [page, setPage] = useState(0),
    [size, setSize] = useState(4),
    [selected, setSelected] = useState<string | null>(null);
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
  const active = data.bookings.filter((row) => row.status !== "cancelled"),
    collected = active.filter((row) => row.paymentStatus === "paid"),
    outstanding = active.filter((row) => row.paymentStatus !== "paid");
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
      values: [{ currency: "", text: String(active.length) }],
      note: "Escluse le cancellazioni",
      href: "/admin/prenotazioni",
    },
    {
      label: "Vendite",
      icon: Wallet,
      tone: css.orange,
      values: money(active),
      note: "Totale delle prenotazioni attive",
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
  return (
    <div className={css.overview}>
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
