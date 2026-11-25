"use client";
import ui from "./public-ui.module.css";
import { ChevronUp, Compass, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBrowserStorage, useHydrated } from "@/lib/browser-storage";
import { useRouter } from "next/navigation";
import {
  removeFromCart,
  clearCart,
  cartItemTotal,
  type CartItem,
} from "@/lib/cart";
import { formatMoney } from "@/lib/format";
export function ReservationFlow({ mode }: { mode: "cart" | "checkout" }) {
  const router = useRouter();
  const storedCart = useBrowserStorage("ftp-cart");
  const items = useMemo<CartItem[]>(() => {
    try {
      const parsed = JSON.parse(storedCart || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [storedCart]);
  const ready = useHydrated();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const affiliateCode = useBrowserStorage("ftp-affiliate") || "";
  const [quoteResult, setQuote] = useState<{
    key: string;
    items: {
      currency?: "EUR" | "CZK";
      subtotalCents: number;
      discountCents: number;
      totalCents: number;
      cancellationHours: number;
      lateRefundPercent: number;
      bookingNote: string;
      lastMinuteApplied?: boolean;
    }[];
  } | null>(null);
  const [rules, setRules] = useState({
    minimumTours: 2,
    multiTourPercent: 10,
    cancellationHours: 24,
  });
  const key = useRef("");
  useEffect(() => {
    fetch("/api/platform/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setRules(d.settings);
      })
      .catch(() => {});
  }, []);
  const payloadItems = items.map((i) => ({
    tourSlug: i.tourSlug,
    slotId: i.slotId,
    adults: i.adults,
    children: i.children,
    infants: i.infants || 0,
    participants: i.participants,
  }));
  const quoteKey = JSON.stringify({ items: payloadItems, affiliateCode });
  const quote = quoteResult?.key === quoteKey ? quoteResult.items : null;
  useEffect(() => {
    if (!JSON.parse(quoteKey).items.length) return;
    const abort = new AbortController();
    fetch("/api/platform/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: quoteKey,
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (abort.signal.aborted) return;
        setQuote({ key: quoteKey, items: d.items });
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [quoteKey]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      key.current =
        sessionStorage.getItem("ftp-checkout-key") || crypto.randomUUID();
      sessionStorage.setItem("ftp-checkout-key", key.current);
      const input = {
        items: payloadItems,
        affiliateCode,
        name: f.get("name"),
        email: f.get("email"),
        phone: String(f.get("phone")).replace(/[\s()-]/g, ""),
        notes: f.get("notes"),
        termsAccepted: f.get("terms") === "on",
        whatsappConsent: false,
      };
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(input)),
      );
      const fingerprint = Array.from(new Uint8Array(digest))
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      if (sessionStorage.getItem("ftp-checkout-fingerprint") !== fingerprint) {
        key.current = crypto.randomUUID();
        sessionStorage.setItem("ftp-checkout-key", key.current);
        sessionStorage.setItem("ftp-checkout-fingerprint", fingerprint);
      }
      const r = await fetch("/api/platform/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify(input),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      sessionStorage.setItem(
        "ftp-checkout-receipt",
        JSON.stringify({ proof: d.receiptProof }),
      );
      clearCart();
      sessionStorage.removeItem("ftp-checkout-key");
      sessionStorage.removeItem("ftp-checkout-fingerprint");
      router.push(d.confirmationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di connessione");
      setBusy(false);
    }
  }
  if (!ready) return <p role="status">Caricamento…</p>;
  if (!items.length)
    return (
      <div
        className={`${ui.emptyState} card mx-auto max-w-xl p-10 text-center`}
      >
        <Compass size={34} className="mx-auto mb-5 text-primary" aria-hidden />
        <h1 className="display-lg mb-5">Il tuo viaggio comincia qui.</h1>
        <p className="mb-6">Scegli un tour e aggiungilo al carrello.</p>
        <Link className="button-primary" href="/tour">
          Scopri le esperienze
        </Link>
      </div>
    );
  const currency = quote?.[0]?.currency ?? items[0]?.currency ?? "EUR";
  const subtotal =
    quote?.reduce((s, i) => s + i.subtotalCents, 0) ??
    items.reduce((s, i) => s + cartItemTotal(i), 0);
  const discount = quote?.reduce((s, i) => s + i.discountCents, 0) || 0;
  return (
    <>
      <div className="mb-8">
        <p className="micro-label text-primary">
          Il tuo viaggio ·{" "}
          {mode === "cart" ? "1. Esperienze" : "2. Contatti e conferma"}
        </p>
        <h1 className="display-xl mt-3">
          {mode === "cart" ? (
            <>
              La tua Praga,
              <br />
              in programma.
            </>
          ) : (
            "Manca solo un passo."
          )}
        </h1>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          {items.map((i) => (
            <article key={i.id} className={`card p-5 ${ui.reservationItem}`}>
              <div className={ui.reservationItemHeader}>
                <h2 className="display-md">{i.tourTitle}</h2>
                <button
                  aria-label={`Rimuovi ${i.tourTitle}`}
                  className={`text-sm underline ${ui.reservationRemove}`}
                  onClick={() => {
                    removeFromCart(i.id);
                  }}
                >
                  <Trash2 size={14} aria-hidden />
                  <span className={ui.reservationRemoveLabel}>Rimuovi</span>
                </button>
              </div>
              <p className="my-2">
                {new Date(i.startsAt).toLocaleString("it-IT", {
                  timeZone: "Europe/Prague",
                  dateStyle: "long",
                  timeStyle: "short",
                })}{" "}
                · ora di Praga
              </p>
              <p className="text-sm">
                {i.categorySnapshot
                  ? i.categorySnapshot
                      .filter((c) => c.quantity)
                      .map((c) => `${c.quantity} ${c.label}`)
                      .join(" · ")
                  : `${i.adults} adulti · ${i.children} bambini · ${i.infants || 0} infanti`}
              </p>
              <strong>
                {formatMoney(
                  quote?.[items.indexOf(i)]?.totalCents ?? cartItemTotal(i),
                  i.currency,
                )}
              </strong>
              {quote?.[items.indexOf(i)] && (
                <div className="mt-3 grid gap-2 text-sm">
                  <p>{quote[items.indexOf(i)].bookingNote}</p>
                  <p>
                    Cancellazione gratuita fino a{" "}
                    {quote[items.indexOf(i)].cancellationHours} ore prima. Dopo
                    il termine: rimborso del{" "}
                    {quote[items.indexOf(i)].lateRefundPercent}% dell’importo
                    pagato.
                  </p>
                </div>
              )}
            </article>
          ))}
          {mode === "checkout" && (
            <form
              id="reservation"
              className="card grid gap-5 p-7"
              onSubmit={submit}
            >
              <h2 className="display-md">I tuoi contatti</h2>
              <label>
                Nome e cognome
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={120}
                  required
                  className="text-input"
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="text-input"
                />
              </label>
              <label>
                Telefono con prefisso internazionale
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+393331234567"
                  required
                  className="text-input"
                />
              </label>
              <label>
                Note
                <textarea
                  name="notes"
                  maxLength={2000}
                  className="text-input"
                />
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input name="terms" type="checkbox" required />
                <span>
                  Ho letto{" "}
                  <Link href="/privacy" className="underline">
                    l’informativa sul trattamento dei dati
                  </Link>{" "}
                  e accetto i{" "}
                  <Link href="/termini" className="underline">
                    termini di prenotazione
                  </Link>
                  .
                </span>
              </label>
              <button
                type="submit"
                disabled={busy || !quote}
                className={`button-primary ${ui.reservationFormSubmit}`}
              >
                {busy ? "Prenotazione in corso…" : "Conferma prenotazione"}
              </button>
            </form>
          )}
        </div>
        <aside
          className={`reservation-summary card sticky top-24 grid gap-5 p-7 ${ui.reservationSummary} ${
            summaryOpen ? ui.reservationSummaryOpen : ""
          }`}
        >
          <button
            type="button"
            className={ui.reservationSummaryHandle}
            aria-expanded={summaryOpen}
            aria-controls="reservation-summary-details"
            onClick={() => setSummaryOpen((open) => !open)}
          >
            <span className={ui.reservationSummaryGrip} aria-hidden />
            <span className={ui.reservationSummaryBar}>
              <span>
                <strong>
                  Totale {formatMoney(subtotal - discount, currency)}
                </strong>
              </span>
              <ChevronUp
                size={18}
                aria-hidden
                className={
                  summaryOpen ? undefined : ui.reservationSummaryChevron
                }
              />
            </span>
          </button>
          <div
            id="reservation-summary-details"
            className={ui.reservationSummaryDetails}
          >
            <h2 className="display-md">Il tuo riepilogo</h2>
            <ul className={ui.reservationSummaryTours}>
              {items.map((item, index) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.tourTitle}</span>
                  <strong>
                    {formatMoney(
                      quote?.[index]?.totalCents ?? cartItemTotal(item),
                      item.currency,
                    )}
                  </strong>
                </li>
              ))}
            </ul>
            {rules.multiTourPercent > 0 && subtotal > 0 && (
              <p className="text-sm">
                Con almeno {rules.minimumTours} tour a pagamento diversi, sconto
                automatico del {rules.multiTourPercent}%.
              </p>
            )}
            <label className="text-sm">
              Codice partner
              <input
                className="text-input"
                value={affiliateCode}
                maxLength={40}
                readOnly
                placeholder="Nessun codice partner"
              />
            </label>
            {affiliateCode ? (
              <p className="text-xs text-muted">
                Partner associato alla prenotazione.
              </p>
            ) : null}
            {discount > 0 && (
              <p className="flex justify-between text-success">
                <span>Sconto multi-tour</span>
                <strong>−{formatMoney(discount, currency)}</strong>
              </p>
            )}
            <div className="flex justify-between border-t pt-5 text-xl">
              <strong>Totale</strong>
              <strong>{formatMoney(subtotal - discount, currency)}</strong>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          {mode === "cart" ? (
            <Link className="button-primary" href="/checkout">
              Continua la prenotazione
            </Link>
          ) : (
            <button
              type="submit"
              form="reservation"
              disabled={busy || !quote}
              className="button-primary"
            >
              {busy ? "Prenotazione in corso…" : "Conferma prenotazione"}
            </button>
          )}
          <Link
            href="/tour"
            className={`text-center text-sm underline ${ui.reservationSummaryExtra}`}
          >
            Aggiungi un’altra esperienza
          </Link>
        </aside>
      </div>
    </>
  );
}
