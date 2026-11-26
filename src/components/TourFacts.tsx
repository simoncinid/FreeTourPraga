import type { Tour } from "@/lib/types";
import {
  categoriesFor,
  categoryTitle,
  estimatedEuroPrice,
} from "@/lib/participant-pricing";
import { formatMoney } from "@/lib/format";
import { RichContent } from "./RichContent";
import { isFreeTour } from "@/lib/tour-rules";

function priceLabel(
  tour: Tour,
  priceCents: number,
  estimatedEuroCents?: number,
) {
  if (priceCents === 0)
    return isFreeTour(tour) ? "Offerta libera" : "Gratis";
  const main = formatMoney(priceCents, tour.currency);
  const euro =
    tour.currency === "CZK" ? estimatedEuroPrice(estimatedEuroCents) : "";
  return euro ? `${main} - ${euro}` : main;
}

export function TourFacts({
  tour,
  compact = false,
  pricesOnly = false,
  section = "all",
}: {
  tour: Tour;
  compact?: boolean;
  pricesOnly?: boolean;
  section?: "all" | "ops" | "prices";
}) {
  const prices = (
    <ul aria-label="Prezzi per persona">
      {categoriesFor(tour).map((c) => (
        <li key={c.id}>
          {`${categoryTitle(c.label, c.minAge, c.maxAge)}: ${priceLabel(
            tour,
            c.priceCents,
            c.estimatedEuroCents,
          )}`}
        </li>
      ))}
    </ul>
  );

  const showOps = !pricesOnly && section !== "prices";
  const showPrices = section !== "ops";
  return (
    <div className="tour-facts body-md grid gap-2">
      {showOps && (
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
      {showPrices ? prices : null}
    </div>
  );
}
