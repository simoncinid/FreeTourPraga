import type { PlatformState } from "./platform/model";
export function partnerStats(s: PlatformState, from: string, to: string) {
  return (s.partners ?? []).map((p) => {
    const rows = (s.partnerClicks ?? []).filter(
      (c) => c.partnerId === p.id && c.day >= from && c.day <= to,
    );
    return {
      id: p.id,
      name: p.name,
      deleted: !!p.deleted,
      clicks: rows.reduce((n, c) => n + c.count, 0),
      uniqueVisitorDays: rows.filter((c) => c.visitor).length,
      unmeasuredClicks: rows
        .filter((c) => !c.visitor)
        .reduce((n, c) => n + c.count, 0),
      daily: [...new Set(rows.map((c) => c.day))].sort().map((day) => ({
        day,
        clicks: rows
          .filter((c) => c.day === day)
          .reduce((n, c) => n + c.count, 0),
        uniqueVisitorDays: rows.filter((c) => c.day === day && c.visitor)
          .length,
      })),
    };
  });
}
