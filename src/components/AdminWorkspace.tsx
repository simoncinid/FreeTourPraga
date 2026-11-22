"use client";
import { jsonEqual } from "@/lib/json-equal";
import { tourHeadlinePrice, categoriesFor } from "@/lib/participant-pricing";
import { OperationalCalendar } from "./OperationalCalendar";
import { PartnersManager } from "./PartnersManager";
import { SectionBlocksEditor } from "./SectionBlocksEditor";
import { TourCommercialEditor } from "./TourCommercialEditor";
import { commissionMatured } from "@/lib/platform/commissions";
import { TourOperationsEditor } from "./TourOperationsEditor";
import Link from "next/link";
import { TourGalleryEditor } from "./TourGalleryEditor";
import { ImageSourceField, uploadAdminImage } from "./ImageSourceField";
import { tourGalleryImages } from "@/lib/tour-gallery";
import { ContentWorkspace } from "./ContentWorkspace";
import type { SiteContent } from "@/lib/platform/content";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Map as MapIcon,
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
  ["tour", "Tour e orari", MapIcon],
  ["calendario", "Calendario", CalendarDays],
  ["partner-europa", "Partner Europa", Users],
  ["affiliati", "Affiliati", Users],
  ["pre-tour", "Email", Mail],
  ["last-minute", "Last minute", Settings2],
  ["contenuti", "Contenuti", FileText],
  ["richieste", "Richieste", Users],
  ["impostazioni", "Regole e tariffe", Settings2],
] as const;

