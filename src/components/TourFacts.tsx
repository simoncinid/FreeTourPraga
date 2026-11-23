import type { Tour } from "@/lib/types";
import { categoriesFor } from "@/lib/participant-pricing";
import { formatMoney } from "@/lib/format";
import { isFreeTour } from "@/lib/tour-rules";

function priceLabel(tour: Tour, priceCents: number) {
  if (priceCents !== 0) return formatMoney(priceCents, tour.currency);
  return isFreeTour(tour) ? "Offerta libera" : "Gratis";
}

export function TourFacts({
  tour,
  compact = false,
}: {
  tour: Tour;
  compact?: boolean;
}) {
  return (
    <div className="tour-facts body-md grid gap-2">
      <p>
        <strong>Giorni:</strong> {tour.operatingDays || "—"}
      </p>
      <p>
        <strong>Partenza:</strong>{" "}
        {tour.departureTime
          ? `${tour.departureTime}${
              tour.arrivalMinutes !== undefined
                ? ` · Presentarsi ${tour.arrivalMinutes} minuti prima`
                : ""
            }`
          : "—"}
      </p>
      {(tour.schedule?.enabled || !!tour.calendarRules?.length) && (
        <p className="text-sm">
          Giorni e orari disponibili nel calendario di prenotazione; possono
          variare secondo la data.
        </p>
      )}
      {!compact && (
        <>
          <p>
            <strong>Include:</strong>{" "}
            {tour.inclusions.length > 0 ? tour.inclusions.join(" · ") : "—"}
          </p>
          {tour.safetyNotes.map((n, i) => (
            <p key={i} data-tour-field={`safetyNotes.${i}`}>
              {n}
            </p>
          ))}
        </>
      )}
      <details>
        <summary>Prezzi per persona</summary>
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
