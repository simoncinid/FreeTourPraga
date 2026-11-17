"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import type { Tour } from "@/lib/types";

const dayKey = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

export function QuickBooking({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [currentTour, setCurrentTour] = useState(tour);
  const [step, setStep] = useState<0 | 1>(0);
  const [day, setDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const slots = currentTour.operationalReviewRequired ? [] : currentTour.slots.filter((slot) => Date.parse(slot.startsAt) > openedAt && slot.capacity > slot.reserved).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const days = [...new Set(slots.map((slot) => dayKey(slot.startsAt)))];
  const selected = slots.find((slot) => slot.id === slotId && dayKey(slot.startsAt) === day);
  const guests = adults + children + infants;
  const valid = !!selected && guests <= selected.capacity - selected.reserved && guests <= currentTour.maxGuests;
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; element?.close(); };
  }, []);

  async function submit(destination: string) {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/platform/catalog", { cache: "no-store" });
      if (!response.ok) throw new Error("Non riusciamo a verificare i posti. Riprova tra poco.");
      const data = await response.json();
      const fresh: Tour | undefined = data.tours?.find((item: Tour) => item.slug === tour.slug);
      const freshSlot = fresh?.slots.find((slot) => slot.id === slotId);
      if (fresh) setCurrentTour(fresh);
      if (!fresh || fresh.operationalReviewRequired || !freshSlot || Date.parse(freshSlot.startsAt) <= Date.now() || guests > freshSlot.capacity - freshSlot.reserved || guests > fresh.maxGuests) {
        throw new Error("Posti non più disponibili. Cambia data o partecipanti.");
      }
      addToCart({ tourSlug: fresh.slug, tourTitle: fresh.title, slotId, startsAt: freshSlot.startsAt, adults, children, infants, unitAdultCents: fresh.basePriceCents, unitChildCents: fresh.childPriceCents, unitInfantCents: fresh.infantPriceCents, imageUrl: fresh.imageUrl });
      onClose();
      router.push(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossibile aggiungere il tour. Riprova.");
    } finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="quick-booking" aria-labelledby={titleId} onCancel={onClose} onClick={(event) => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }
  }}>
    <header className="quick-booking-header">
      <div><p className="quick-booking-eyebrow">Prenotazione rapida</p><h2 id={titleId}>{tour.title}</h2></div>
      <button type="button" aria-label="Chiudi prenotazione rapida" onClick={onClose} className="quick-booking-close">×</button>
    </header>
    {!slots.length ? <div className="quick-booking-empty"><p>Al momento non ci sono partenze prenotabili per questo tour.</p><Link href="/contatti" className="button-primary">Contattaci per informazioni</Link></div> : <form onSubmit={(event) => { event.preventDefault(); if (step === 0) { if (selected) setStep(1); } else void submit("/carrello"); }}>
      <div className="quick-booking-steps" aria-label="Passaggi della prenotazione"><span aria-current={step === 0 ? "step" : undefined}>1. Data e orario</span><span aria-current={step === 1 ? "step" : undefined}>2. Partecipanti</span></div>
      {step === 0 ? <div className="quick-booking-dates">
        <label>Data del tour<select className="text-input" required value={day} onChange={(event) => { setDay(event.target.value); setSlotId(""); }}><option value="">Scegli una data</option>{days.map((date) => <option key={date} value={date}>{new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</option>)}</select></label>
        <label>Orario<select className="text-input" required disabled={!day} value={slotId} onChange={(event) => setSlotId(event.target.value)}><option value="">Scegli un orario</option>{slots.filter((slot) => dayKey(slot.startsAt) === day).map((slot) => <option key={slot.id} value={slot.id}>{new Date(slot.startsAt).toLocaleTimeString("it-IT", { timeZone: "Europe/Prague", hour: "2-digit", minute: "2-digit" })} · {slot.capacity - slot.reserved} posti</option>)}</select></label>
      </div> : <>
        <div className="quick-booking-selection"><span>{selected ? new Date(selected.startsAt).toLocaleString("it-IT", { timeZone: "Europe/Prague", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Seleziona un’altra partenza"}</span><button type="button" onClick={() => { setStep(0); setError(""); }}>Modifica data</button></div>
        <fieldset className="quick-booking-guests"><legend>Numero di persone</legend>{[
          { label: "Adulti", age: `Da ${tour.adultMinAge ?? 12} anni`, value: adults, change: setAdults, min: 1 },
          { label: "Bambini", age: `${tour.childMinAge ?? 4}–${(tour.adultMinAge ?? 12) - 1} anni`, value: children, change: setChildren, min: 0 },
          ...((tour.childMinAge ?? 4) > 0 ? [{ label: "Infanti", age: `0–${(tour.childMinAge ?? 4) - 1} anni`, value: infants, change: setInfants, min: 0 }] : []),
        ].map((band) => <label key={band.label}><span>{band.label}<small>{band.age}</small></span><input type="number" className="text-input" required min={band.min} max={tour.maxGuests} value={band.value} onChange={(event) => band.change(Math.max(band.min, Math.min(tour.maxGuests, Math.trunc(Number(event.target.value)))))} /></label>)}</fieldset>
        <p className="quick-booking-total"><span>{guests} {guests === 1 ? "persona" : "persone"} · Totale</span><strong>{formatMoney(adults * currentTour.basePriceCents + children * currentTour.childPriceCents + infants * currentTour.infantPriceCents)}</strong></p>
      </>}
      {selected && step === 1 && !valid && <p role="alert" className="quick-booking-error">Posti insufficienti per le persone selezionate.</p>}
      {error && <p role="alert" className="quick-booking-error">{error}</p>}
      <p className="quick-booking-note">I posti saranno confermati al completamento della prenotazione.</p>
      {step === 0 ? <button type="submit" disabled={!selected} className="button-primary">Scegli i partecipanti →</button> : <div className="quick-booking-actions">
        <button type="button" disabled={!valid || busy} onClick={(event) => { if (event.currentTarget.form?.reportValidity()) void submit("/"); }} className="button-secondary">Continua a prenotare</button>
        <button type="submit" disabled={!valid || busy} className="button-primary">{busy ? "Verifica posti…" : "Vai al carrello"}</button>
      </div>}
    </form>}
  </dialog>;
}
