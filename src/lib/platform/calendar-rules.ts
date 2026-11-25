import type { CalendarRule } from "../types";
import type { CatalogTour } from "./model";
import { pragueLocal } from "./time";
/** Giorno singolo dopo le eccezioni di periodo: il giorno vince sempre sulla regola più larga. */
export function orderedCalendarRules(rules: CalendarRule[] = []) {
  return [...rules].sort(
    (a, b) => Number(a.from === a.to) - Number(b.from === b.to),
  );
}
export function applyCalendarRule(tour: CatalogTour, rule: CalendarRule) {
  for (const slot of tour.slots) {
    const local = pragueLocal(slot.startsAt),
      date = local.slice(0, 10),
      time = local.slice(11, 16);
    if (
      date < rule.from ||
      date > rule.to ||
      !rule.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()) ||
      (rule.times.length && !rule.times.includes(time))
    )
      continue;
    if (!slot.id.startsWith("schedule:") && !slot.id.startsWith("extra:"))
      slot.calendarBase ??= { capacity: slot.capacity, closed: slot.closed };
    if (rule.action === "close" || rule.action === "remove") {
      slot.closed = true;
      if (rule.action === "remove") slot.removed = true;
    } else {
      if (rule.action === "open") {
        slot.closed = false;
        delete slot.removed;
      }
      if (rule.capacity !== undefined)
        slot.capacity = Math.max(slot.reserved, rule.capacity);
    }
  }
}
