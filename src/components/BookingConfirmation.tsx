"use client";
import ui from "./public-ui.module.css";
import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { orderConfirmation } from "@/lib/platform/booking";
type Receipt = Awaited<ReturnType<typeof orderConfirmation>>;
export function BookingConfirmation() {
  const [receipt, setReceipt] = useState<Receipt | null>(null),
    [proof, setProof] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("ftp-checkout-receipt") || "null",
        );
        if (!saved?.proof) {
          setMessage(
            "Trovi il riepilogo e l’esito della prenotazione nella conferma inviata via email.",
          );
          return;
        }
        const r = await fetch("/api/platform/confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proof: saved.proof }),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (cancelled) return;
        setReceipt(d);
        setProof(saved.proof);
      } catch (e) {
        if (!cancelled)
          setMessage(
            e instanceof Error
              ? e.message
              : "Connessione non disponibile. Consulta la conferma email.",
          );
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  const payment = receipt?.payment;
  const paymentDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (payment && !paymentDialog.current?.open)
      paymentDialog.current?.showModal();
  }, [payment]);
  const cancelled = receipt?.bookings.every((b) => b.status === "cancelled");
  return (
    <section
      className={`${ui.page} ${ui.confirmation} section`}
      data-page="confirmation"
    >
      <div className={`container-page ${ui.confirmationGrid}`}>
        <div className={ui.confirmationIntro}>
          <p className="micro-label text-primary">Il tuo viaggio a Praga</p>
          {receipt &&
            receipt.bookings.length > 0 &&
            receipt.bookings.every((b) => b.status === "confirmed") && (
              <CheckCircle2
                size={34}
                className={`${ui.confirmationCheck} mt-5 text-success`}
                aria-hidden
              />
            )}
          <h1 className="display-xl my-5">
            {!receipt
              ? "La tua prenotazione."
              : cancelled
                ? "Prenotazione non attiva."
                : payment
                  ? "Prenotazione in attesa di pagamento"
                  : "Grazie per aver scelto i nostri tour."}
          </h1>
          {payment ? (
            <>
              <p className="mb-5">
                I posti per i tour a pagamento sono riservati temporaneamente.
                Riceverai una conferma per ogni tour dopo la registrazione del
                saldo.
              </p>
              <button
                type="button"
                className="button-primary"
                onClick={() => paymentDialog.current?.showModal()}
              >
                Opzioni di pagamento
              </button>
              <dialog
                ref={paymentDialog}
                aria-labelledby="payment-title"
                className={`${ui.paymentDialog} card m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto backdrop:bg-black/50`}
              >
                <button
                  type="button"
                  className={ui.paymentDialogClose}
                  aria-label="Chiudi"
                  onClick={() => paymentDialog.current?.close()}
                >
                  <X size={22} strokeWidth={2.25} aria-hidden />
                </button>
                <div className={ui.paymentDialogBody}>
                  <h2 className="display-md" id="payment-title">
                    Completa il pagamento
                  </h2>
                  <p>
                    Totale da saldare <strong>{payment.amount}</strong>.
                  </p>
                  <p className="text-sm">
                    I posti sono riservati fino al{" "}
                    {new Date(payment.expiresAt).toLocaleString("it-IT", {
                      timeZone: "Europe/Prague",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    (ora di Praga).
                  </p>
                  <a
                    className="button-primary"
                    href={payment.card}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Richiedi un link per pagare con carta su WhatsApp
                  </a>
                  <a
                    className="button-secondary"
                    href={payment.office}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Prenota su WhatsApp il pagamento in ufficio
                  </a>
                  <p className="text-sm">
                    Per pagare in ufficio, scrivici su WhatsApp almeno 24 ore
                    prima per concordare l’orario di arrivo.
                  </p>
                </div>
              </dialog>
            </>
          ) : (
            receipt &&
            !cancelled && (
              <p className="mb-5">
                Riceverai un’email di conferma con i dettagli di ciascun tour.
              </p>
            )
          )}
        </div>
        <div className={ui.confirmationReceipt}>
          {message && (
            <p role="status" className="card p-5">
              {message}
            </p>
          )}
          {!receipt && !message && (
            <p role="status">Caricamento del riepilogo…</p>
          )}
          {receipt &&
            receipt.bookings.map((b) => (
              <article
                key={b.pnr}
                data-status={b.status}
                className="card mb-5 grid gap-4 p-6"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <strong>{b.pnr}</strong>
                  <span
                    className={`status-chip ${b.status === "confirmed" ? "status-success" : b.status === "pending" ? "status-warning" : "status-muted"}`}
                  >
                    {
                      {
                        confirmed: "Confermata",
                        pending: "In attesa di pagamento",
                        cancelled: "Cancellata",
                        present: "Partecipazione registrata",
                        no_show: "Assente",
                      }[b.status]
                    }
                  </span>
                </div>
                <h2 className="display-md">{b.tourTitle}</h2>
                {b.status !== "cancelled" && b.totalCents > 0 && (
                  <p className="whitespace-pre-wrap">
                    {b.paymentStatus === "paid"
                      ? "Pagamento registrato."
                      : b.paymentMethod === "whatsapp"
                        ? "Saldo da concordare su WhatsApp."
                        : b.paymentMethod === "bank_transfer"
                          ? `Bonifico · Causale: ${b.pnr}. ${b.paymentInstructions || ""}`
                          : "Pagamento in contanti sul posto."}
                  </p>
                )}
                <p>
                  {new Date(b.startsAt).toLocaleString("it-IT", {
                    timeZone: "Europe/Prague",
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
                <p>
                  {b.categorySnapshot
                    ? b.categorySnapshot
                        .filter((c) => c.quantity)
                        .map((c) => `${c.quantity} ${c.label}`)
                        .join(" · ")
                    : `${b.adults} adulti · ${b.children} bambini · ${b.infants} infanti`}
                  · {formatMoney(b.totalCents, b.currency)}
                </p>
                <p>
                  {b.meetingPoint}
                  <br />
                  {b.meetingAddress}
                </p>
                <p className="text-sm">{b.bookingNote}</p>
                <p className="text-sm">{b.cancellationNote}</p>
                <div className={ui.confirmationPair}>
                  <a
                    href={b.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary"
                  >
                    Apri le indicazioni
                  </a>
                  {b.status === "confirmed" && (
                    <a
                      href={`/api/calendar/booking/${b.pnr}?token=${proof}`}
                      className="button-secondary"
                    >
                      Aggiungi al calendario
                    </a>
                  )}
                </div>
              </article>
            ))}
        </div>
        <div className={ui.confirmationActions}>
          <Link href="/tour" className="button-primary">
            Scopri altre esperienze
          </Link>
          <Link href="/contatti" className="button-secondary">
            Contatta il team
          </Link>
        </div>
      </div>
    </section>
  );
}
