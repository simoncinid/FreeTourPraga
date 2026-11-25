import { randomUUID } from "node:crypto";
import type { CalendarRule } from "../types";
import type { CatalogTour, PlatformState } from "./model";
import { generateScheduledSlots, onBaseSchedule } from "./scheduling";
import { pragueInstant, pragueLocal } from "./time";
import { HttpError } from "./security";
import { applyCalendarRule } from "./calendar-rules";
import { noteLowSeats } from "./booking";

type Operation = {
  tourIds: string[];
  from: string;
  to: string;
  weekdays: number[];
  times: string[];
  action: "open" | "close" | "capacity" | "restore" | "remove";
  capacity?: number;
  ruleId?: string;
};

function shiftDate(iso: string, days: number) {
  const cursor = new Date(`${iso}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}

function knownTimes(tour: CatalogTour) {
  const times = new Set<string>(tour.schedule?.times ?? []);
  for (const slot of tour.slots)
    times.add(pragueLocal(slot.startsAt).slice(11, 16));
  for (const rule of tour.calendarRules ?? [])
    for (const time of rule.times) times.add(time);
  return [...times];
}

function hits(
  op: Pick<Operation, "from" | "to" | "weekdays" | "times">,
  date: string,
  time: string,
) {
  return (
    date >= op.from &&
    date <= op.to &&
    op.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()) &&
    (!op.times.length || op.times.includes(time))
  );
}

/** Toglie dal periodo scelto la parte di regola che si sovrappone, e conserva il resto. */
function subtractRule(
  tour: CatalogTour,
  rule: CalendarRule,
  op: Operation,
): CalendarRule[] {
  if (rule.to < op.from || rule.from > op.to) return [rule];
  const weekHit = rule.weekdays.filter((day) => op.weekdays.includes(day));
  if (!weekHit.length) return [rule];
  const universe = rule.times.length ? rule.times : knownTimes(tour);
  const opTimes = op.times.length ? op.times : universe;
  if (!universe.some((time) => opTimes.includes(time))) return [rule];
  const pieces: CalendarRule[] = [];
  const push = (partial: Partial<CalendarRule>) =>
    pieces.push({ ...rule, ...partial, id: randomUUID() });
  const beforeTo = shiftDate(op.from, -1);
  if (rule.from <= beforeTo) push({ to: beforeTo });
  const afterFrom = shiftDate(op.to, 1);
  if (afterFrom <= rule.to) push({ from: afterFrom });
  const midFrom = rule.from > op.from ? rule.from : op.from;
  const midTo = rule.to < op.to ? rule.to : op.to;
  if (midFrom <= midTo) {
    const keepDays = rule.weekdays.filter((day) => !op.weekdays.includes(day));
    if (keepDays.length)
      push({ from: midFrom, to: midTo, weekdays: keepDays });
    const keepTimes = universe.filter((time) => !opTimes.includes(time));
    if (keepTimes.length)
      push({
        from: midFrom,
        to: midTo,
        weekdays: weekHit,
        times: keepTimes,
      });
  }
  return pieces;
}

export function calendarOperation(
  s: PlatformState,
  op: Operation,
  actor = "staff",
) {
  const targets = op.tourIds.map((id) => s.tours.find((t) => t.id === id));
  if (targets.some((t) => !t)) throw new HttpError(404, "Tour non trovato");
  const warnings: string[] = [];
  const low: string[] = [];
  const bookedSlots = new Set(s.bookings.map((booking) => booking.slotId));
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
          actor,
          at: new Date().toISOString(),
        };
        tour.calendarRules = [...(tour.calendarRules ?? []), legacy];
        applyCalendarRule(tour, legacy);
      }
    s.closedDates = (s.closedDates ?? []).filter(
      (date) => !legacyDates.includes(date),
    );
  }
  for (const tour of targets as CatalogTour[]) {
    const previous = op.ruleId
      ? tour.calendarRules?.find((rule) => rule.id === op.ruleId)
      : undefined;
    if (op.ruleId && !previous) throw new HttpError(404, "Regola non trovata");
    const reset = op.action === "restore" ? op : previous;
    if (reset) {
      tour.calendarRules = previous
        ? (tour.calendarRules ?? []).filter((rule) => rule.id !== previous.id)
        : (tour.calendarRules ?? []).flatMap((rule) => subtractRule(tour, rule, op));
      tour.slots = tour.slots.flatMap((slot) => {
        const local = pragueLocal(slot.startsAt);
        const date = local.slice(0, 10);
        const time = local.slice(11, 16);
        if (!hits(reset, date, time)) return [slot];
        if (!onBaseSchedule(tour, date, time)) {
          if (!slot.id.startsWith("extra:") && !slot.id.startsWith("schedule:")) {
            slot.capacity = Math.max(slot.reserved, slot.calendarBase?.capacity ?? slot.capacity);
            slot.closed = slot.calendarBase?.closed ?? false;
            delete slot.removed;
            delete slot.calendarBase;
            return [slot];
          }
          if (tour.calendarRules?.some((rule) =>
            rule.action === "open" && rule.times.length > 0 && hits(rule, date, time),
          )) return [slot];
          if (op.action === "open" && op.times.length > 0 && hits(op, date, time))
            return [slot];
          if (slot.reserved > 0 || bookedSlots.has(slot.id)) {
            slot.closed = true;
            slot.removed = true;
            if (slot.reserved > 0)
              warnings.push(
                `${tour.title} ${date} ${time}: orario fuori programmazione con ${slot.reserved} posti prenotati. Le nuove prenotazioni sono bloccate.`,
              );
            return [slot];
          }
          return [];
        }
        slot.capacity = Math.max(slot.reserved, tour.schedule!.capacity);
        slot.closed = false;
        delete slot.removed;
        delete slot.calendarBase;
        return [slot];
      });
    }
    if (op.action !== "restore") {
      if ((tour.calendarRules?.length ?? 0) >= 1000)
        throw new HttpError(409, "Limite regole calendario raggiunto");
      const rule: CalendarRule = {
        id: previous?.id ?? randomUUID(),
        from: op.from,
        to: op.to,
        weekdays: op.weekdays,
        times: op.times,
        action: op.action,
        capacity: op.capacity,
        actor,
        at: new Date().toISOString(),
      };
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
    }
    generateScheduledSlots(tour);
    tour.calendarLog = [
      {
        at: new Date().toISOString(),
        actor,
        from: op.from,
        to: op.to,
      },
      ...(previous && (previous.from !== op.from || previous.to !== op.to)
        ? [{ at: new Date().toISOString(), actor, from: previous.from, to: previous.to }]
        : []),
      ...(tour.calendarLog ?? []),
    ].slice(0, 40);
    for (const slot of tour.slots) {
      const local = pragueLocal(slot.startsAt);
      const date = local.slice(0, 10);
      const time = local.slice(11, 16);
      if (!hits(op, date, time)) continue;
      const left = slot.capacity - slot.reserved;
      if (op.capacity !== undefined && slot.reserved > op.capacity && left <= 0)
        warnings.push(
          `${tour.title} ${date} ${time}: ${slot.reserved} posti prenotati restano confermati. Le nuove prenotazioni sono bloccate.`,
        );
      if (slot.closed && slot.reserved > 0 && (op.action === "close" || op.action === "remove"))
        warnings.push(
          `${tour.title} ${date} ${time}: chiusura con ${slot.reserved} posti prenotati, che restano invariati.`,
        );
      if (slot.closed) continue;
      if (left > 0 && left <= Math.max(2, Math.ceil(slot.capacity * 0.25)))
        low.push(
          `${tour.title}: restano ${left} posti su ${slot.capacity} il ${local.replace("T", " ").slice(0, 16)}`,
        );
    }
  }
  noteLowSeats(s, low.slice(0, 20));
  return { warnings };
}
