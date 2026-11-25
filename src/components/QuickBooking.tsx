"use client";

import {
  categoriesFor,
  estimatedEuroPrice,
  selectedPrices,
} from "@/lib/participant-pricing";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import {
  bookingDeadlineNote,
  cancellationNote,
  freeTourNote,
  isFreeTour,
  tourPrices,
} from "@/lib/tour-rules";
import type { Tour } from "@/lib/types";
import { FilterSelect } from "@/components/FilterSelect";
import { SlotDatePicker } from "@/components/SlotDatePicker";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Prague",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayKey = (value: string) => dayFormatter.format(new Date(value));

export function QuickBooking({
  tour,
  onClose,
  inline = false,
  sheet = false,
}: {
  tour: Tour;
  onClose: () => void;
  inline?: boolean;
  sheet?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [currentTour, setCurrentTour] = useState(tour);
  const [day, setDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      categoriesFor(tour).map((c, i) => [c.id, i === 0 ? 1 : 0]),
    ),
  );
  const dynamic = !!currentTour.priceCategories?.length;
  const participants = categoriesFor(currentTour).map((c) => ({
    categoryId: c.id,
    quantity: quantities[c.id] ?? 0,
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const slots = useMemo(
    () =>
      currentTour.operationalReviewRequired
        ? []
        : currentTour.slots
            .filter(
              (slot) =>
                Date.parse(slot.startsAt) > openedAt &&
                slot.capacity > slot.reserved,
            )
            .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    [currentTour, openedAt],
  );
  const days = useMemo(
    () => [...new Set(slots.map((slot) => dayKey(slot.startsAt)))],
    [slots],
  );
  const selected = slots.find(
    (slot) => slot.id === slotId && dayKey(slot.startsAt) === day,
  );
  const guests = dynamic
    ? participants.reduce((n, p) => n + p.quantity, 0)
    : adults + children + infants;
  const groupContact =
    isFreeTour(currentTour) &&
    currentTour.freeGroupMode === "contact" &&
    guests > (currentTour.freeGroupLimit ?? 6);
  const valid =
    !!selected &&
    guests > 0 &&
    !groupContact &&
    guests <= selected.capacity - selected.reserved &&
    guests <= currentTour.maxGuests;
  const units = tourPrices(currentTour, guests);
  const free = isFreeTour(currentTour);
  const paidInCzk =
    !free &&
    currentTour.currency === "CZK" &&
    categoriesFor(currentTour).some(
      (category) => category.estimatedEuroCents !== undefined,
    );
  const deadline = bookingDeadlineNote(currentTour);
  useEffect(() => {
    if (inline) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      element?.close();
    };
  }, [inline]);

  async function submit(destination: string) {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/platform/catalog", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Non riusciamo a verificare i posti. Riprova tra poco.",
        );
      const data = await response.json();
      const fresh: Tour | undefined = data.tours?.find(
        (item: Tour) => item.slug === tour.slug,
      );
      const freshSlot = fresh?.slots.find((slot) => slot.id === slotId);
      if (fresh) setCurrentTour(fresh);
      if (
        !fresh ||
        fresh.operationalReviewRequired ||
        !freshSlot ||
        Date.parse(freshSlot.startsAt) <= openedAt ||
        guests > freshSlot.capacity - freshSlot.reserved ||
        guests > fresh.maxGuests
      ) {
        throw new Error(
          "Posti non più disponibili. Cambia data o partecipanti.",
        );
      }
      addToCart({
        tourSlug: fresh.slug,
        tourTitle: fresh.title,
        slotId,
        startsAt: freshSlot.startsAt,
        adults: dynamic ? guests : adults,
        children: dynamic ? 0 : children,
        infants: dynamic ? 0 : infants,
        participants: dynamic ? participants : undefined,
        categorySnapshot: dynamic
          ? selectedPrices(fresh, participants).snapshot
          : undefined,
        currency: fresh.currency ?? "EUR",
        eligibleForDiscounts: fresh.onlineDiscounts !== false,
        unitAdultCents: tourPrices(fresh, guests).adult,
        unitChildCents: tourPrices(fresh, guests).child,
        unitInfantCents: tourPrices(fresh, guests).infant,
        imageUrl: fresh.imageUrl,
      });
      onClose();
      router.push(destination);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossibile aggiungere il tour. Riprova.",
      );
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <>
      <header className="quick-booking-header">
        <div>
          <p className="quick-booking-eyebrow">Prenotazione rapida</p>
          <h2 id={titleId}>{tour.title}</h2>
        </div>
        {!inline && (
          <button
            type="button"
            aria-label="Chiudi prenotazione rapida"
            onClick={onClose}
            className="quick-booking-close"
          >
            ×
          </button>
        )}
      </header>
      {!slots.length ? (
        <div className="quick-booking-empty">
          <p>Al momento non ci sono partenze prenotabili per questo tour.</p>
          <Link href="/contatti" className="button-primary">
            Contattaci per informazioni
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit("/checkout");
          }}
        >
          <div className="quick-booking-dates">
            <label>
              Data del tour
              <SlotDatePicker
                days={days}
                value={day}
                onChange={(next) => {
                  setDay(next);
                  setSlotId("");
                }}
              />
            </label>
            <label>
              Orario
              <FilterSelect
                aria-label="Orario"
                required
                disabled={!day}
                value={slotId}
                onChange={setSlotId}
                triggerClassName="filter-select-trigger text-input"
                options={[
                  { value: "", label: "Scegli un orario" },
                  ...slots
                    .filter((slot) => dayKey(slot.startsAt) === day)
                    .map((slot) => ({
                      value: slot.id,
                      label: new Date(slot.startsAt).toLocaleTimeString(
                        "it-IT",
                        {
                          timeZone: "Europe/Prague",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      ),
                    })),
                ]}
              />
              <input type="hidden" name="slotId" value={slotId} required />
            </label>
          </div>
          <fieldset className="quick-booking-guests">
            <legend>Numero di persone</legend>
            {(dynamic
              ? categoriesFor(currentTour).map((c) => ({
                  label: c.label,
                  age:
                    c.description ||
                    [
                      c.minAge !== undefined ? `da ${c.minAge} anni` : "",
                      c.maxAge !== undefined ? `fino a ${c.maxAge} anni` : "",
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  euro:
                    currentTour.currency === "CZK"
                      ? estimatedEuroPrice(c.estimatedEuroCents)
                      : "",
                  value: quantities[c.id] ?? 0,
                  change: (value: number) =>
                    setQuantities((p) => ({ ...p, [c.id]: value })),
                  min: 0,
                  price: isFreeTour(currentTour) ? units.adult : c.priceCents,
                }))
              : [
                  {
                    label: "Adulti",
                    euro: "",
                    age: `Da ${tour.adultMinAge ?? 12} anni`,
                    value: adults,
                    change: setAdults,
                    min: 1,
                    price: units.adult,
                  },
                  {
                    label: "Bambini",
                    euro: "",
                    age: `${tour.childMinAge ?? 4}–${(tour.adultMinAge ?? 12) - 1} anni`,
                    value: children,
                    change: setChildren,
                    min: 0,
                    price: units.child,
                  },
                  ...((tour.childMinAge ?? 4) > 0
                    ? [
                        {
                          label: "Infanti",
                          euro: "",
                          age: `Minori di ${tour.childMinAge ?? 4} anni`,
                          value: infants,
                          change: setInfants,
                          min: 0,
                          price: units.infant,
                        },
                      ]
                    : []),
                ]
            ).map((band) => (
              <div className="quick-booking-guest-row" key={band.label}>
                <span>
                  {band.label}
                  <small className="block">{band.age}</small>
                  <strong className="block text-sm">
                    {band.price === 0
                      ? isFreeTour(currentTour)
                        ? "Offerta libera"
                        : "Gratis"
                      : formatMoney(band.price, currentTour.currency)}
                  </strong>
                  {band.euro && <small className="block">{band.euro}</small>}
                </span>
                <div className="quantity-control">
                  <button
                    type="button"
                    className="quantity-button"
                    aria-label={`Diminuisci ${band.label}`}
                    disabled={band.value <= band.min}
                    onClick={() => band.change(band.value - 1)}
                  >
                    −
                  </button>
                  <output
                    className="quantity-value"
                    aria-label={`Quantità ${band.label}`}
                  >
                    {band.value}
                  </output>
                  <button
                    type="button"
                    className="quantity-button"
                    aria-label={`Aumenta ${band.label}`}
                    disabled={guests >= tour.maxGuests}
                    onClick={() => band.change(band.value + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </fieldset>
          <p className="quick-booking-total">
            <span>
              {guests} {guests === 1 ? "persona" : "persone"} · Totale
            </span>
            <strong>
              {formatMoney(
                dynamic
                  ? categoriesFor(currentTour).reduce(
                      (n, c) =>
                        n +
                        (quantities[c.id] ?? 0) *
                          (isFreeTour(currentTour)
                            ? units.adult
                            : c.priceCents),
                      0,
                    )
                  : adults * units.adult +
                      children * units.child +
                      infants * units.infant,
                currentTour.currency,
              )}
            </strong>
          </p>
          {groupContact && (
            <Link href="/contatti" className="button-secondary">
              Contattaci per il tuo gruppo
            </Link>
          )}
          {selected && !valid && !groupContact && (
            <p role="alert" className="quick-booking-error">
              Posti insufficienti per le persone selezionate.
            </p>
          )}
          {error && (
            <p role="alert" className="quick-booking-error">
              {error}
            </p>
          )}
          <p className="quick-booking-note">
            I posti saranno confermati al completamento della prenotazione.
          </p>
          <div className="quick-booking-actions">
            <button
              type="button"
              disabled={!valid || busy}
              onClick={(event) => {
                if (event.currentTarget.form?.reportValidity())
                  void submit("/tour");
              }}
              className="button-secondary"
            >
              Aggiungi al carrello
            </button>
            <button
              type="submit"
              disabled={!valid || busy}
              className="button-primary"
            >
              {busy ? "Verifica posti…" : "Prenota ora"}
            </button>
          </div>
        </form>
      )}
      <div className="quick-booking-policy">
        {free && currentTour.suggestedContribution && (
          <p className="quick-booking-note">
            Prenotazione online gratuita. Al termine della visita scegli tu
            quanto lasciare alla guida. Offerta consigliata{" "}
            {currentTour.suggestedContribution}.
          </p>
        )}
        {free &&
          (!currentTour.suggestedContribution ||
            currentTour.freeGroupMode !== "none") && (
            <p className="quick-booking-note">{freeTourNote(currentTour)}</p>
          )}
        {paidInCzk && (
          <p className="quick-booking-note">
            Gli importi in euro sono indicativi per i pagamenti in contanti. Il
            cambio applicato ai pagamenti con carta può variare.
          </p>
        )}
        {currentTour.fareRequirements && (
          <p className="quick-booking-note">{currentTour.fareRequirements}</p>
        )}
        <p className="quick-booking-note">{cancellationNote(currentTour)}</p>
        {deadline && <p className="quick-booking-note">{deadline}</p>}
      </div>
    </>
  );
  if (inline)
    return <div className="quick-booking quick-booking-inline">{content}</div>;
  return (
    <dialog
      ref={dialog}
      className={`quick-booking${sheet ? " quick-booking-sheet" : ""}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      {content}
    </dialog>
  );
}
