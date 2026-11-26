"use client";
import ui from "./public-ui.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { managedBooking } from "@/lib/platform/booking";
import { formatMoney } from "@/lib/format";
type Booking = Awaited<ReturnType<typeof managedBooking>>;
const date = (value: string) =>
  new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "full",
    timeStyle: "short",
  });
export function ManageBooking({ pnr, proof }: { pnr: string; proof: string }) {
  const [booking, setBooking] = useState<Booking | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [slot, setSlot] = useState("");
  async function send(action = "view", fields: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/platform/manage/${encodeURIComponent(pnr)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, action, ...fields }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Operazione non riuscita");
      setBooking(d);
      setSlot(d.slotId);
      if (action !== "view")
        setMessage(
          action === "cancel"
            ? "Prenotazione cancellata. Riceverai la comunicazione aggiornata via email."
            : "Partenza aggiornata. Riceverai la nuova conferma via email.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connessione non disponibile.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/platform/manage/${encodeURIComponent(pnr)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, action: "view" }),
      signal: controller.signal,
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error || "Link non valido");
        setBooking(data);
        setSlot(data.slotId);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [pnr, proof]);
  return (
    <section className={`${ui.page} ${ui.management} section`}>
      <div className="container-page max-w-3xl">
        <p className="micro-label text-primary">La tua prenotazione · {pnr}</p>
        <h1 className="display-xl my-5">Organizza la tua visita.</h1>
        <p className="mb-6">
          Da questo link puoi gestire esclusivamente questa prenotazione, senza
          registrazione.
        </p>
        {error && (
          <p role="alert" className="card mb-5 p-5 text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="card mb-5 p-5">
            {message}
          </p>
        )}
        {!booking && !error && <p role="status">Caricamento…</p>}
        {booking && (
          <>
            <article className="card mb-6 grid gap-4 p-6">
              <span
                className={`status-chip ${booking.status === "confirmed" ? "status-success" : booking.status === "pending" || booking.status === "awaiting_payment" ? "status-warning" : "status-muted"}`}
              >
                {
                  {
                    confirmed: "Confermata",
                    pending: "In attesa",
                    awaiting_payment: "In attesa di pagamento",
                    cancelled: "Cancellata",
                    present: "Partecipazione registrata",
                    no_show: "Assente",
                  }[booking.status]
                }
              </span>
              <h2 className="display-md">{booking.tourTitle}</h2>
              <p>{date(booking.startsAt)} · ora di Praga</p>
              <p>
                {booking.totalGuests} partecipanti ·{" "}
                {formatMoney(booking.totalCents, booking.currency)} ·{" "}
                {booking.paymentStatus === "paid"
                  ? "Pagato"
                  : booking.paymentStatus === "refunded"
                    ? "Rimborsato"
                    : booking.paymentMethod === "bank_transfer"
                      ? "Bonifico in attesa"
                      : "Contanti sul posto"}
              </p>
              {booking.paymentMethod === "bank_transfer" && (
                <p className="whitespace-pre-wrap">
                  Causale: {booking.pnr}. {booking.paymentInstructions}
                </p>
              )}
              {booking.categorySnapshot && (
                <p>
                  {booking.categorySnapshot
                    .filter((c) => c.quantity)
                    .map((c) => `${c.quantity} ${c.label}`)
                    .join(" · ")}
                </p>
              )}
              <p>
                {booking.meetingPoint}
                <br />
                {booking.meetingAddress}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="button-secondary"
                  href={booking.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apri la mappa
                </a>
                <a className="button-secondary" href={booking.calendarUrl}>
                  Aggiungi al calendario
                </a>
              </div>
              {booking.status === "cancelled" && (
                <p>
                  {booking.cancellationReason}
                  {booking.refundCents
                    ? ` · Rimborso previsto: ${formatMoney(booking.refundCents, booking.currency)} · stato: ${booking.refundStatus === "succeeded" ? "completato" : booking.refundStatus === "manual" ? "in gestione allo staff" : "in elaborazione"}`
                    : ""}
                </p>
              )}
              {!booking.canMove &&
                !booking.canCancel &&
                booking.status !== "cancelled" && (
                  <p className="text-sm">
                    Non puoi più modificare o cancellare online questa
                    prenotazione. Contatta il team per assistenza.
                  </p>
                )}
            </article>
            {booking.canMove && (
              <form
                className="card mb-6 grid gap-4 p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (busy || slot === booking.slotId) return;
                  send("move", { slotId: slot });
                }}
              >
                <h2 className="display-md">Cambia data o orario</h2>
                <p className="text-sm">
                  Puoi cambiare partenza su questo tour fino a{" "}
                  {booking.cancellationHours} ore prima, a parità di
                  partecipanti e in base alla disponibilità.
                </p>
                <label>
                  Nuova partenza
                  <select
                    className="text-input"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    disabled={busy}
                  >
                    {booking.slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {date(s.startsAt)}
                        {s.id === booking.slotId
                          ? " · partenza attuale"
                          : ` · ${s.available} posti disponibili`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={busy || slot === booking.slotId || !slot}
                  className="button-secondary"
                >
                  Conferma nuova partenza
                </button>
              </form>
            )}
            {booking.canCancel && (
              <details className="card mb-6 p-6">
                <summary className="cursor-pointer font-bold">
                  Cancella questa prenotazione
                </summary>
                <form
                  className="mt-5 grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (busy) return;
                    send("cancel", {
                      reason: new FormData(e.currentTarget).get("reason"),
                    });
                  }}
                >
                  <p>
                    {booking.paymentStatus === "paid"
                      ? `Rimborso previsto secondo le condizioni accettate: ${formatMoney(booking.refundPreviewCents, booking.currency)}.`
                      : "Non ci sono pagamenti registrati da rimborsare."}{" "}
                    I posti saranno liberati dopo la conferma.
                  </p>
                  <label>
                    Motivo della cancellazione
                    <textarea
                      className="text-input"
                      name="reason"
                      minLength={2}
                      maxLength={1000}
                      required
                      disabled={busy}
                    />
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" required disabled={busy} />
                    Confermo di voler cancellare questa prenotazione.
                  </label>
                  <button disabled={busy} className="button-secondary button-danger">
                    Conferma cancellazione
                  </button>
                </form>
              </details>
            )}
          </>
        )}
        <Link href="/contatti" className="button-secondary">
          Contatta il team
        </Link>
      </div>
    </section>
  );
}
