import { paymentMethodsFor } from "../tour-payments";
import { tourHeadlinePrice } from "../participant-pricing";
import { applyCalendarRule } from "./calendar-rules";
import type { CatalogTour, PlatformState } from "./model";
import { pragueInstant, pragueLocal } from "./time";

export function isClosed(
  state: Pick<PlatformState, "closedDates">,
  startsAt: string,
) {
  return (state.closedDates ?? []).includes(pragueLocal(startsAt).slice(0, 10));
}
export function isTourClosed(tour: CatalogTour, startsAt: string) {
  const local = pragueLocal(startsAt);
  let closed = (tour.closures ?? []).some(
    (closure) =>
      closure.date === local.slice(0, 10) &&
      (!closure.times.length || closure.times.includes(local.slice(11, 16))),
  );
  for (const rule of tour.calendarRules ?? []) {
    const date = local.slice(0, 10),
      time = local.slice(11, 16);
    if (
      date >= rule.from &&
      date <= rule.to &&
      rule.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()) &&
      (!rule.times.length || rule.times.includes(time))
    ) {
      if (rule.action === "open") closed = false;
      if (rule.action === "close") closed = true;
    }
  }
  return closed;
}
/** Deterministic IDs keep reservations stable across reads and schedule refreshes. */
export function generateScheduledSlots(tour: CatalogTour, now = Date.now()) {
  for (const slot of tour.slots)
    if (isTourClosed(tour, slot.startsAt)) slot.closed = true;
  const schedule = tour.schedule;
  if (!schedule?.enabled) {
    for (const rule of tour.calendarRules ?? []) applyCalendarRule(tour, rule);
    return;
  }
  const today = pragueLocal(new Date(now).toISOString()).slice(0, 10);
  const start = schedule.from > today ? schedule.from : today;
  const cursor = new Date(`${start}T12:00:00Z`);
  const existing = new Map(tour.slots.map((slot) => [slot.id, slot]));
  const byStart = new Map(tour.slots.map((slot) => [slot.startsAt, slot]));
  for (
    let offset = 0;
    offset < 366;
    offset++, cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    if (date > schedule.to) break;
    if (!schedule.weekdays.includes(cursor.getUTCDay())) continue;
    for (const time of schedule.times) {
      const id = `schedule:${tour.id}:${date}:${time}`;
      let startsAt: string;
      try {
        startsAt = pragueInstant(`${date}T${time}`);
      } catch {
        continue;
      }
      const previous = existing.get(id) ?? byStart.get(startsAt);
      if (previous) {
        // Existing inventory may contain manual closures/capacity overrides.
        // Only a saved explicit opening rule may reopen it.
        previous.capacity = Math.max(previous.reserved, previous.capacity);
        if (!previous.reserved)
          previous.endsAt = new Date(
            Date.parse(startsAt) + tour.durationMinutes * 60000,
          ).toISOString();
        continue;
      }
      tour.slots.push({
        id,
        tourId: tour.id,
        startsAt,
        endsAt: new Date(
          Date.parse(startsAt) + tour.durationMinutes * 60000,
        ).toISOString(),
        capacity: schedule.capacity,
        reserved: 0,
      });
    }
  }
  for (const rule of tour.calendarRules ?? []) applyCalendarRule(tour, rule);
  tour.slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
export function publicTour(state: PlatformState, tour: CatalogTour) {
  const price = tourHeadlinePrice(tour);
  const visible = { ...tour };
  delete visible.commissionRules;
  delete visible.commissionPackageWith;
  delete visible.paymentInstructions;
  return {
    ...visible,
    paymentMethods: paymentMethodsFor(tour),
    ...(paymentMethodsFor(tour).includes("bank_transfer")
      ? { paymentInstructions: tour.paymentInstructions }
      : {}),
    ...scheduleSummary(
      tour,
      Date.now() + tour.bookingCutoffHours * 3600000,
      state.closedDates,
    ),
    basePriceCents: price.priceCents,
    isFreeTour: price.isFree,
    priceLabel: price.showFrom ? "" : price.text,
    cancellationHours:
      tour.cancellationHours ?? state.settings.cancellationHours,
    lateRefundPercent:
      tour.lateRefundPercent ?? state.settings.lateRefundPercent,
    slots: tour.operationalReviewRequired
      ? []
      : tour.slots
          .filter(
            (slot) =>
              !slot.closed &&
              !isTourClosed(tour, slot.startsAt) &&
              !isClosed(state, slot.startsAt) &&
              Date.parse(slot.startsAt) >
                Date.now() + tour.bookingCutoffHours * 3600000,
          )
          .map((slot) => ({ ...slot, capacity: slot.capacity })),
  };
}

/** Derive public schedule copy from bookable departures, including seasonal overrides. */
export function scheduleSummary(
  tour: CatalogTour,
  now = Date.now(),
  closedDates: string[] = [],
) {
  const future = tour.slots.filter(
    (s) =>
      !closedDates.includes(pragueLocal(s.startsAt).slice(0, 10)) &&
      !s.closed &&
      !isTourClosed(tour, s.startsAt) &&
      Date.parse(s.startsAt) > now,
  );
  if (
    !tour.slots.length &&
    !tour.schedule?.enabled &&
    !tour.calendarRules?.length
  )
    return {};
  const days = [
    ...new Set(
      future.map((s) =>
        new Date(
          `${pragueLocal(s.startsAt).slice(0, 10)}T12:00:00Z`,
        ).getUTCDay(),
      ),
    ),
  ];
  const names = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  return {
    operatingDays:
      days.length === 7
        ? "Tutti i giorni"
        : days.length
          ? [1, 2, 3, 4, 5, 6, 0]
              .filter((d) => days.includes(d))
              .map((d) => names[d])
              .join(", ")
          : "Nessuna partenza disponibile",
    departureTime: [
      ...new Set(future.map((s) => pragueLocal(s.startsAt).slice(11, 16))),
    ]
      .sort()
      .join(", "),
  };
}