/** Fuori perimetro Fase 1: OTA, Ads, audit. */
const PHASE2_OR_EXTRA_SECTIONS = new Set<string>(["canali", "report", "audit"]);

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
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        readOnly={disabled}
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
const adminTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Prague",
  dateStyle: "short",
  timeStyle: "short",
});
function time(value: string) {
  return adminTimeFormatter.format(new Date(value));
}
export function AdminWorkspace() {
  const router = useRouter();
  const path = usePathname().split("/").filter(Boolean);
  const raw = path[1] || "";
  const section = ["prezzi", "sconti"].includes(raw)
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
  const slotsByTour = useMemo(
    () =>
      new Map(
        (data?.tours ?? []).map((tour) => [
          tour.slug,
          new Map(tour.slots.map((slot) => [slot.id, slot])),
        ]),
      ),
    [data],
  );
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch("/api/platform/admin/state", {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
      if (r.status === 401) {
        router.replace("/accesso");
        return;
      }
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
    },
    [router],
  );
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((e) => {
      if (!controller.signal.aborted) setMessage(e.message);
    });
    return () => controller.abort();
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
    [
      "tour",
      "affiliati",
      "partner-europa",
      "contenuti",
      "impostazioni",
      "sito",
    ].includes(section)
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
  const slot = (b: Reservation) => slotsByTour.get(b.tourSlug)?.get(b.slotId);
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
  const moneyTotals = (rows: Reservation[]) =>
    [...new Set(rows.map((b) => b.currency ?? "EUR"))]
      .map((currency) =>
        formatMoney(
          rows
            .filter((b) => (b.currency ?? "EUR") === currency)
            .reduce((n, b) => n + b.totalCents, 0),
          currency,
        ),
      )
      .join(" + ") || formatMoney(0);
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
              <strong>{formatMoney(b.totalCents, b.currency)}</strong>
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
                <td>{formatMoney(b.totalCents, b.currency)}</td>
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
                  !["tour", "contenuti", "impostazioni", "sito"].includes(slug),
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
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
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
                    ["Vendite", moneyTotals(active)],
                    [
                      "Incassato",
                      moneyTotals(
                        active.filter((b) => b.paymentStatus === "paid"),
                      ),
                    ],
                    [
                      "Da incassare",
                      moneyTotals(
                        active.filter((b) => b.paymentStatus !== "paid"),
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div className="card p-6" key={label}>
                      <p className="text-sm">{label}</p>
                      <strong className="admin-metric mt-3 block text-ink">
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="card mb-7 grid gap-4 p-6">
                  <h2 className="display-md">Richieste dal sito</h2>
                  <p>
                    {data.inquiries.filter((i) => i.status === "new").length}{" "}
                    richieste da gestire · {data.inquiries.length} totali
                  </p>
                  {data.inquiries
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((i) => (
                      <div key={i.id} className="border-t pt-3">
                        <strong>{i.name}</strong>
                        <p className="whitespace-pre-wrap text-sm">
                          {i.message}
                        </p>
                        <small>
                          {time(i.createdAt)} ·{" "}
                          {i.status === "new" ? "Da gestire" : "Gestita"}
                        </small>
                      </div>
                    ))}
                  <Link href="/admin/richieste" className="underline">
                    Apri richieste e messaggi
                  </Link>
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
                      calendarRules: [],
                      commissionRules: [],
                      commissionPackageWith: [],
                      closures: [],
                      published: false,
                      slots: [],
                    }
                  }
                  calendar={(reconcile) =>
                    data.tours.some((t) => t.slug === detail) ? (
                      <OperationalCalendar
                        tours={data.tours}
                        fixedTourId={
                          data.tours.find((t) => t.slug === detail)?.id
                        }
                        busy={busy}
                        save={async (body) => {
                          const result = await mutate(
                            "calendar/operation",
                            body,
                          );
                          if (!result) throw Error("Modifica non salvata");
                          const updated = result.tours?.find(
                            (t: CatalogTour) => t.slug === detail,
                          );
                          if (updated) reconcile(updated);
                          return result;
                        }}
                      />
                    ) : (
                      <p className="card p-6">
                        Salva il nuovo tour per attivare il suo calendario.
                      </p>
                    )
                  }
                  availableTours={data.tours}
                  defaults={data.settings}
                  categories={[
                    ...new Set(
                      data.tours.map((t) => t.category.trim()).filter(Boolean),
                    ),
                  ].sort((a, b) => a.localeCompare(b, "it"))}
                  closedDates={data.closedDates ?? []}
                  busy={busy}
                  save={async (t) => {
                    const result = await mutate("tour", t, "PUT");
                    if (
                      result &&
                      !data.tours.some((existing) => existing.id === t.id)
                    )
                      router.push(`/admin/tour/${t.slug}`);
                    return result;
                  }}
                />
              ) : (
                <>
                  <Link
                    className="button-primary mb-6"
                    href="/admin/tour/nuovo"
                  >
                    Crea un tour
                  </Link>
                  <div className="grid gap-5">
                    {data.tours.map((t) => (
                      <article
                        className="card flex flex-wrap items-start justify-between gap-4 p-6"
                        key={t.id}
                      >
                        <div>
                          <h2 className="display-md">{t.title}</h2>
                          <p>
                            {t.slots.length} partenze · da{" "}
                            {tourHeadlinePrice(t).text} ·{" "}
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
            {section === "calendario" && (
              <OperationalCalendar
                tours={data.tours}
                busy={busy}
                save={async (body) => {
                  const result = await mutate("calendar/operation", body);
                  if (!result)
                    throw Error(
                      "Modifica non salvata: controlla il messaggio del gestionale",
                    );
                  return result;
                }}
              />
            )}
            {section === "partner-europa" && (
              <PartnersManager data={data} busy={busy} mutate={mutate} />
            )}

            {section === "impostazioni" && (
              <SettingsEditor
                key={JSON.stringify(data.settings)}
                settings={data.settings}
                busy={busy}
                save={(s) => mutate("settings", s, "PUT")}
              />
            )}
            {section === "last-minute" && (
              <LastMinuteEditor
                key={`lm-${JSON.stringify(data.settings)}`}
                settings={data.settings}
                busy={busy}
                save={(s) => mutate("settings", s, "PUT")}
              />
            )}
            {section === "affiliati" && (
              <AffiliatesSection
                busy={busy}
                tours={data.tours}
                affiliates={data.affiliates}
                bookings={data.bookings}
                save={(a) => mutate("affiliate", a, "PUT")}
                pay={(code) => mutate("commissions/pay", { code })}
                toggleActive={(a) =>
                  mutate("affiliate", { ...a, active: !a.active }, "PUT")
                }
                renderReport={table}
              />
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
                <EmailTemplatesEditor
                  key={`mail-${JSON.stringify(data.settings.emailTemplates)}-${data.settings.emailFooter}`}
                  settings={data.settings}
                  busy={busy}
                  save={(s) => mutate("settings", s, "PUT")}
                />
                <div className="card mb-6 p-6">
                  <h2 className="display-md mb-3">Coda invii</h2>
                  <p>
                    Conferme, modifiche e cancellazioni via email. Gli invii non
                    riusciti vengono ritentati automaticamente.
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
                tours={data.tours.filter((t) => t.published)}
                pages={data.pages}
                detail={detail}
                busy={busy}
                saveSite={(content) => mutate("site-content", content, "PUT")}
                savePage={(body) => mutate("page", body, "PUT")}
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
                        {i.email} · {i.phone || "Telefono non indicato"} ·{" "}
                        {time(i.createdAt)}
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
                  {["site", "civitatis", "getyourguide", "manual"].map(
                    (source) => {
                      const rows = active.filter((b) =>
                        b.source.startsWith(source),
                      );
                      return (
                        <div className="card p-6" key={source}>
                          <h2 className="display-md">{source}</h2>
                          <p className="my-3">
                            {rows.length} prenotazioni ·{" "}
                            {formatMoney(
                              rows.reduce((s, b) => s + b.totalCents, 0),
                            )}
                          </p>
                          <p className="text-sm">
                            Partecipanti:{" "}
                            {rows.reduce((s, b) => s + b.totalGuests, 0)}
                          </p>
                        </div>
                      );
                    },
                  )}
                  <div className="card p-6">
                    <h2 className="display-md">Qualità operativa</h2>
                    <p className="mt-4">
                      Cancellazioni:{" "}
                      {
                        data.bookings.filter((b) => b.status === "cancelled")
                          .length
                      }
                    </p>
                    <p>
                      Assenti:{" "}
                      {
                        data.bookings.filter((b) => b.status === "no_show")
                          .length
                      }
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
              participants: selected?.priceCategories?.length
                ? categoriesFor(selected).map((c) => ({
                    categoryId: c.id,
                    quantity: Number(f.get(`category:${c.id}`)),
                  }))
                : undefined,
              adults: Number(f.get("adults")),
              children: Number(f.get("children")),
              infants: Number(f.get("infants")),
            },
          ],
          paymentMethod: "cash",
          notes: f.get("notes"),
          affiliateCode: "",
          termsAccepted: true,
          whatsappConsent: false,
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
        ]
          .filter(
            ([, name]) =>
              !selected?.priceCategories?.length ||
              !["adults", "children", "infants"].includes(name),
          )
          .map(([label, name, type]) => (
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
      {selected?.priceCategories?.length && (
        <div className="form-grid">
          {categoriesFor(selected).map((c, i) => (
            <label key={`${selected.id}:${c.id}`}>
              {c.label} · {formatMoney(c.priceCents, selected.currency)}
              <input
                type="number"
                name={`category:${c.id}`}
                min={0}
                max={selected.maxGuests}
                required
                defaultValue={i === 0 ? 1 : 0}
                className="text-input"
              />
            </label>
          ))}
        </div>
      )}
      <label>
        Note
        <textarea name="notes" className="text-input" />
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
          {formatMoney(b.totalCents, b.currency)} · sconto{" "}
          {formatMoney(b.discountCents, b.currency)} · {b.source}
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
        {b.categorySnapshot && (
          <ul>
            {b.categorySnapshot
              .filter((c) => c.quantity)
              .map((c) => (
                <li key={c.id}>
                  {c.quantity} {c.label} ·{" "}
                  {formatMoney(c.unitPriceCents, b.currency)} per persona
                </li>
              ))}
          </ul>
        )}
        {!b.categorySnapshot &&
          ["cash", "bank_transfer"].includes(b.paymentMethod) &&
          b.paymentStatus !== "paid" && (
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
              ...(!b.categorySnapshot ? { adults, children, infants } : {}),
              ...(b.status !== "pending" ? { status } : {}),
              paymentStatus: payment,
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
            Importo: {formatMoney(b.refundCents || 0, b.currency)}. Esegui il
            rimborso in contanti o sul portale OTA, poi registralo.
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
  availableTours,
  categories,
  calendar,
  defaults,
  closedDates = [],
  busy,
  save,
}: {
  tour: CatalogTour;
  calendar: (reconcile: (tour: CatalogTour) => void) => ReactNode;
  availableTours: CatalogTour[];
  defaults: Settings;
  categories: string[];
  closedDates?: string[];
  busy: boolean;
  save: (t: CatalogTour) => Promise<unknown>;
}) {
  const [t, setT] = useState(() => ({
    ...tour,
    cancellationHours: tour.cancellationHours ?? defaults.cancellationHours,
    lateRefundPercent: tour.lateRefundPercent ?? defaults.lateRefundPercent,
    galleryImages: tourGalleryImages(tour),
  }));
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
    [
      "maxGuests",
      "Massimo partecipanti per prenotazione (configurabile)",
      "number",
    ],
    ["meetingPoint", "Punto d’incontro"],
    ["meetingAddress", "Indirizzo"],
    ["mapUrl", "Link Google Maps"],
    ["basePriceCents", "Prezzo adulti (valuta tour)", "number"],
    ["childPriceCents", "Prezzo bambini (valuta tour)", "number"],
    ["infantPriceCents", "Prezzo infanti (valuta tour)", "number"],
    ["adultMinAge", "Età minima adulti", "number"],
    ["childMinAge", "Età minima bambini", "number"],
    ["bookingCutoffHours", "Chiusura prenotazioni (ore prima)", "number"],
    ["seoTitle", "Titolo SEO"],
    ["seoDescription", "Descrizione SEO"],
  ];
  return (
    <>
      <form
        className="grid gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy || galleryUploading || coverUploading) return;
          save({
            ...t,
            calendarRules: tour.calendarRules,
            closures: !jsonEqual(
              t.calendarRules ?? [],
              tour.calendarRules ?? [],
            )
              ? tour.closures
              : t.closures,
            slots: (!jsonEqual(t.calendarRules ?? [], tour.calendarRules ?? [])
              ? tour.slots
              : t.slots
            ).map((s) => ({
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
          <h2 className="display-md">Scheda tour</h2>
          <p>
            Modifica i blocchi nell’ordine della pagina. Salva la scheda prima
            di intervenire sul calendario.
          </p>
          <details open className="grid gap-4">
            <summary className="title-md">
              1. Intestazione, copertina e informazioni
            </summary>
            <div className="grid gap-4 pt-4">
              <ImageSourceField
                label="Foto copertina"
                value={t.imageUrl}
                required
                disabled={busy || galleryUploading || coverUploading}
                onNotice={setUploadMessage}
                onUploading={setCoverUploading}
                onChange={(imageUrl) => set("imageUrl", imageUrl)}
              />
              {uploadMessage && <p role="status">{uploadMessage}</p>}
              <div className="form-grid">
                {fields
                  .filter(
                    ([key]) =>
                      !t.priceCategories?.length ||
                      ![
                        "basePriceCents",
                        "childPriceCents",
                        "infantPriceCents",
                        "adultMinAge",
                        "childMinAge",
                      ].includes(key),
                  )
                  .map(([key, label, type]) =>
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
                          Comparirà come tab in homepage se almeno un tour
                          pubblicato usa questa categoria.
                        </span>
                      </label>
                    ) : (
                      <Field
                        key={key}
                        label={label}
                        type={type}
                        value={String(
                          key.endsWith("PriceCents")
                            ? Number(t[key] ?? 0) / 100
                            : (t[key] ?? ""),
                        )}
                        min={
                          type === "number"
                            ? key === "maxGuests"
                              ? 1
                              : 0
                            : undefined
                        }
                        max={key === "maxGuests" ? 10000 : undefined}
                        step={key.endsWith("PriceCents") ? "0.01" : undefined}
                        onChange={(v) =>
                          set(
                            key,
                            key.endsWith("PriceCents")
                              ? Math.round(Number(v) * 100)
                              : type === "number"
                                ? Number(v)
                                : v,
                          )
                        }
                      />
                    ),
                  )}
              </div>
              <div className="form-grid">
                <label>
                  Giorni operativi (solo per tour senza partenze)
                  <input
                    className="text-input"
                    disabled={
                      t.schedule?.enabled ||
                      !!t.calendarRules?.length ||
                      !!t.slots.length
                    }
                    value={t.operatingDays ?? ""}
                    onChange={(e) => set("operatingDays", e.target.value)}
                  />
                </label>
                <label>
                  Orario mostrato (solo per tour senza partenze)
                  <input
                    className="text-input"
                    disabled={
                      t.schedule?.enabled ||
                      !!t.calendarRules?.length ||
                      !!t.slots.length
                    }
                    value={t.departureTime ?? ""}
                    onChange={(e) => set("departureTime", e.target.value)}
                  />
                </label>
                <label>
                  Anticipo richiesto (minuti)
                  <input
                    className="text-input"
                    type="number"
                    min={0}
                    max={240}
                    value={t.arrivalMinutes ?? 15}
                    onChange={(e) =>
                      set("arrivalMinutes", Number(e.target.value))
                    }
                  />
                </label>
              </div>
            </div>
          </details>
          <details className="grid gap-4">
            <summary className="title-md">
              2. Descrizione, itinerario e informazioni pratiche
            </summary>
            <div className="grid gap-4 pt-4">
              <Text
                label="Descrizione breve"
                value={t.shortDescription}
                onChange={(v) => set("shortDescription", v)}
              />
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
              <div className="grid gap-3">
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
                <label className="grid gap-2 text-sm">
                  Oppure carica foto e aggiungile all’ultimo gruppo (JPEG, PNG o
                  WebP; massimo 5 MB)
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy || galleryUploading || coverUploading}
                    onChange={async (event) => {
                      const files = Array.from(event.currentTarget.files || []);
                      event.currentTarget.value = "";
                      if (!files.length) return;
                      setCoverUploading(true);
                      setUploadMessage("Caricamento foto punti salienti…");
                      try {
                        const urls: string[] = [];
                        for (const file of files) {
                          urls.push(await uploadAdminImage(file));
                        }
                        const groups = [...(t.highlightGalleries || [])];
                        const last = groups[groups.length - 1] || [];
                        if (groups.length === 0 || last.length >= 4) {
                          groups.push(urls.slice(0, 4));
                          if (urls.length > 4) {
                            for (let i = 4; i < urls.length; i += 4) {
                              groups.push(urls.slice(i, i + 4));
                            }
                          }
                        } else {
                          const room = 4 - last.length;
                          groups[groups.length - 1] = [
                            ...last,
                            ...urls.slice(0, room),
                          ];
                          const rest = urls.slice(room);
                          for (let i = 0; i < rest.length; i += 4) {
                            groups.push(rest.slice(i, i + 4));
                          }
                        }
                        set("highlightGalleries", groups);
                        setUploadMessage(
                          "Foto aggiunte ai punti salienti. Salva il tour per pubblicarle.",
                        );
                      } catch (error) {
                        setUploadMessage(
                          error instanceof Error
                            ? error.message
                            : "Errore caricamento",
                        );
                      } finally {
                        setCoverUploading(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </details>
          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={t.published}
              onChange={(e) => set("published", e.target.checked)}
            />
            Pubblica sul sito
          </label>
          {t.importedFromWordpress && (
            <label className="flex gap-3">
              <input
                type="checkbox"
                checked={!t.operationalReviewRequired}
                onChange={(e) =>
                  set("operationalReviewRequired", !e.target.checked)
                }
              />
              Prezzi, fasce di età, capienza e partenze verificati
            </label>
          )}
        </div>
        <TourCommercialEditor
          tour={t}
          availableTours={availableTours}
          change={set}
        />
        <SectionBlocksEditor
          blocks={t.contentBlocks}
          onChange={(blocks) => set("contentBlocks", blocks)}
          onUploading={setCoverUploading}
        />
        <TourOperationsEditor tour={t} change={set} closedDates={closedDates} />
        <TourGalleryEditor
          photos={t.galleryImages}
          disabled={busy || coverUploading}
          onChange={(photos) => set("galleryImages", photos)}
          onUploading={setGalleryUploading}
        />
        <button
          className="button-primary"
          disabled={
            busy ||
            galleryUploading ||
            coverUploading ||
            t.paymentMethods?.length === 0
          }
        >
          Salva tour e programmazione
        </button>
      </form>
      {calendar((updated) =>
        setT((current) => ({
          ...current,
          slots: updated.slots,
          calendarRules: updated.calendarRules,
          closures: updated.closures,
        })),
      )}
    </>
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
  const field = (
    key:
      | "multiTourPercent"
      | "minimumTours"
      | "cancellationHours"
      | "lateRefundPercent"
      | "retentionDays",
    label: string,
  ) => (
    <Field
      key={key}
      label={label}
      type="number"
      value={s[key]}
      onChange={(v) => setS((p) => ({ ...p, [key]: Number(v) }))}
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
      <h2 className="display-md">Regole commerciali</h2>
      <div className="form-grid">
        {field("multiTourPercent", "Sconto multi-tour (%)")}
        {field("minimumTours", "Numero minimo di tour diversi")}
        {field(
          "cancellationHours",
          "Cancellazione gratuita fino a (ore prima)",
        )}
        {field("lateRefundPercent", "Rimborso dopo il termine (%)")}
        {field("retentionDays", "Conservazione dati (giorni)")}
      </div>
      <p className="text-sm">
        Le tariffe e le fasce d’età si gestiscono per ciascun tour. Listino
        last-minute in <Link href="/admin/last-minute">Last minute</Link>. Testi
        email in <Link href="/admin/pre-tour">Email</Link>.
      </p>
      <button className="button-primary" disabled={busy}>
        Salva regole
      </button>
    </form>
  );
}
function LastMinuteEditor({
  settings,
  busy,
  save,
}: {
  settings: Settings;
  busy: boolean;
  save: (s: Settings) => Promise<unknown>;
}) {
  const [s, setS] = useState(settings);
  return (
    <form
      className="card grid gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(s);
      }}
    >
      <h2 className="display-md">Listino last-minute</h2>
      <p className="text-sm">
        Quando è attivo, nelle ultime ore prima della partenza (dopo la chiusura
        standard del tour) il listino applicato in checkout riceve lo sconto
        indicato. Distinto dalla “chiusura prenotazioni” di ogni tour.
      </p>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={s.lastMinuteEnabled}
          onChange={(e) =>
            setS((p) => ({ ...p, lastMinuteEnabled: e.target.checked }))
          }
        />
        Attiva tariffa last-minute
      </label>
      <div className="form-grid">
        <Field
          label="Finestra last-minute (ore prima della partenza)"
          type="number"
          min={1}
          max={168}
          value={s.lastMinuteHours}
          onChange={(v) => setS((p) => ({ ...p, lastMinuteHours: Number(v) }))}
        />
        <Field
          label="Sconto last-minute (%)"
          type="number"
          min={0}
          max={100}
          value={s.lastMinuteDiscountPercent}
          onChange={(v) =>
            setS((p) => ({ ...p, lastMinuteDiscountPercent: Number(v) }))
          }
        />
      </div>
      <button className="button-primary" disabled={busy}>
        Salva last-minute
      </button>
    </form>
  );
}
function EmailTemplatesEditor({
  settings,
  busy,
  save,
}: {
  settings: Settings;
  busy: boolean;
  save: (s: Settings) => Promise<unknown>;
}) {
  const [s, setS] = useState(settings);
  const kinds = [
    ["confirmed", "Conferma"],
    ["modified", "Modifica"],
    ["cancelled", "Cancellazione"],
  ] as const;
  return (
    <form
      className="card mb-6 grid gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(s);
      }}
    >
      <h2 className="display-md">Testi email modificabili</h2>
      <p className="text-sm">
        Placeholder:{" "}
        {
          "{kind} {nome} {pnr} {tour} {data} {persone} {totale} {incontro} {indirizzo} {mappa} {pagamento} {nota} {cancellazione} {manageUrl} {calendarUrl} {assistenza} {firma} {brand}"
        }
        . Per la mail operativa anche{" "}
        {"{email} {telefono} {note} {adulti} {minori} {affiliate}"}.
      </p>
      <Text
        label="Firma email"
        value={s.emailFooter}
        onChange={(v) => setS((p) => ({ ...p, emailFooter: v }))}
      />
      {kinds.map(([key, label]) => (
        <div key={key} className="grid gap-3 border-t pt-4">
          <h3 className="font-bold">{label} cliente</h3>
          <Field
            label="Oggetto"
            value={s.emailTemplates[key].subject}
            onChange={(v) =>
              setS((p) => ({
                ...p,
                emailTemplates: {
                  ...p.emailTemplates,
                  [key]: { ...p.emailTemplates[key], subject: v },
                },
              }))
            }
          />
          <Text
            label="Testo"
            value={s.emailTemplates[key].text}
            onChange={(v) =>
              setS((p) => ({
                ...p,
                emailTemplates: {
                  ...p.emailTemplates,
                  [key]: { ...p.emailTemplates[key], text: v },
                },
              }))
            }
          />
          <Text
            label="HTML"
            value={s.emailTemplates[key].html}
            onChange={(v) =>
              setS((p) => ({
                ...p,
                emailTemplates: {
                  ...p.emailTemplates,
                  [key]: { ...p.emailTemplates[key], html: v },
                },
              }))
            }
          />
        </div>
      ))}
      <div className="grid gap-3 border-t pt-4">
        <h3 className="font-bold">Avviso operativo (staff / portali)</h3>
        <Field
          label="Oggetto"
          value={s.emailTemplates.admin.subject}
          onChange={(v) =>
            setS((p) => ({
              ...p,
              emailTemplates: {
                ...p.emailTemplates,
                admin: { ...p.emailTemplates.admin, subject: v },
              },
            }))
          }
        />
        <Text
          label="Testo (formato parsing)"
          value={s.emailTemplates.admin.text}
          onChange={(v) =>
            setS((p) => ({
              ...p,
              emailTemplates: {
                ...p.emailTemplates,
                admin: { ...p.emailTemplates.admin, text: v },
              },
            }))
          }
        />
      </div>
      <button className="button-primary" disabled={busy}>
        Salva testi email
      </button>
    </form>
  );
}
const emptyAffiliate = (): Affiliate => ({
  code: "",
  name: "",
  email: "",
  type: "hotel",
  commissionPercent: 0,
  active: true,
});

function AffiliatesSection({
  tours,
  busy,
  affiliates,
  bookings,
  save,
  pay,
  toggleActive,
  renderReport,
}: {
  busy: boolean;
  tours: CatalogTour[];
  affiliates: Affiliate[];
  bookings: Reservation[];
  save: (a: Affiliate) => Promise<unknown>;
  pay: (code: string) => Promise<unknown>;
  toggleActive: (a: Affiliate) => Promise<unknown>;
  renderReport: (rows: Reservation[]) => ReactNode;
}) {
  const [editing, setEditing] = useState<Affiliate | null>(null);
  return (
    <>
      <AffiliateEditor
        key={editing?.code || "new"}
        busy={busy}
        initial={editing}
        onCancel={() => setEditing(null)}
        save={async (a) => {
          const result = await save(a);
          if (result) setEditing(null);
          return result;
        }}
      />
      <div className="mt-7 grid gap-5">
        {affiliates.map((a) => {
          const rows = bookings.filter((b) => b.affiliateCode === a.code);
          const payable = rows.filter(
            (b) => commissionMatured({ tours }, b) && !b.commissionPaid,
          );
          return (
            <article className="card p-6" key={a.code}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="display-md">{a.name}</h2>
                  <p>
                    {a.type} · {a.code}
                    {a.wpId != null ? ` · WP #${a.wpId}` : ""} ·{" "}
                    {a.commissionPercent}% · {a.active ? "Attivo" : "Sospeso"}
                  </p>
                  <p>{rows.length} prenotazioni</p>
                  {[...new Set(rows.map((b) => b.currency ?? "EUR"))].map(
                    (currency) => (
                      <div key={currency} className="text-sm">
                        <p>
                          Previste:{" "}
                          {formatMoney(
                            rows
                              .filter(
                                (b) =>
                                  (b.currency ?? "EUR") === currency &&
                                  !b.commissionPaid &&
                                  ["confirmed", "present"].includes(b.status) &&
                                  !commissionMatured({ tours }, b),
                              )
                              .reduce((n, b) => n + b.commissionCents, 0),
                            currency,
                          )}
                        </p>
                        <p>
                          Maturate da liquidare:{" "}
                          {formatMoney(
                            payable
                              .filter((b) => (b.currency ?? "EUR") === currency)
                              .reduce((n, b) => n + b.commissionCents, 0),
                            currency,
                          )}
                        </p>
                        <p>
                          Liquidate:{" "}
                          {formatMoney(
                            rows
                              .filter(
                                (b) =>
                                  (b.currency ?? "EUR") === currency &&
                                  b.commissionPaid &&
                                  b.status !== "cancelled",
                              )
                              .reduce((n, b) => n + b.commissionCents, 0),
                            currency,
                          )}
                        </p>
                      </div>
                    ),
                  )}
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
                  type="button"
                  className="button-secondary"
                  disabled={busy}
                  onClick={() => {
                    setEditing(a);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Modifica
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy}
                  onClick={() => void toggleActive(a)}
                >
                  {a.active ? "Sospendi" : "Riattiva"}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy || !payable.length}
                  onClick={() => void pay(a.code)}
                >
                  Registra liquidazione
                </button>
              </div>
              <details className="mt-5">
                <summary>Report prenotazioni</summary>
                {renderReport(rows)}
              </details>
            </article>
          );
        })}
      </div>
    </>
  );
}

function AffiliateEditor({
  busy,
  save,
  initial,
  onCancel,
}: {
  busy: boolean;
  save: (a: Affiliate) => Promise<unknown>;
  initial?: Affiliate | null;
  onCancel?: () => void;
}) {
  const editing = Boolean(initial?.code);
  const [a, setA] = useState<Affiliate>(initial ?? emptyAffiliate());
  return (
    <form
      id="affiliate-editor"
      className="card grid gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          const result = await save({
            ...a,
            code:
              a.code ||
              `PARTNER-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          });
          if (result && !editing) setA(emptyAffiliate());
        })();
      }}
    >
      <h2 className="display-md">
        {editing ? `Modifica ${initial!.name}` : "Nuovo affiliato"}
      </h2>
      <div className="form-grid">
        <Field
          label={
            editing
              ? "Codice univoco (non modificabile)"
              : "Codice univoco (opzionale, generato automaticamente)"
          }
          value={a.code}
          onChange={(v) => setA({ ...a, code: v.toUpperCase() })}
          disabled={editing}
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
          <input
            className="text-input"
            list="affiliate-types"
            value={a.type}
            maxLength={80}
            required
            onChange={(e) => setA({ ...a, type: e.target.value })}
          />
          <datalist id="affiliate-types">
            {["hotel", "guide", "promoter", "agency"].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <small>
            Puoi inserire una nuova tipologia; usa lo stesso nome nelle regole
            commissione.
          </small>
        </label>
      </div>
      <p className="text-sm">
        Link partner WP: <code>/?affiliates=ID</code>. Commissione 0 = solo
        attribuzione. La % e le altre impostazioni valgono solo per le
        prenotazioni future: quelle già create restano con la commissione di
        allora. Matura dopo presenza; le cancellate sono escluse.
      </p>
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="button-primary">
          {editing ? "Salva modifiche" : "Crea affiliato"}
        </button>
        {editing && (
          <button
            type="button"
            className="button-secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Annulla
          </button>
        )}
      </div>
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
