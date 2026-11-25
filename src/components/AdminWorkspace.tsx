"use client";
import { TourSettingsEditor } from "./TourSettingsEditor";
import { TourVisualEditor } from "./TourVisualEditor";
import { AdminOverview } from "./AdminOverview";
import { InquiriesManager } from "./InquiriesManager";
import { AdminEmailCenter } from "./AdminEmailCenter";
import { AdminNotice } from "./AdminNotice";
import { RichTextEditor } from "./RichTextEditor";
import { TourCardEditor } from "./TourCardEditor";
import { AdminTourList } from "./AdminTourList";
import { SlotDatePicker } from "./SlotDatePicker";
import { Pencil } from "lucide-react";
import { jsonEqual } from "@/lib/json-equal";
import { categoriesFor } from "@/lib/participant-pricing";
import { OperationalCalendar } from "./OperationalCalendar";
import { SupportTickets } from "./SupportTickets";
import { StaffAccounts } from "./StaffAccounts";
import { AffiliatesSection } from "./AffiliatesSection";
import { PartnersManager } from "./PartnersManager";
import { SectionBlocksEditor } from "./SectionBlocksEditor";
import { TourCommercialEditor } from "./TourCommercialEditor";
import { TourOperationsEditor } from "./TourOperationsEditor";
import Link from "next/link";
import { TourGalleryEditor } from "./TourGalleryEditor";
import { tourGalleryImages } from "@/lib/tour-gallery";
import { ContentWorkspace } from "./ContentWorkspace";
import type { SiteContent } from "@/lib/platform/content";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  LifeBuoy,
  RefreshCw,
  LogOut,
  Plus,
  UserCog,
} from "lucide-react";
import type {
  Affiliate,
  CatalogTour,
  PlatformState,
  Reservation,
  Settings,
} from "@/lib/platform/model";
import type { StaffPublic } from "@/lib/platform/staff";
import { pragueLocal } from "@/lib/platform/time";
import { formatMoney } from "@/lib/format";
type Data = Omit<PlatformState, "orders" | "rateLimits" | "events"> & {
  role: string;
  staffUsers?: StaffPublic[];
  siteContent: SiteContent;
  integrations: Record<string, boolean>;
};
const navigation = [
  ["", "Panoramica", LayoutDashboard],
  ["prenotazioni", "Prenotazioni", Ticket],
  ["tour", "Tour e orari", MapIcon],
  ["calendario", "Calendario", CalendarDays],
  ["utenti", "Account staff", UserCog],
  ["supporto", "Supporto", LifeBuoy],
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
  pending: "Nuova",
  awaiting_payment: "In attesa pagamento",
  cancelled: "Cancellata",
  present: "Presente",
  no_show: "Assente",
  paid: "Pagato",
  not_required: "Pagamento non richiesto",
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
  const searchParams = useSearchParams();
  const [data, setData] = useState<Data | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [tourFilter, setTourFilter] = useState(""),
    [dateFilter, setDateFilter] = useState(""),
    [slotFilter, setSlotFilter] = useState(""),
    [affiliateFilter, setAffiliateFilter] = useState(
      () => searchParams.get("affiliate") || "",
    ),
    [bookingsPage, setBookingsPage] = useState(0),
    [affiliateModal, setAffiliateModal] = useState<"new" | Affiliate | null>(
      null,
    ),
    [contentChrome, setContentChrome] = useState<{
      dirty: number;
      canSave: boolean;
      busy: boolean;
      href: string;
      save: () => void;
      discard: () => void;
    } | null>(null),
    [partnerFrom, setPartnerFrom] = useState(
      () => new Date().toISOString().slice(0, 7) + "-01",
    ),
    [partnerTo, setPartnerTo] = useState(() =>
      new Date().toISOString().slice(0, 10),
    );
  useEffect(() => {
    const next = searchParams.get("affiliate") || "";
    setAffiliateFilter(next);
    setBookingsPage(0);
  }, [searchParams]);
  useEffect(() => {
    if (section !== "contenuti") setContentChrome(null);
  }, [section]);
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
      const d = await r.json().catch(() => ({}));
      if (!r.ok)
        throw Error(
          typeof d.error === "string" && d.error
            ? d.error
            : `Salvataggio non riuscito (${r.status})`,
        );
      await load();
      setMessage("Operazione completata.");
      return d;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Connessione non disponibile";
      setMessage(msg);
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
  const slot = (b: Reservation) => slotsByTour.get(b.tourSlug)?.get(b.slotId);
  const filtered = data.bookings.filter(
    (b) =>
      (!tourFilter || b.tourSlug === tourFilter) &&
      (!dateFilter ||
        (slot(b) ? pragueLocal(slot(b)!.startsAt).slice(0, 10) : "") ===
          dateFilter) &&
      (!slotFilter || b.slotId === slotFilter) &&
      (!affiliateFilter || b.affiliateCode === affiliateFilter) &&
      [b.name, b.pnr, b.email, b.phone, b.source, b.affiliateCode]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const BOOKINGS_PAGE_SIZE = 8;
  const bookingsSorted = filtered.slice().reverse();
  const bookingsPageCount = Math.max(
    1,
    Math.ceil(bookingsSorted.length / BOOKINGS_PAGE_SIZE),
  );
  const bookingsPageSafe = Math.min(bookingsPage, bookingsPageCount - 1);
  const bookingsVisible = bookingsSorted.slice(
    bookingsPageSafe * BOOKINGS_PAGE_SIZE,
    bookingsPageSafe * BOOKINGS_PAGE_SIZE + BOOKINGS_PAGE_SIZE,
  );
  const active = data.bookings.filter(
    (booking) => booking.status !== "cancelled",
  );
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
        <table className="data-table bookings-table">
          <colgroup>
            <col className="bookings-col-pnr" />
            <col className="bookings-col-traveler" />
            <col className="bookings-col-experience" />
            <col className="bookings-col-guests" />
            <col className="bookings-col-total" />
            <col className="bookings-col-status" />
            <col className="bookings-col-payment" />
          </colgroup>
          <thead>
            <tr>
              <th>Prenotazione</th>
              <th>Viaggiatore</th>
              <th>Esperienza / partenza</th>
              <th>Partecipanti</th>
              <th>Totale</th>
              <th>Stato</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const tourTitle =
                data.tours.find((t) => t.slug === b.tourSlug)?.title ??
                b.tourSlug;
              return (
                <tr key={b.id}>
                  <td>
                    <Link
                      className="font-bold underline table-cell-line"
                      href={`/admin/prenotazioni/${b.pnr}`}
                      title={b.pnr}
                    >
                      {b.pnr}
                    </Link>
                    <small className="table-cell-line" title={b.source}>
                      {b.source}
                    </small>
                  </td>
                  <td>
                    <span className="table-cell-line" title={b.name}>
                      {b.name}
                    </span>
                    <small className="table-cell-line" title={b.email}>
                      {b.email}
                    </small>
                  </td>
                  <td>
                    <span className="table-cell-line" title={tourTitle}>
                      {tourTitle}
                    </span>
                    <small className="table-cell-line">
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
              );
            })}
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
          {phase1Navigation.map(([slug, label, Icon]) => (
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
            {phase1Navigation.map(([slug, label, Icon]) => (
              <Link key={slug} href={`/admin${slug ? "/" + slug : ""}`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </details>
        <div className="admin-sidebar-footer">
          <Link href="/" className="button-secondary admin-sidebar-site">
            Vai al sito
          </Link>
          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={async () => {
              await fetch("/api/platform/logout", { method: "POST" });
              router.replace("/accesso");
            }}
          >
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </aside>
      <div
        className={`admin-main min-w-0${["", "prenotazioni", "tour", "calendario", "affiliati", "contenuti", "pre-tour", "richieste", "partner-europa"].includes(section) ? " admin-compact" : ""}${section === "calendario" ? " admin-calendar-page" : ""}${section === "affiliati" ? " admin-affiliates-page" : ""}${section === "prenotazioni" && !detail ? " admin-bookings-page" : ""}${section === "contenuti" ? " admin-contents-page" : ""}`}
      >
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="display-lg">
              {navigation.find((n) => n[0] === section)?.[1] || "Gestione"}
            </h1>
          </div>
          <div className="admin-header-actions">
            {section === "partner-europa" && (
              <a
                className="button-export"
                href={`/api/platform/admin/partners/stats?from=${partnerFrom}&to=${partnerTo}&format=csv`}
              >
                Esporta CSV
              </a>
            )}
            {section === "affiliati" && (
              <button
                type="button"
                className="button-primary"
                onClick={() => setAffiliateModal("new")}
              >
                <Plus size={16} />
                Nuovo affiliato
              </button>
            )}
            {section !== "contenuti" && (
              <button
                onClick={() => load().catch((e) => setMessage(e.message))}
                className="button-secondary"
              >
                <RefreshCw size={16} />
                Aggiorna
              </button>
            )}
            {section === "contenuti" && contentChrome && (
              <>
                <button
                  type="button"
                  className="button-primary"
                  disabled={!contentChrome.canSave}
                  onClick={() => contentChrome.save()}
                >
                  {contentChrome.busy
                    ? "Salvataggio…"
                    : `Salva${contentChrome.dirty ? ` (${contentChrome.dirty})` : ""}`}
                </button>
                <a
                  className="button-secondary"
                  href={contentChrome.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apri ↗
                </a>
              </>
            )}
            {section === "tour" && (
              <Link className="button-primary" href="/admin/tour/nuovo">
                <Plus size={16} />
                Crea un tour
              </Link>
            )}
          </div>
        </header>
        {message && <AdminNotice key={message} message={message} />}
        <div className="admin-stage">
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
                <AdminOverview
                  data={data}
                  busy={busy}
                  updateInquiry={(id, status) =>
                    mutate("inquiry", { id, status }, "PATCH")
                  }
                />
              )}
              {section === "prenotazioni" &&
                (detail === "nuova" ? (
                  <ManualBooking
                    tours={data.tours.filter((t) => t.published && !t.archivedAt)}
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
                  <div className="bookings-workspace">
                    <div className="card mb-4 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
                      <Field
                        label="Cerca nome, PNR, email"
                        value={search}
                        onChange={(v) => {
                          setSearch(v);
                          setBookingsPage(0);
                        }}
                      />
                      <label>
                        Tour
                        <select
                          className="text-input"
                          value={tourFilter}
                          onChange={(e) => {
                            setTourFilter(e.target.value);
                            setSlotFilter("");
                            setBookingsPage(0);
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
                        onChange={(v) => {
                          setDateFilter(v);
                          setBookingsPage(0);
                        }}
                        type="date"
                      />
                      <label>
                        Partenza
                        <select
                          className="text-input"
                          value={slotFilter}
                          onChange={(e) => {
                            setSlotFilter(e.target.value);
                            setBookingsPage(0);
                          }}
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
                      <label>
                        Affiliato
                        <select
                          className="text-input"
                          value={affiliateFilter}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAffiliateFilter(value);
                            setBookingsPage(0);
                            const url = value
                              ? `/admin/prenotazioni?affiliate=${encodeURIComponent(value)}`
                              : "/admin/prenotazioni";
                            router.replace(url);
                          }}
                        >
                          <option value="">Tutti gli affiliati</option>
                          {data.affiliates.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.name} ({a.code})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3">
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
                    {table(bookingsVisible)}
                    {bookingsSorted.length > BOOKINGS_PAGE_SIZE && (
                      <div className="admin-pagination">
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={bookingsPageSafe <= 0}
                          onClick={() =>
                            setBookingsPage((p) => Math.max(0, p - 1))
                          }
                        >
                          Precedente
                        </button>
                        <span>
                          {bookingsPageSafe + 1} / {bookingsPageCount} ·{" "}
                          {bookingsSorted.length} prenotazioni
                        </span>
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={bookingsPageSafe >= bookingsPageCount - 1}
                          onClick={() =>
                            setBookingsPage((p) =>
                              Math.min(bookingsPageCount - 1, p + 1),
                            )
                          }
                        >
                          Successiva
                        </button>
                      </div>
                    )}
                  </div>
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
                        archivedAt: undefined,
                        slots: [],
                      }
                    }
                    calendar={(reconcile) =>
                      data.tours.some((t) => t.slug === detail) ? (
                        <OperationalCalendar
                          refresh={load}
                          tours={data.tours.filter((t) => !t.archivedAt)}
                          closedDates={data.closedDates}
                          notices={data.notices}
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
                    availableTours={data.tours.filter((t) => !t.archivedAt)}
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
                  <AdminTourList tours={data.tours} busy={busy} update={(body, method) => mutate("tour", body, method)} />
                ))}
              {section === "calendario" && (
                <OperationalCalendar
                  refresh={load}
                  tours={data.tours.filter((t) => !t.archivedAt)}
                  closedDates={data.closedDates}
                  notices={data.notices}
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
                <PartnersManager
                  data={data}
                  busy={busy}
                  mutate={mutate}
                  from={partnerFrom}
                  to={partnerTo}
                  onFromChange={setPartnerFrom}
                  onToChange={setPartnerTo}
                />
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
                  modal={affiliateModal}
                  onModalChange={setAffiliateModal}
                  save={(a) => mutate("affiliate", a, "PUT")}
                  pay={(code) => mutate("commissions/pay", { code })}
                  toggleActive={(a) =>
                    mutate("affiliate", { ...a, active: !a.active }, "PUT")
                  }
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
                              tours={data.tours.filter((t) => t.published && !t.archivedAt)}
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
                <AdminEmailCenter
                  settings={data.settings}
                  jobs={data.jobs}
                  busy={busy}
                  save={(settings) => mutate("settings", settings, "PUT")}
                  runQueue={() => mutate("jobs/run", {})}
                  retry={(id) => mutate("jobs/retry", { id })}
                />
              )}
              {section === "contenuti" && (
                <ContentWorkspace
                  partners={data.partners}
                  saveVisual={async (body) => {
                    const result = await mutate("visual-content", body);
                    if (!result) {
                      throw new Error(
                        "Salvataggio non riuscito. La bozza è conservata.",
                      );
                    }
                    return result;
                  }}
                  content={data.siteContent}
                  tours={data.tours.filter((t) => t.published)}
                  pages={data.pages}
                  detail={detail}
                  busy={busy}
                  saveSite={(content) => mutate("site-content", content, "PUT")}
                  savePage={(body) => mutate("page", body, "PUT")}
                  onChromeChange={setContentChrome}
                />
              )}
              {section === "utenti" && (
                <StaffAccounts
                  users={data.staffUsers ?? []}
                  busy={busy}
                  save={(body, method) => mutate("staff", body, method)}
                />
              )}
              {section === "supporto" && (
                <SupportTickets
                  tickets={data.tickets ?? []}
                  busy={busy}
                  save={(body, method) => mutate("tickets", body, method)}
                />
              )}
              {section === "richieste" && (
                <InquiriesManager
                  inquiries={data.inquiries}
                  busy={busy}
                  update={(id, status) =>
                    mutate("inquiry", { id, status }, "PATCH")
                  }
                />
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
  const [notes, setNotes] = useState({ html: "", text: "" });
  const selected = tours.find((t) => t.slug === tour);
  return (
    <form
      className="card manual-booking grid gap-4 p-6"
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
          notes: notes.text,
          notesHtml: notes.html || undefined,
          affiliateCode: "",
          termsAccepted: true,
          whatsappConsent: false,
        });
        if (r) setMessage("Prenotazione registrata.");
      }}
    >
      <h2 className="display-md">Inserimento prenotazione</h2>
      <div className="form-grid manual-booking-grid">
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
      </div>
      <div className="form-grid manual-contact-grid">
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
      <RichTextEditor label="Note" html={notes.html} onChange={(html, text) => setNotes({ html, text })} />
      <label className="flex gap-3 text-sm">
        <input required type="checkbox" />
        Confermo che il cliente ha accettato le condizioni di prenotazione.
      </label>
      <button disabled={busy} className="button-primary">
        Registra e invia conferma
      </button>
      {message && <AdminNotice key={message} message={message} />}
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
  const [editCustomer, setEditCustomer] = useState(false);
  const [notes, setNotes] = useState(b.notes);
  const [notesHtml, setNotesHtml] = useState(b.notesHtml);
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
  const [now] = useState(() => Date.now());
  const availableSlots = tour.slots.filter(
    (s) =>
      !s.closed &&
      new Date(s.startsAt).getTime() > now &&
      s.capacity - s.reserved + (s.id === b.slotId ? b.totalGuests : 0) >=
        b.totalGuests,
  );
  const [moveDay, setMoveDay] = useState(() =>
    pragueLocal(
      tour.slots.find((s) => s.id === b.slotId)?.startsAt ||
        new Date().toISOString(),
    ).slice(0, 10),
  );
  const days = [
    ...new Set(availableSlots.map((s) => pragueLocal(s.startsAt).slice(0, 10))),
  ];
  const daySlots = availableSlots.filter(
    (s) => pragueLocal(s.startsAt).slice(0, 10) === moveDay,
  );
  const [reason, setReason] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  return (
    <div className="booking-editor">
      <Link href="/admin/prenotazioni" className="underline">
        ← Prenotazioni
      </Link>
      <div className="card booking-record grid gap-5 p-6">
        <div className="booking-summary">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display-md">
              {b.pnr} · {b.name}
            </h2>
            <button
              type="button"
              className="button-secondary"
              aria-label={
                editCustomer
                  ? "Chiudi modifica cliente"
                  : "Modifica dati cliente"
              }
              aria-expanded={editCustomer}
              onClick={() => setEditCustomer(!editCustomer)}
            >
              <Pencil size={15} />
              <span>Modifica</span>
            </button>
          </div>
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
          {b.status === "pending" && b.paymentMethod === "whatsapp" && (
            <button
              type="button"
              className="button-primary"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Il cliente ha inviato il messaggio WhatsApp? La prenotazione passerà in attesa pagamento e non scadrà più automaticamente.",
                  )
                )
                  void save({ pnr: b.pnr, action: "awaiting-payment" });
              }}
            >
              Messaggio ricevuto · in attesa pagamento
            </button>
          )}
          {b.status === "awaiting_payment" &&
            b.paymentMethod === "whatsapp" && (
              <button
                type="button"
                className="button-primary"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Il pagamento dell’intero ordine è stato ricevuto?",
                    )
                  )
                    void save({ pnr: b.pnr, action: "settle-order" });
                }}
              >
                Registra saldo dell’ordine
              </button>
            )}
        </div>
        {editCustomer && (
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
        )}
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
          ["cash", "bank_transfer", "whatsapp"].includes(b.paymentMethod) &&
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
        <details className="booking-notes">
          <summary>Note operative{notes ? " · presenti" : ""}</summary>
          <RichTextEditor label="Note operative" text={notes} html={notesHtml}
            onChange={(html, plain) => { setNotes(plain); setNotesHtml(html); }} />
        </details>
        <div className="form-grid">
          <label>
            Partecipazione
            <select
              className="text-input"
              value={status}
              disabled={["pending", "awaiting_payment"].includes(b.status)}
              onChange={(e) =>
                setStatus(e.target.value as Reservation["status"])
              }
            >
              {[
                ...(b.status === "pending" ? ["pending"] : []),
                ...(b.status === "awaiting_payment"
                  ? ["awaiting_payment"]
                  : []),
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
              {(
                ["pending", "awaiting_payment"].includes(b.status) &&
                b.paymentMethod === "whatsapp"
                  ? ["pending", "paid"]
                  : ["not_required", "paid", "pending"]
              ).map((x) => (
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
              notesHtml,
              name,
              email,
              phone,
              ...(!b.categorySnapshot ? { adults, children, infants } : {}),
              ...(!["pending", "awaiting_payment"].includes(b.status)
                ? { status }
                : {}),
              paymentStatus: payment,
              notify,
            })
          }
        >
          Salva aggiornamenti
        </button>
      </div>
      <aside className="booking-side">
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
                save({
                  pnr: b.pnr,
                  action: "refund-record",
                  confirmRefund: true,
                })
              }
            >
              Registra rimborso effettuato
            </button>
          </div>
        )}
        <div className="card grid gap-4 p-6">
          <h2 className="display-md">Sposta su un’altra partenza</h2>
          <div className="booking-move-fields">
            <div>
              <span className="admin-field-label">Data</span>
              <SlotDatePicker
                days={days}
                value={days.includes(moveDay) ? moveDay : ""}
                onChange={(day) => {
                  setMoveDay(day);
                  setSlot(
                    availableSlots.find(
                      (s) => pragueLocal(s.startsAt).slice(0, 10) === day,
                    )?.id || "",
                  );
                }}
                triggerClassName="text-input admin-date-trigger"
              />
            </div>
            <label>
              Partenza
              <select
                className="text-input"
                value={daySlots.some((s) => s.id === slotId) ? slotId : ""}
                onChange={(e) => setSlot(e.target.value)}
              >
                <option value="" disabled>
                  Scegli orario
                </option>
                {daySlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {pragueLocal(s.startsAt).slice(11, 16)} ·{" "}
                    {s.capacity - s.reserved} posti
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="button-secondary"
            disabled={
              busy ||
              b.status !== "confirmed" ||
              !daySlots.some((s) => s.id === slotId)
            }
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
      </aside>
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
  const [tab, setTab] = useState("content");
  const [t, setT] = useState(() => ({
    ...tour,
    cancellationHours: tour.cancellationHours ?? defaults.cancellationHours,
    lateRefundPercent: tour.lateRefundPercent ?? defaults.lateRefundPercent,
    galleryImages: tourGalleryImages(tour),
  }));
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarDialog = useRef<HTMLDialogElement>(null);
  const set = (key: keyof CatalogTour, value: unknown) =>
    setT((p) => ({ ...p, [key]: value }));
  useEffect(() => {
    const el = calendarDialog.current;
    if (!el) return;
    if (calendarOpen && !el.open) el.showModal();
    if (!calendarOpen && el.open) el.close();
  }, [calendarOpen]);
  return (
    <div className="tour-admin-screen">
      <nav className="tour-admin-tabs" aria-label="Sezioni del tour">
        {[
          ["content", "Contenuto"],
          ["card", "Anteprima"],
          ["categories", "Prezzi"],
          ["rules", "Gruppi"],
          ["operations", "Orari"],
          ["commissions", "Commissioni"],
          ["settings", "SEO"],
          ["sections", "Sezioni"],
          ["gallery", "Galleria"],
          ["calendar", "Calendario"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={key === "calendar" ? calendarOpen : tab === key}
            onClick={() =>
              key === "calendar" ? setCalendarOpen(true) : setTab(key)
            }
          >
            {label}
          </button>
        ))}
      </nav>
      <form
        className="tour-admin-form"
        hidden={false}
        onInvalidCapture={(event) => {
          const input = event.target as HTMLInputElement;
          const panel =
            input.closest<HTMLElement>("[data-tour-panel]")?.dataset.tourPanel;
          if (panel && panel !== tab) {
            event.preventDefault();
            setTab(panel);
            requestAnimationFrame(() => input.reportValidity());
          }
        }}
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
        <div className="tour-admin-panels">
          <div className="tour-admin-pane" data-tour-panel="card" hidden={tab !== "card"}>
            <TourCardEditor tour={t} onChange={(preview) => set("cardPreview", preview)} />
          </div>
          <div
            data-tour-panel="content"
            className="tour-admin-pane"
            hidden={tab !== "content"}
          >
            <TourVisualEditor
              tour={t}
              previewTour={tour}
              isNew={!availableTours.some((item) => item.id === tour.id)}
              change={set}
              onUploading={setCoverUploading}
            />
          </div>
          <div
            data-tour-panel="settings"
            className="tour-admin-pane"
            hidden={tab !== "settings"}
          >
            <TourSettingsEditor
              tour={t}
              change={set}
              categories={categories}
              busy={busy || galleryUploading || coverUploading}
              onUploading={setCoverUploading}
            />
          </div>
          <div
            className="tour-admin-pane tour-commercial"
            hidden={!["categories", "rules", "commissions"].includes(tab)}
          >
            <TourCommercialEditor
              tour={t}
              section={
                tab === "rules"
                  ? "rules"
                  : tab === "commissions"
                    ? "commissions"
                    : "categories"
              }
              availableTours={availableTours}
              change={set}
            />
          </div>
          <div
            className="tour-admin-pane"
            data-tour-panel="sections"
            hidden={tab !== "sections"}
          >
            <SectionBlocksEditor
              blocks={t.contentBlocks}
              onChange={(blocks) => set("contentBlocks", blocks)}
              onUploading={setCoverUploading}
            />
          </div>
          <div
            className="tour-admin-pane"
            data-tour-panel="operations"
            hidden={tab !== "operations"}
          >
            <TourOperationsEditor
              tour={t}
              change={set}
              closedDates={closedDates}
            />
          </div>
          <div
            className="tour-admin-pane"
            data-tour-panel="gallery"
            hidden={tab !== "gallery"}
          >
            <TourGalleryEditor
              photos={t.galleryImages}
              disabled={busy || coverUploading}
              onChange={(photos) => set("galleryImages", photos)}
              onUploading={setGalleryUploading}
            />
          </div>
        </div>
        <div className="tour-admin-save">
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
        </div>
      </form>
      <dialog
        ref={calendarDialog}
        className="calendar-day-modal tour-calendar-popup"
        onClose={() => setCalendarOpen(false)}
        onCancel={(event) => {
          event.preventDefault();
          setCalendarOpen(false);
        }}
      >
        <div className="calendar-day-modal-head">
          <h3>Calendario</h3>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setCalendarOpen(false)}
          >
            Chiudi
          </button>
        </div>
        {calendarOpen && calendar((updated) =>
          setT((current) => ({
            ...current,
            slots: updated.slots,
            calendarRules: updated.calendarRules,
            calendarLog: updated.calendarLog,
            closures: updated.closures,
          })),
        )}
      </dialog>
    </div>
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
      | "paymentHoldMinutes"
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
        {field("minimumTours", "Numero minimo di tour a pagamento diversi")}
        {field(
          "paymentHoldMinutes",
          "Scadenza messaggio WhatsApp (minuti)",
        )}
        {field(
          "cancellationHours",
          "Cancellazione gratuita fino a (ore prima)",
        )}
        {field("lateRefundPercent", "Rimborso dopo il termine (%)")}
        {field("retentionDays", "Conservazione dati (giorni)")}
      </div>
      <p className="text-sm">
        La scadenza WhatsApp vale solo per le prenotazioni ancora «Nuove»: se
        entro quel tempo non passano in «In attesa pagamento», i posti si
        liberano e parte l’email di prenotazione scaduta. Listino last-minute in{" "}
        <Link href="/admin/last-minute">Last minute</Link>. Testi email in{" "}
        <Link href="/admin/pre-tour">Email</Link>.
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
