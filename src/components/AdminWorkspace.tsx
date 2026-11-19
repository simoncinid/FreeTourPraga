"use client";
import { CalendarClosures } from "./CalendarClosures";
import { TourOperationsEditor } from "./TourOperationsEditor";
import Link from "next/link";
import { TourGalleryEditor } from "./TourGalleryEditor";
import { tourGalleryImages } from "@/lib/tour-gallery";
import { ContentWorkspace } from "./ContentWorkspace";
import type { SiteContent } from "@/lib/platform/content";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  Ticket,
  Users,
  Mail,
  Settings2,
  FileText,
  RefreshCw,
  LogOut,
  Plus,
} from "lucide-react";
import type {
  Affiliate,
  CatalogTour,
  PlatformState,
  Reservation,
  Settings,
} from "@/lib/platform/model";
import { pragueLocal } from "@/lib/platform/time";
import { formatMoney } from "@/lib/format";
type Data = Omit<PlatformState, "orders" | "rateLimits" | "events"> & {
  role: string;
  siteContent: SiteContent;
  integrations: Record<string, boolean>;
};
const navigation = [
  ["", "Panoramica", LayoutDashboard],
  ["prenotazioni", "Prenotazioni", Ticket],
  ["tour", "Tour e orari", Map],
  ["calendario", "Calendario", CalendarDays],
  ["affiliati", "Affiliati", Users],
  ["canali", "Canali OTA", RefreshCw],
  ["pre-tour", "Email e reminder", Mail],
  ["contenuti", "Contenuti", FileText],
  ["richieste", "Richieste", Users],
  ["impostazioni", "Regole e tariffe", Settings2],
  ["report", "KPI e campagne", LayoutDashboard],
  ["audit", "Registro attività", FileText],
] as const;

/**
 * Nascoste in Fase 1 (codice integro, solo UI). Certe perché esplicite in Fase 2
 * o assenti dal perimetro Fase 1 del contratto:
 * - canali → F2 STEP 10 (OTA / parsing email)
 * - report → F2 STEP 12 (KPI / Google Ads)
 * - audit → non previsto in Fase 1
 * NON nascosta: pre-tour (email di conferma = F1 STEP 5; solo WA è F2).
 */
const PHASE2_OR_EXTRA_SECTIONS = new Set<string>([
  "canali",
  "report",
  "audit",
]);

