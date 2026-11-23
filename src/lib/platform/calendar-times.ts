/** Parse flexible calendar time input into HH:mm values. Empty / "tutti" → all times. */

const TIME_RE = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;

function normalizeTime(raw: string): string | null {
  const match = raw.trim().match(TIME_RE);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseCalendarTimes(
  raw: string,
): { ok: true; times: string[] } | { ok: false; error: string } {
  const text = raw.trim().replace(/\u00a0/g, " ");
  if (!text || /^tutti\.?$/i.test(text)) return { ok: true, times: [] };

  const parts = text
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return { ok: true, times: [] };

  const times = new Set<string>();
  for (const part of parts) {
    const rangeParts = part.split(/\s*[-–—]\s*/).map((p) => p.trim());
    if (rangeParts.length === 1) {
      const time = normalizeTime(rangeParts[0]);
      if (!time) return { ok: false, error: `Orario non valido: “${part}”` };
      times.add(time);
      continue;
    }
    if (rangeParts.length !== 2) {
      return { ok: false, error: `Orario non valido: “${part}”` };
    }
    const start = normalizeTime(rangeParts[0]);
    const end = normalizeTime(rangeParts[1]);
    if (!start || !end) {
      return { ok: false, error: `Intervallo non valido: “${part}”` };
    }
    let cursor = toMinutes(start);
    const last = toMinutes(end);
    if (cursor > last) {
      return { ok: false, error: `Intervallo invertito: “${part}”` };
    }
    while (cursor <= last) {
      times.add(fromMinutes(cursor));
      cursor += 30;
    }
  }

  return { ok: true, times: [...times].sort() };
}
