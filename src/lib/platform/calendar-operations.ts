import { randomUUID } from "node:crypto";
import type { CalendarRule } from "../types";
import type { CatalogTour, PlatformState } from "./model";
import { generateScheduledSlots } from "./scheduling";
import { pragueInstant, pragueLocal } from "./time";
import { HttpError } from "./security";
import { applyCalendarRule } from "./calendar-rules";
export function calendarOperation(
  s: PlatformState,
  op: Omit<CalendarRule, "id"> & { tourIds: string[] },
) {
  const targets = op.tourIds.map((id) => s.tours.find((t) => t.id === id));
  if (targets.some((t) => !t)) throw new HttpError(404, "Tour non trovato");
  // Validate every target before changing any inventory.
  for (const tour of targets as CatalogTour[])
    for (const slot of tour.slots) {
      const date = pragueLocal(slot.startsAt).slice(0, 10),
        time = pragueLocal(slot.startsAt).slice(11, 16);
      if (
        date >= op.from &&
        date <= op.to &&
        op.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()) &&
        (!op.times.length || op.times.includes(time)) &&
        op.capacity !== undefined &&
        slot.reserved > op.capacity
      )
        throw new HttpError(
          409,
          `Capienza inferiore ai ${slot.reserved} posti prenotati per ${tour.title} il ${date} ${time}`,
        );
    }
  // Turn a legacy platform-wide closure into explicit tour closures before reopening
  // only the selected tours/times. Other tours stay closed on that date.
  if (op.action === "open") {
    const legacyDates = (s.closedDates ?? []).filter(
      (date) =>
        date >= op.from &&
        date <= op.to &&
        op.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()),
    );
    for (const date of legacyDates)
      for (const tour of s.tours) {
        const legacy: CalendarRule = {
          id: randomUUID(),
          from: date,
          to: date,
          weekdays: [0, 1, 2, 3, 4, 5, 6],
          times: [],
          action: "close",
        };
        tour.calendarRules = [...(tour.calendarRules ?? []), legacy];
        applyCalendarRule(tour, legacy);
      }
    s.closedDates = (s.closedDates ?? []).filter(
      (date) => !legacyDates.includes(date),
    );
  }
  for (const tour of targets as CatalogTour[]) {
    const rule: CalendarRule = {
      id: randomUUID(),
      from: op.from,
      to: op.to,
      weekdays: op.weekdays,
      times: op.times,
      action: op.action,
      capacity: op.capacity,
    };
    if ((tour.calendarRules?.length ?? 0) >= 1000)
      throw new HttpError(409, "Limite regole calendario raggiunto");
    tour.calendarRules = [...(tour.calendarRules ?? []), rule];
    if (op.action === "open" && op.times.length) {
      const cursor = new Date(`${op.from}T12:00:00Z`);
      while (cursor.toISOString().slice(0, 10) <= op.to) {
        const date = cursor.toISOString().slice(0, 10);
        if (op.weekdays.includes(cursor.getUTCDay()))
          for (const time of op.times) {
            const startsAt = pragueInstant(`${date}T${time}`);
            if (!tour.slots.some((slot) => slot.startsAt === startsAt))
              tour.slots.push({
                id: `extra:${tour.id}:${date}:${time}`,
                tourId: tour.id,
                startsAt,
                endsAt: new Date(
                  Date.parse(startsAt) + tour.durationMinutes * 60000,
                ).toISOString(),
                capacity: op.capacity!,
                reserved: 0,
              });
          }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    generateScheduledSlots(tour);
    // These rules also apply to tours without a recurring base schedule.
    for (const saved of tour.calendarRules) applyCalendarRule(tour, saved);
  }
}