const phase1Navigation = navigation.filter(
  ([slug]) => !PHASE2_OR_EXTRA_SECTIONS.has(slug),
);
const labels: Record<string, string> = {
  confirmed: "Confermata",
  pending: "In attesa",
  cancelled: "Cancellata",
  present: "Presente",
  no_show: "Assente",
  paid: "Pagato",
  not_required: "Saldo sul posto",
  refunded: "Rimborsato",
  failed: "Da verificare",
  queued: "In coda",
  running: "In corso",
  sent: "Inviato",
  review: "Da verificare",
  imported: "Importato",
  rejected: "Escluso",
};
function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="text-input"
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <textarea
        className="text-input min-h-28"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Chip({ value }: { value: string }) {
  return (
    <span
      className={`status-chip ${["paid", "confirmed", "present", "sent", "imported"].includes(value) ? "status-success" : ""}`}
    >
      {labels[value] || value}
    </span>
  );
}
function time(value: string) {
  return new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "short",
    timeStyle: "short",
  });
}
export function AdminWorkspace() {
  const router = useRouter();
  const path = usePathname().split("/").filter(Boolean);
  const raw = path[1] || "";
  const section = ["prezzi", "sconti", "last-minute"].includes(raw)
    ? "impostazioni"
    : raw === "email"
      ? "pre-tour"
      : raw;
  const detail = path[2];
  const [data, setData] = useState<Data | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [tourFilter, setTourFilter] = useState(""),
    [dateFilter, setDateFilter] = useState(""),
    [slotFilter, setSlotFilter] = useState("");
  const load = useCallback(async () => {
    const r = await fetch("/api/platform/admin/state", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (r.status === 401) {
      router.replace("/accesso");
      return;
    }
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setData(d);
  }, [router]);
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, [load]);
  // Aggiorna in background al ritorno sul tab, senza svuotare la UI.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      load().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);
  async function mutate(route: string, body: unknown, method = "POST") {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`/api/platform/admin/${route}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      setMessage("Operazione completata.");
      return d;
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Connessione non disponibile",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <section className="section container-page">
        <p role="status">{message || "Caricamento spazio di gestione…"}</p>
        <Link href="/accesso">Accedi</Link>
      </section>
    );
  if (
    data.role !== "admin" &&
    ["tour", "affiliati", "contenuti", "impostazioni", "sito"].includes(section)
  )
    return (
      <section className="section container-page">
        <h1 className="display-lg">
          Questa sezione richiede un amministratore.
        </h1>
        <Link className="button-secondary mt-6" href="/admin">
          Torna alla panoramica
        </Link>
      </section>
    );
  const slot = (b: Reservation) =>
    data.tours
      .find((t) => t.slug === b.tourSlug)
      ?.slots.find((s) => s.id === b.slotId);
  const filtered = data.bookings.filter(
    (b) =>
      (!tourFilter || b.tourSlug === tourFilter) &&
      (!dateFilter ||
        (slot(b) ? pragueLocal(slot(b)!.startsAt).slice(0, 10) : "") ===
          dateFilter) &&
      (!slotFilter || b.slotId === slotFilter) &&
      [b.name, b.pnr, b.email, b.phone, b.source]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const active = data.bookings.filter((b) => b.status !== "cancelled");
  const revenue = active.reduce((s, b) => s + b.totalCents, 0);
  const collected = active
    .filter((b) => b.paymentStatus === "paid")
    .reduce((s, b) => s + b.totalCents, 0);
  const table = (rows: Reservation[]) => (
    <>
      <div className="grid gap-4 md:hidden">
        {rows.map((b) => (
          <article className="card grid gap-3 p-5" key={b.id}>
            <div className="flex justify-between gap-3">
              <Link
                className="font-bold underline"
                href={`/admin/prenotazioni/${b.pnr}`}
              >
                {b.pnr}
              </Link>
              <Chip value={b.status} />
            </div>
            <strong>{b.name}</strong>
            <p>{data.tours.find((t) => t.slug === b.tourSlug)?.title}</p>
            <p className="text-sm">
              {slot(b) ? time(slot(b)!.startsAt) : b.slotId} · {b.totalGuests}{" "}
              partecipanti
            </p>
            <div className="flex justify-between">
              <strong>{formatMoney(b.totalCents)}</strong>
              <Chip value={b.paymentStatus} />
            </div>
          </article>
        ))}
        {!rows.length && <p>Nessuna prenotazione presente.</p>}
      </div>
      <div className="table-wrap hidden md:block">
        <table className="data-table">
          <thead>
            <tr>
              {[
                "Prenotazione",
                "Viaggiatore",
                "Esperienza / partenza",
                "Partecipanti",
                "Totale",
                "Stato",
                "Pagamento",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link
                    className="font-bold underline"
                    href={`/admin/prenotazioni/${b.pnr}`}
                  >
                    {b.pnr}
                  </Link>
                  <small className="block">{b.source}</small>
                </td>
                <td>
                  {b.name}
                  <small className="block">{b.email}</small>
                </td>
                <td>
                  {data.tours.find((t) => t.slug === b.tourSlug)?.title}
                  <small className="block">
                    {slot(b) ? time(slot(b)!.startsAt) : b.slotId}
                  </small>
                </td>
                <td>{b.totalGuests}</td>
                <td>{formatMoney(b.totalCents)}</td>
                <td>
                  <Chip value={b.status} />
                </td>
                <td>
                  <Chip value={b.paymentStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6">Nessuna prenotazione presente.</p>}
      </div>
    </>
  );
  const booking = detail ? data.bookings.find((b) => b.pnr === detail) : null;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          FreeTour<span className="site-brand-accent">Praga</span>
          <small className="mt-2 block text-xs">Spazio di gestione</small>
        </Link>
        <nav className="admin-nav admin-desktop-nav">
          {phase1Navigation
            .filter(
              ([slug]) =>
                data.role === "admin" ||
                !["tour", "contenuti", "impostazioni", "sito"].includes(slug),
            )
            .map(([slug, label, Icon]) => (
              <Link
                key={slug}
                href={`/admin${slug ? "/" + slug : ""}`}
                className={section === slug ? "active" : ""}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
        </nav>
        <details className="admin-mobile-menu">
          <summary className="button-secondary">Apri menu gestionale</summary>
          <nav className="admin-nav mt-3">
            {phase1Navigation
              .filter(
                ([slug]) =>
                  data.role === "admin" ||
                  !["tour", "contenuti", "impostazioni", "sito"].includes(
                    slug,
                  ),
              )
              .map(([slug, label, Icon]) => (
                <Link key={slug} href={`/admin${slug ? "/" + slug : ""}`}>
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
          </nav>
        </details>
        <Link href="/" className="button-secondary">
          Vai al sito
        </Link>
        <button
          className="mt-4 flex gap-2 text-sm"
          onClick={async () => {
            await fetch("/api/platform/logout", { method: "POST" });
            router.replace("/accesso");
          }}
        >
          <LogOut size={16} />
          Esci
        </button>
      </aside>
      <div
        className={`admin-main min-w-0${section === "calendario" ? " admin-calendar-page" : ""}`}
      >
        <header className="mb-7 flex flex-wrap justify-between gap-4">
          <div>
            <p className="micro-label text-primary">
              Operatività · Europe/Prague
            </p>
            <h1 className="display-lg mt-2">
              {navigation.find((n) => n[0] === section)?.[1] || "Gestione"}
            </h1>
          </div>
          <button
            onClick={() => load().catch((e) => setMessage(e.message))}
            className="button-secondary"
          >
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </header>
        {message && (
          <p
            role="status"
            className={`card border-l-4 border-primary p-4${section === "calendario" ? " mb-3" : " mb-6"}`}
          >
            {message}
          </p>
        )}
        {PHASE2_OR_EXTRA_SECTIONS.has(section) ? (
          <div className="card p-6">
            <h2 className="display-md mb-3">Disponibile dalla Fase 2</h2>
            <p className="body-md">
              Questa area non rientra nel perimetro della Fase 1 (Sito Base
              Indipendente). Il codice resta nel sistema e potrà essere
              riattivato con la Fase 2 opzionale.
            </p>
            <Link href="/admin" className="button-secondary mt-6">
              Torna alla panoramica
            </Link>
          </div>
        ) : (
          <>
        {section === "" && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Prenotazioni attive", active.length],
                ["Vendite", formatMoney(revenue)],
                ["Incassato", formatMoney(collected)],
                ["Da incassare", formatMoney(revenue - collected)],
              ].map(([label, value]) => (
                <div className="card p-6" key={label}>
                  <p className="text-sm">{label}</p>
                  <strong className="mt-3 block text-3xl text-ink">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
            <div className="card mb-7 grid gap-4 p-6"><h2 className="display-md">Richieste dal sito</h2><p>{data.inquiries.filter((i) => i.status === "new").length} richieste da gestire · {data.inquiries.length} totali</p>{data.inquiries.slice().reverse().slice(0, 5).map((i) => <div key={i.id} className="border-t pt-3"><strong>{i.name}</strong><p className="whitespace-pre-wrap text-sm">{i.message}</p><small>{time(i.createdAt)} · {i.status === "new" ? "Da gestire" : "Gestita"}</small></div>)}<Link href="/admin/richieste" className="underline">Apri richieste e messaggi</Link></div>
            <div className="card mb-7 p-6">
              <h2 className="display-md mb-4">Servizi e automazioni</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.integrations).map(([k, v]) => (
                  <span className="status-chip" key={k}>
                    {k}: {v ? "configurato" : "da collegare"}
                  </span>
                ))}
              </div>
              {!data.integrations.database && (
                <p className="mt-4 text-sm">
                  Ambiente locale: dati persistenti su questo computer. Per la
                  produzione attivare PostgreSQL.
                </p>
              )}
            </div>
          </>
        )}
        {section === "prenotazioni" &&
          (detail === "nuova" ? (
            <ManualBooking
              tours={data.tours}
              busy={busy}
              save={(input) => mutate("manual", input)}
            />
          ) : booking ? (
            <BookingDetail
              booking={booking}
              tour={data.tours.find((t) => t.slug === booking.tourSlug)!}
              busy={busy}
              save={(body) => mutate("booking", body, "PATCH")}
            />
          ) : (
            <>
              <div className="card mb-6 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Cerca nome, PNR, email"
                  value={search}
                  onChange={setSearch}
                />
                <label>
                  Tour
                  <select
                    className="text-input"
                    value={tourFilter}
                    onChange={(e) => {
                      setTourFilter(e.target.value);
                      setSlotFilter("");
                    }}
                  >
                    <option value="">Tutti i tour</option>
                    {data.tours.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Data"
                  value={dateFilter}
                  onChange={setDateFilter}
                  type="date"
                />
                <label>
                  Partenza
                  <select
                    className="text-input"
                    value={slotFilter}
                    onChange={(e) => setSlotFilter(e.target.value)}
                  >
                    <option value="">Tutti gli orari</option>
                    {data.tours
                      .filter((t) => !tourFilter || t.slug === tourFilter)
                      .flatMap((t) => t.slots)
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {time(s.startsAt)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="mb-5 flex flex-wrap gap-3">
                <Link
                  className="button-primary"
                  href="/admin/prenotazioni/nuova"
                >
                  <Plus size={17} />
                  Nuova prenotazione
                </Link>
                <a
                  className="button-secondary"
                  href="/api/platform/admin/export"
                  download
                >
                  Esporta CSV
                </a>
              </div>
              {table(filtered.slice().reverse())}
            </>
          ))}
        {section === "tour" &&
          (detail ? (
            <TourEditor
              key={detail}
              tour={
                data.tours.find((t) => t.slug === detail) || {
                  ...structuredClone(data.tours[0]),
                  id: crypto.randomUUID(),
                  slug: "nuovo-tour",
                  title: "Nuovo tour",
                  canonicalPath: undefined,
                  sourceUrl: undefined,
                  sourceUpdatedAt: undefined,
                  importedFromWordpress: false,
                  operationalReviewRequired: false,
                  schedule: undefined,
                  closures: [],
                  published: false,
                  slots: [],
                }
              }
              defaults={data.settings}
              categories={[
                ...new Set(
                  data.tours
                    .map((t) => t.category.trim())
                    .filter(Boolean),
                ),
              ].sort((a, b) => a.localeCompare(b, "it"))}
              closedDates={data.closedDates ?? []}
              busy={busy}
              save={(t) => mutate("tour", t, "PUT")}
            />
          ) : (
            <>
              <Link className="button-primary mb-6" href="/admin/tour/nuovo">
                Crea un tour
              </Link>
              <div className="grid gap-5">
                {data.tours.map((t) => (
                  <article
                    className="card flex flex-wrap justify-between gap-4 p-6"
                    key={t.id}
                  >
                    <div>
                      <h2 className="display-md">{t.title}</h2>
                      <p>
                        {t.slots.length} partenze · da{" "}
                        {formatMoney(t.basePriceCents)} ·{" "}
                        {t.published ? "Pubblicato" : "Bozza"}
                      </p>
                    </div>
                    <Link
                      className="button-secondary"
                      href={`/admin/tour/${t.slug}`}
                    >
                      Modifica
                    </Link>
                  </article>
                ))}
              </div>
            </>
          ))}
        {section === "calendario" && <CalendarClosures closedDates={data.closedDates ?? []} busy={busy} save={(body) => mutate("calendar/closure", body)} bookings={active.map((b) => ({ date: slot(b) ? pragueLocal(slot(b)!.startsAt).slice(0, 10) : "", guests: b.totalGuests }))} />}
        {section === "impostazioni" && (
          <SettingsEditor
            key={JSON.stringify(data.settings)}
            settings={data.settings}
            busy={busy}
            save={(s) => mutate("settings", s, "PUT")}
          />
        )}
        {section === "affiliati" && (
          <>
            <AffiliateEditor
              busy={busy}
              save={(a) => mutate("affiliate", a, "PUT")}
            />
            <div className="mt-7 grid gap-5">
              {data.affiliates.map((a) => {
                const rows = data.bookings.filter(
                  (b) => b.affiliateCode === a.code,
                );
                const payable = rows.filter(
                  (b) => b.status === "present" && !b.commissionPaid,
                );
                return (
                  <article className="card p-6" key={a.code}>
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <h2 className="display-md">{a.name}</h2>
                        <p>
                          {a.type} · {a.code}
                          {a.wpId != null ? ` · WP #${a.wpId}` : ""} ·{" "}
                          {a.commissionPercent}% ·{" "}
                          {a.active ? "Attivo" : "Sospeso"}
                        </p>
                        <p>
                          {rows.length} prenotazioni · maturato da liquidare{" "}
                          {formatMoney(
                            payable.reduce((s, b) => s + b.commissionCents, 0),
                          )}
                        </p>
                        <a
                          className="block break-all text-sm underline"
                          href={
                            a.wpId != null
                              ? `/?affiliates=${a.wpId}`
                              : `/?ref=${a.code}`
                          }
                        >
                          {typeof window !== "undefined"
                            ? window.location.origin
                            : ""}
                          {a.wpId != null
                            ? `/?affiliates=${a.wpId}`
                            : `/?ref=${a.code}`}
                        </a>
                      </div>
                      <a
                        href={`/api/platform/admin/affiliate/qr?code=${a.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="button-secondary"
                      >
                        Scarica QR
                      </a>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="button-secondary"
                        disabled={busy}
                        onClick={() =>
                          mutate(
                            "affiliate",
                            { ...a, active: !a.active },
                            "PUT",
                          )
                        }
                      >
                        {a.active ? "Sospendi" : "Riattiva"}
                      </button>
                      <button
                        className="button-secondary"
                        disabled={busy || !payable.length}
                        onClick={() =>
                          mutate("commissions/pay", { code: a.code })
                        }
                      >
                        Registra liquidazione
                      </button>
                    </div>
                    <details className="mt-5">
                      <summary>Report prenotazioni</summary>
                      {table(rows)}
                    </details>
                  </article>
                );
              })}
            </div>
          </>
        )}
        {section === "canali" && (
          <>
            <OtaImport busy={busy} save={(b) => mutate("ota", b)} />
            <div className="mt-7 grid gap-5">
              {data.ota
                .slice()
                .reverse()
                .map((m) => (
                  <article className="card p-6" key={m.id}>
                    <div className="flex flex-wrap justify-between">
                      <h2 className="font-bold">
                        {m.provider} · {m.reference}
                      </h2>
                      <Chip value={m.status} />
                    </div>
                    <p className="mt-3 text-sm">{m.error}</p>
                    <details className="my-4">
                      <summary>Email originale</summary>
                      <pre className="mt-3 whitespace-pre-wrap break-words text-xs">
                        {m.raw}
                      </pre>
                    </details>
                    {m.status === "review" && !m.pnr && (
                      <ManualBooking
                        tours={data.tours}
                        busy={busy}
                        save={(booking) =>
                          mutate("ota/approve", { id: m.id, booking })
                        }
                      />
                    )}
                    {m.status === "review" && (
                      <button
                        className="button-secondary"
                        disabled={busy}
                        onClick={() => mutate("ota/close", { id: m.id })}
                      >
                        Chiudi revisione
                      </button>
                    )}
                    {m.pnr && (
                      <Link
                        className="underline"
                        href={`/admin/prenotazioni/${m.pnr}`}
                      >
                        {m.pnr}
                      </Link>
                    )}
                  </article>
                ))}
            </div>
          </>
        )}
        {section === "pre-tour" && (
          <>
            <div className="card mb-6 grid gap-4 p-6"><h2 className="display-md">Modelli di promemoria per tour</h2><p>Personalizza testo e anticipo di invio nella scheda del tour.</p>{data.tours.map((t) => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div><strong>{t.title}</strong><p className="text-sm">{t.meetingPoint} · {t.reminderHours ?? data.settings.reminderHours} ore prima</p></div><Link className="underline" href={`/admin/tour/${t.slug}#promemoria`}>Modifica promemoria</Link></div>)}</div>
            <div className="card mb-6 p-6">
              <h2 className="display-md mb-3">Comunicazioni automatiche</h2>
              <p>
                Conferme e modifiche via email. Gli invii non riusciti vengono
                ritentati automaticamente.
              </p>
              <button
                className="button-secondary mt-4"
                disabled={busy}
                onClick={() => mutate("jobs/run", {})}
              >
                Elabora coda ora
              </button>
            </div>
            <div className="grid gap-4">
              {data.jobs
                .slice()
                .reverse()
                .map((j) => (
                  <article className="card p-5" key={j.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <strong>
                        {j.type} · {j.bookingPnr || j.subject}
                      </strong>
                      <Chip value={j.status} />
                    </div>
                    <p className="my-2 text-sm">
                      {j.to} · {time(j.runAt)} · {j.attempts} tentativi
                    </p>
                    {j.error && (
                      <p className="text-sm text-red-700">{j.error}</p>
                    )}
                    <details className="mt-3">
                      <summary>Anteprima</summary>
                      <p className="mt-3 whitespace-pre-wrap text-sm">
                        {j.text || `Rimborso ${formatMoney(j.amount || 0)}`}
                      </p>
                    </details>
                    {j.status === "failed" && (
                      <button
                        className="button-secondary mt-3"
                        onClick={() => mutate("jobs/retry", { id: j.id })}
                      >
                        Riprova
                      </button>
                    )}
                  </article>
                ))}
            </div>
          </>
        )}
        {section === "contenuti" && (
          <ContentWorkspace
            content={data.siteContent}
            pages={data.pages}
            detail={detail}
            busy={busy}
            saveSite={content => mutate("site-content", content, "PUT")}
            savePage={body => mutate("page", body, "PUT")}
          />
        )}
        {section === "richieste" && (
          <div className="grid gap-4">
            {!data.inquiries.length && <p>Nessuna richiesta ricevuta.</p>}
            {data.inquiries
              .slice()
              .reverse()
              .map((i) => (
                <article className="card p-6" key={i.id}>
                  <h2 className="display-md">
                    {i.type} · {i.name}
                  </h2>
                  <p className="my-2">
                    {i.email} · {time(i.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap">{i.message}</p>
                  <button
                    className="button-secondary mt-4"
                    onClick={() =>
                      mutate(
                        "inquiry",
                        {
                          id: i.id,
                          status: i.status === "new" ? "handled" : "new",
                        },
                        "PATCH",
                      )
                    }
                  >
                    {i.status === "new"
                      ? "Segna come gestita"
                      : "Riapri richiesta"}
                  </button>
                </article>
              ))}
          </div>
        )}
        {section === "report" && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {["site", "civitatis", "getyourguide", "manual"].map((source) => {
                const rows = active.filter((b) => b.source.startsWith(source));
                return (
                  <div className="card p-6" key={source}>
                    <h2 className="display-md">{source}</h2>
                    <p className="my-3">
                      {rows.length} prenotazioni ·{" "}
                      {formatMoney(rows.reduce((s, b) => s + b.totalCents, 0))}
                    </p>
                    <p className="text-sm">
                      Partecipanti:{" "}
                      {rows.reduce((s, b) => s + b.totalGuests, 0)}
                    </p>
                  </div>
                );
              })}
              <div className="card p-6">
                <h2 className="display-md">Qualità operativa</h2>
                <p className="mt-4">
                  Cancellazioni:{" "}
                  {data.bookings.filter((b) => b.status === "cancelled").length}
                </p>
                <p>
                  Assenti:{" "}
                  {data.bookings.filter((b) => b.status === "no_show").length}
                </p>
                <p>
                  Commissioni non liquidate:{" "}
                  {formatMoney(
                    active
                      .filter((b) => !b.commissionPaid)
                      .reduce((s, b) => s + b.commissionCents, 0),
                  )}
                </p>
              </div>
              <div className="card p-6">
                <h2 className="display-md">Google Ads</h2>
                <p className="mt-4">
                  {data.settings.googleAdsId
                    ? `Account tag: ${data.settings.googleAdsId}`
                    : "Tag non ancora configurato."}
                </p>
                <p className="my-3 text-sm">
                  Il tracciamento acquisti si attiva con il consenso marketing e
                  solo sulle prenotazioni confermate.
                </p>
                <Link href="/admin/impostazioni" className="underline">
                  Configura conversioni
                </Link>
              </div>
            </div>
            <a
              className="button-secondary mt-6"
              href="/api/platform/admin/export"
              download
            >
              Scarica dati prenotazioni
            </a>
          </>
        )}
        {section === "audit" && (
          <div className="card p-6">
            <h2 className="display-md mb-5">Storico delle operazioni</h2>
            {data.audit.map((a) => (
              <p className="border-b py-3 text-sm" key={a.id}>
                {time(a.at)} · {a.actor} · {a.action} · {a.target}
              </p>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
function ManualBooking({
  tours,
  busy,
  save,
}: {
  tours: CatalogTour[];
  busy: boolean;
  save: (v: unknown) => Promise<unknown>;
}) {
  const [tour, setTour] = useState(tours[0]?.slug || "");
  const [now] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  const selected = tours.find((t) => t.slug === tour);
  return (
    <form
      className="card grid gap-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await save({
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          items: [
            {
              tourSlug: tour,
              slotId: f.get("slotId"),
              adults: Number(f.get("adults")),
              children: Number(f.get("children")),
              infants: Number(f.get("infants")),
            },
          ],
          paymentMethod: "cash",
          notes: f.get("notes"),
          affiliateCode: "",
          termsAccepted: true,
          whatsappConsent: f.get("whatsapp") === "on",
        });
        if (r) setMessage("Prenotazione registrata.");
      }}
    >
      <h2 className="display-md">Inserimento prenotazione</h2>
      <div className="form-grid">
        <label>
          Tour
          <select
            className="text-input"
            value={tour}
            onChange={(e) => setTour(e.target.value)}
          >
            {tours.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Partenza
          <select name="slotId" required className="text-input">
            {selected?.slots
              .filter((s) => new Date(s.startsAt).getTime() > now)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {time(s.startsAt)} · {s.capacity - s.reserved} posti
                </option>
              ))}
          </select>
        </label>
        {[
          ["Nome cliente", "name", "text"],
          ["Email", "email", "email"],
          ["Telefono internazionale", "phone", "tel"],
          ["Adulti", "adults", "number"],
          ["Bambini", "children", "number"],
          ["Infanti", "infants", "number"],
        ].map(([label, name, type]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              type={type}
              required
              className="text-input"
              min={name === "adults" ? 1 : 0}
              defaultValue={
                type === "number" ? (name === "adults" ? 1 : 0) : undefined
              }
            />
          </label>
        ))}
      </div>
      <label>
        Note
        <textarea name="notes" className="text-input" />
      </label>
      <label className="flex gap-3 text-sm">
        <input name="whatsapp" type="checkbox" />
        Consenso WhatsApp raccolto dal cliente
      </label>
      <label className="flex gap-3 text-sm">
        <input required type="checkbox" />
        Confermo che il cliente ha accettato le condizioni di prenotazione.
      </label>
      <button disabled={busy} className="button-primary">
        Registra e invia conferma
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
function BookingDetail({
  booking: b,
  tour,
  busy,
  save,
}: {
  booking: Reservation;
  tour: CatalogTour;
  busy: boolean;
  save: (b: unknown) => Promise<unknown>;
}) {
  const [notes, setNotes] = useState(b.notes);
  const [name, setName] = useState(b.name),
    [email, setEmail] = useState(b.email),
    [phone, setPhone] = useState(b.phone);
  const [adults, setAdults] = useState(b.adults),
    [children, setChildren] = useState(b.children),
    [infants, setInfants] = useState(b.infants);
  const [status, setStatus] = useState(b.status);
  const [payment, setPayment] = useState(b.paymentStatus);
  const [notify, setNotify] = useState(false);
  const [slotId, setSlot] = useState(b.slotId);
  const [reason, setReason] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  return (
    <div className="grid gap-5">
      <Link href="/admin/prenotazioni" className="underline">
        ← Prenotazioni
      </Link>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">
          {b.pnr} · {b.name}
        </h2>
        <p>
          {b.email} · {b.phone}
        </p>
        <p>
          {tour.title} · {b.adults} adulti, {b.children} bambini, {b.infants}{" "}
          infanti
        </p>
        <p>
          {formatMoney(b.totalCents)} · sconto {formatMoney(b.discountCents)} ·{" "}
          {b.source}
        </p>
        <div className="flex gap-3">
          <Chip value={b.status} />
          <Chip value={b.paymentStatus} />
        </div>
        <div className="form-grid">
          <Field label="Nome cliente" value={name} onChange={setName} />
          <Field
            label="Email cliente"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="Telefono internazionale"
            value={phone}
            onChange={setPhone}
          />
        </div>
        {b.paymentMethod === "cash" && b.paymentStatus !== "paid" && (
          <div className="form-grid">
            <Field
              label="Adulti"
              type="number"
              min={1}
              max={100}
              value={adults}
              onChange={(v) => setAdults(Number(v))}
            />
            <Field
              label="Bambini"
              type="number"
              min={0}
              max={100}
              value={children}
              onChange={(v) => setChildren(Number(v))}
            />
            <Field
              label="Infanti"
              type="number"
              min={0}
              max={100}
              value={infants}
              onChange={(v) => setInfants(Number(v))}
            />
          </div>
        )}
        <Text label="Note operative" value={notes} onChange={setNotes} />
        <div className="form-grid">
          <label>
            Partecipazione
            <select
              className="text-input"
              value={status}
              disabled={b.status === "pending"}
              onChange={(e) =>
                setStatus(e.target.value as Reservation["status"])
              }
            >
              {[
                ...(b.status === "pending" ? ["pending"] : []),
                "confirmed",
                "present",
                "no_show",
              ].map((x) => (
                <option key={x} value={x}>
                  {labels[x]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stato pagamento
            <select
              className="text-input"
              disabled={b.paymentMethod === "stripe"}
              value={payment}
              onChange={(e) =>
                setPayment(e.target.value as Reservation["paymentStatus"])
              }
            >
              {["not_required", "paid", "pending"].map((x) => (
                <option key={x} value={x}>
                  {labels[x]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
          />
          Invia notifica al cliente
        </label>
        <button
          className="button-primary"
          disabled={busy || b.status === "cancelled"}
          onClick={() =>
            save({
              pnr: b.pnr,
              action: "update",
              notes,
              name,
              email,
              phone,
              adults,
              children,
              infants,
              ...(b.status !== "pending" ? { status } : {}),
              ...(b.paymentMethod !== "stripe"
                ? { paymentStatus: payment }
                : {}),
              notify,
            })
          }
        >
          Salva aggiornamenti
        </button>
      </div>
      {b.status === "cancelled" && b.refundStatus === "manual" && (
        <div className="card grid gap-4 p-6">
          <h2 className="display-md">Rimborso da completare</h2>
          <p>
            Importo: {formatMoney(b.refundCents || 0)}. Esegui il rimborso in
            contanti o sul portale OTA, poi registralo.
          </p>
          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={confirmRefund}
              onChange={(e) => setConfirmRefund(e.target.checked)}
            />
            Confermo che il rimborso è stato effettivamente eseguito.
          </label>
          <button
            className="button-secondary"
            disabled={busy || !confirmRefund}
            onClick={() =>
              save({ pnr: b.pnr, action: "refund-record", confirmRefund: true })
            }
          >
            Registra rimborso effettuato
          </button>
        </div>
      )}
      <div className="card grid gap-4 p-6">
        <h2 className="display-md">Sposta su un’altra partenza</h2>
        <select
          className="text-input"
          value={slotId}
          onChange={(e) => setSlot(e.target.value)}
        >
          {tour.slots.map((s) => (
            <option value={s.id} key={s.id}>
              {time(s.startsAt)} · {s.capacity - s.reserved} posti
            </option>
          ))}
        </select>
        <button
          className="button-secondary"
          disabled={busy || b.status !== "confirmed"}
          onClick={() => save({ pnr: b.pnr, action: "move", slotId })}
        >
          Sposta e notifica
        </button>
      </div>
      <details className="card p-6">
        <summary>Cancellazione prenotazione</summary>
        <div className="mt-4 grid gap-4">
          <Text label="Motivo" value={reason} onChange={setReason} />
          <p className="text-sm">
            Si applica la policy di rimborso configurata; i posti vengono
            liberati.
          </p>
          <button
            disabled={busy || reason.length < 2 || b.status === "cancelled"}
            className="button-secondary"
            onClick={() => save({ pnr: b.pnr, action: "cancel", reason })}
          >
            Cancella e notifica
          </button>
        </div>
      </details>
    </div>
  );
}
function TourEditor({
  tour,
  categories,
  defaults,
  closedDates = [],
  busy,
  save,
}: {
  tour: CatalogTour;
  defaults: Settings;
  categories: string[];
  closedDates?: string[];
  busy: boolean;
  save: (t: CatalogTour) => Promise<unknown>;
}) {
  const [t, setT] = useState(() => ({ ...tour, cancellationHours: tour.cancellationHours ?? defaults.cancellationHours, lateRefundPercent: tour.lateRefundPercent ?? defaults.lateRefundPercent, reminderHours: tour.reminderHours ?? defaults.reminderHours, galleryImages: tourGalleryImages(tour) }));
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const set = (key: keyof CatalogTour, value: unknown) =>
    setT((p) => ({ ...p, [key]: value }));
  const fields: [keyof CatalogTour, string, string?][] = [
    ["title", "Titolo"],
    ["slug", "Indirizzo pagina (slug)"],
    ["category", "Categoria"],
    ["language", "Lingua"],
    ["durationMinutes", "Durata in minuti", "number"],
    ["maxGuests", "Massimo partecipanti per prenotazione (fino a 25)", "number"],
    ["imageUrl", "URL foto copertina"],
    ["meetingPoint", "Punto d’incontro"],
    ["meetingAddress", "Indirizzo"],
    ["mapUrl", "Link Google Maps"],
    ["basePriceCents", "Prezzo adulti (€)", "number"],
    ["childPriceCents", "Prezzo bambini (€)", "number"],
    ["infantPriceCents", "Prezzo infanti (€)", "number"],
    ["adultMinAge", "Età minima adulti", "number"],
    ["childMinAge", "Età minima bambini", "number"],
    ["bookingCutoffHours", "Chiusura prenotazioni (ore prima)", "number"],
    ["seoTitle", "Titolo SEO"],
    ["seoDescription", "Descrizione SEO"],
  ];
  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy || galleryUploading || coverUploading) return;
        save({
          ...t,
          slots: t.slots.map((s) => ({
            ...s,
            startsAt: new Date(s.startsAt).toISOString(),
            endsAt: new Date(s.endsAt).toISOString(),
          })),
        });
      }}
    >
      <Link href="/admin/tour" className="underline">
        ← Tour e orari
      </Link>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Informazioni e tariffe</h2>
        <label>
          Carica foto copertina (JPEG, PNG o WebP; massimo 5 MB)
          <input
            disabled={busy || galleryUploading || coverUploading}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCoverUploading(true);
              setUploadMessage("Caricamento…");
              try {
                const r = await fetch("/api/platform/admin/media", {
                  method: "POST",
                  headers: { "Content-Type": file.type },
                  body: file,
                });
                const d = await r.json();
                if (!r.ok) throw Error(d.error);
                set("imageUrl", d.url);
                setUploadMessage(
                  "Foto caricata. Salva il tour per pubblicarla.",
                );
              } catch (e) {
                setUploadMessage(
                  e instanceof Error ? e.message : "Errore caricamento",
                );
              } finally {
                setCoverUploading(false);
              }
            }}
          />
        </label>
        {uploadMessage && <p role="status">{uploadMessage}</p>}
        <div className="form-grid">
          {fields.map(([key, label, type]) =>
            key === "category" ? (
              <label key={key} className="grid gap-1 text-sm">
                {label}
                <input
                  className="text-input"
                  list="tour-category-options"
                  value={String(t.category ?? "")}
                  onChange={(e) => set("category", e.target.value)}
                />
                <datalist id="tour-category-options">
                  {categories.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                <span className="text-xs text-body">
                  Comparirà come tab in homepage se almeno un tour pubblicato
                  usa questa categoria.
                </span>
              </label>
            ) : (
              <Field
                key={key}
                label={label}
                type={type}
                value={String(key.endsWith("PriceCents") ? Number(t[key] ?? 0) / 100 : t[key] ?? "")}
                min={type === "number" ? (key === "maxGuests" ? 1 : 0) : undefined}
                max={key === "maxGuests" ? 25 : undefined}
                step={key.endsWith("PriceCents") ? "0.01" : undefined}
                onChange={(v) => set(key, key.endsWith("PriceCents") ? Math.round(Number(v) * 100) : type === "number" ? Number(v) : v)}
              />
            ),
          )}
        </div>
        <Text label="Descrizione breve" value={t.shortDescription} onChange={(v) => set("shortDescription", v)} />
        <Text
          label="Descrizione completa"
          value={t.description}
          onChange={(v) => set("description", v)}
        />
        {(
          [
            ["highlights", "Punti salienti (uno per riga)"],
            ["inclusions", "Servizi inclusi (uno per riga)"],
            ["safetyNotes", "Informazioni pratiche (una per riga)"],
          ] as const
        ).map(([key, label]) => (
          <Text
            key={key}
            label={label}
            value={t[key].join("\n")}
            onChange={(v) => set(key, v.split("\n"))}
          />
        ))}
        <Text
          label="Foto punti salienti (gruppi separati da riga vuota, max 4 URL per gruppo)"
          value={(t.highlightGalleries || [])
            .map((group) => group.join("\n"))
            .join("\n\n")}
          onChange={(v) =>
            set(
              "highlightGalleries",
              v
                .split(/\n\s*\n/)
                .map((group) =>
                  group
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .slice(0, 4),
                )
                .filter((group) => group.length > 0),
            )
          }
        />
        <Text
          label="Titoli o ID attività OTA (uno per riga)"
          value={(t.otaAliases || []).join("\n")}
          onChange={(v) => set("otaAliases", v.split("\n").filter(Boolean))}
        />
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={t.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          Pubblica sul sito
        </label>
        {t.importedFromWordpress && <label className="flex gap-3">
          <input type="checkbox" checked={!t.operationalReviewRequired} onChange={(e) => set("operationalReviewRequired", !e.target.checked)} />
          Prezzi, fasce di età, capienza e partenze verificati
        </label>}
      </div>
      <TourOperationsEditor tour={t} change={set} closedDates={closedDates} />
      <TourGalleryEditor photos={t.galleryImages} disabled={busy || coverUploading} onChange={(photos) => set("galleryImages", photos)} onUploading={setGalleryUploading} />
      <button className="button-primary" disabled={busy || galleryUploading || coverUploading}>
        Salva tour e programmazione
      </button>
    </form>
  );
}
function SettingsEditor({
  settings,
  busy,
  save,
}: {
  settings: Settings;
  busy: boolean;
  save: (s: Settings) => Promise<unknown>;
}) {
  const [s, setS] = useState(settings);
  const field = (key: keyof Settings, label: string, type = "number") => (
    <Field
      key={key}
      label={label}
      type={type}
      value={s[key]}
      onChange={(v) =>
        setS((p) => ({ ...p, [key]: type === "number" ? Number(v) : v }))
      }
    />
  );
  return (
    <form
      className="card grid gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(s);
      }}
    >
      <h2 className="display-md">Regole commerciali e automazioni</h2>
      <div className="form-grid">
        {field("multiTourPercent", "Sconto multi-tour (%)")}
        {field("minimumTours", "Numero minimo di tour diversi")}
        {field(
          "cancellationHours",
          "Cancellazione gratuita fino a (ore prima)",
        )}
        {field("lateRefundPercent", "Rimborso dopo il termine (%)")}
        {field("retentionDays", "Conservazione dati (giorni)")}
        {/* Fase 2 (nascosti, valori conservati): reminderHours, googleAdsId, googleAdsLabel */}
      </div>
      <Text
        label="Firma email"
        value={s.emailFooter}
        onChange={(v) => setS((p) => ({ ...p, emailFooter: v }))}
      />
      <p className="text-sm">
        Le tariffe e le fasce d’età si gestiscono per ciascun tour. I nuovi
        valori valgono per le nuove prenotazioni. Le prenotazioni esistenti
        conservano il prezzo concordato.
      </p>
      <button className="button-primary" disabled={busy}>
        Salva regole
      </button>
    </form>
  );
}
function AffiliateEditor({
  busy,
  save,
}: {
  busy: boolean;
  save: (a: Affiliate) => Promise<unknown>;
}) {
  const [a, setA] = useState<Affiliate>({
    code: "",
    name: "",
    email: "",
    type: "hotel",
    commissionPercent: 0,
    active: true,
  });
  return (
    <form
      className="card grid gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void save({ ...a, code: a.code || `PARTNER-${crypto.randomUUID().slice(0, 8).toUpperCase()}` });
      }}
    >
      <h2 className="display-md">Crea o aggiorna un affiliato</h2>
      <div className="form-grid">
        <Field
          label="Codice univoco (opzionale, generato automaticamente)"
          value={a.code}
          onChange={(v) => setA({ ...a, code: v.toUpperCase() })}
        />
        <Field
          label="Nome"
          value={a.name}
          onChange={(v) => setA({ ...a, name: v })}
          required
        />
        <Field
          label="Email"
          type="email"
          value={a.email}
          onChange={(v) => setA({ ...a, email: v })}
          required
        />
        <Field
          label="Commissione (%)"
          type="number"
          min={0}
          max={100}
          value={a.commissionPercent}
          onChange={(v) => setA({ ...a, commissionPercent: Number(v) })}
        />
        <Field
          label="ID WordPress Affiliates (opzionale)"
          type="number"
          min={1}
          value={a.wpId ?? ""}
          onChange={(v) =>
            setA({
              ...a,
              wpId: v ? Number(v) : undefined,
            })
          }
        />
        <label>
          Tipologia
          <select
            className="text-input"
            value={a.type}
            onChange={(e) =>
              setA({ ...a, type: e.target.value as Affiliate["type"] })
            }
          >
            {["hotel", "guide", "promoter", "agency"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm">
        Link partner WP: <code>/?affiliates=ID</code>. Commissione 0 = solo
        attribuzione (come free tour su WP). Matura dopo presenza; le cancellate
        sono escluse.
      </p>
      <button disabled={busy} className="button-primary">
        Salva affiliato
      </button>
    </form>
  );
}
function OtaImport({
  busy,
  save,
}: {
  busy: boolean;
  save: (b: unknown) => Promise<unknown>;
}) {
  return (
    <form
      className="card grid gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        save(Object.fromEntries(f));
      }}
    >
      <h2 className="display-md">Importa email OTA</h2>
      <p className="text-sm">
        Le email della casella collegata arrivano automaticamente. Puoi anche
        incollare un messaggio: i formati non riconosciuti restano da verificare
        e non occupano posti.
      </p>
      <label>
        Provider
        <select name="provider" className="text-input">
          <option value="civitatis">Civitatis</option>
          <option value="getyourguide">GetYourGuide</option>
        </select>
      </label>
      <label>
        Riferimento prenotazione provider
        <input className="text-input" name="reference" required minLength={2} />
      </label>
      <label>
        Corpo email
        <textarea
          className="text-input min-h-40"
          name="raw"
          required
          minLength={10}
        />
      </label>
      <button className="button-primary" disabled={busy}>
        Analizza e importa
      </button>
    </form>
  );
}
