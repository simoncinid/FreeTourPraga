import type { CalendarRule } from "../types";
import type { CatalogTour } from "./model";
import { pragueLocal } from "./time";
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
    if (rule.action === "close") slot.closed = true;
    else {
      if (rule.action === "open") slot.closed = false;
      if (rule.capacity !== undefined)
        slot.capacity = Math.max(slot.reserved, rule.capacity);
    }
  }
}
