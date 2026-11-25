import type { Tour } from "@/lib/types";
import { categoriesFor } from "@/lib/participant-pricing";
import { formatMoney } from "@/lib/format";
import { RichContent } from "./RichContent";
import { isFreeTour } from "@/lib/tour-rules";

function priceLabel(tour: Tour, priceCents: number) {
  if (priceCents !== 0) return formatMoney(priceCents, tour.currency);
  return isFreeTour(tour) ? "Offerta libera" : "Gratis";
}

export function TourFacts({
  tour,
  compact = false,
  pricesOnly = false,
  priceLabelText = "Prezzi per persona",
}: {
  tour: Tour;
  compact?: boolean;
  pricesOnly?: boolean;
  priceLabelText?: string;
}) {
  return (
    <div className="tour-facts body-md grid gap-2">
      {!pricesOnly && (
        <ul className="grid list-disc gap-2 pl-5">
          {tour.operatingDays && (
            <li>
              <strong>Giorni</strong> · {tour.operatingDays}
            </li>
          )}
          {tour.departureTime && (
            <li>
              <strong>Partenza</strong> · {tour.departureTime}
              {tour.arrivalMinutes !== undefined &&
                ` · Presentarsi ${tour.arrivalMinutes} minuti prima`}
            </li>
          )}
          {tour.seasonalOffers?.map((offer) => (
        <p key={offer.id}>
          <strong>Offerta:</strong> −{offer.percent}% dal{" "}
          {offer.from.split("-").reverse().join("/")} al{" "}
          {offer.to.split("-").reverse().join("/")}
        </p>
      ))}
      {tour.minParticipants ? (
        <p>
          <strong>Minimo partecipanti:</strong> {tour.minParticipants}
        </p>
      ) : null}
      {tour.petsAllowed !== undefined && (
        <p>
          <strong>Animali:</strong>{" "}
          {tour.petsAllowed ? "Ammessi" : "Non ammessi"}
        </p>
      )}
      {tour.architecturalBarriers !== undefined && (
        <p>
          <strong>Accessibilità:</strong>{" "}
          {tour.architecturalBarriers
            ? "Sono presenti barriere architettoniche"
            : "Nessuna barriera architettonica segnalata"}
        </p>
      )}
      {(tour.schedule?.enabled || !!tour.calendarRules?.length) && (
            <li>Giorni e orari disponibili nel calendario di prenotazione.</li>
          )}
          {!compact && (
            <>
              {tour.inclusions.map((item, index) => (
                <li key={`included-${index}`}>
                  {tour.formattedCopy?.inclusions?.[index] ? (
                    <RichContent html={tour.formattedCopy.inclusions[index]!} />
                  ) : (
                    item
                  )}
                </li>
              ))}
              {tour.safetyNotes.map((item, index) => (
                <li key={`note-${index}`}>
                  {tour.formattedCopy?.safetyNotes?.[index] ? (
                    <RichContent
                      html={tour.formattedCopy.safetyNotes[index]!}
                    />
                  ) : (
                    item
                  )}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
      <details>
        <summary className="cursor-pointer">
          {priceLabelText || "Prezzi per persona"}
        </summary>
        <ul>
          {categoriesFor(tour).map((c) => (
            <li key={c.id}>
              {`${c.label}: ${priceLabel(tour, c.priceCents)}${
                c.description ? ` · ${c.description}` : ""
              }`}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
