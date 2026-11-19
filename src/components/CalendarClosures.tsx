"use client";

import { useState } from "react";
import { pragueLocal } from "@/lib/platform/time";

export function CalendarClosures({
  closedDates,
  bookings,
  busy,
  save,
}: {
  closedDates: string[];
  bookings: { date: string; guests: number }[];
  busy: boolean;
  save: (body: {
    from: string;
    to: string;
    closed: boolean;
  }) => Promise<unknown>;
}) {
  const [month, setMonth] = useState(() =>
    pragueLocal(new Date().toISOString()).slice(0, 7),
  );
  const [year, monthNumber] = month.split("-").map(Number);
  const offset =
    (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const weeks = Math.ceil((offset + days) / 7);

  async function toggleDay(date: string, isClosed: boolean) {
    const dayBookings = bookings.filter((b) => b.date === date);
    if (!isClosed && dayBookings.length > 0) {
      const guests = dayBookings.reduce((n, b) => n + b.guests, 0);
      const ok = window.confirm(
        `Il ${date} ci sono ${dayBookings.length} prenotazioni (${guests} persone).\n` +
          `Chiudere blocca solo le nuove prenotazioni; quelle esistenti restano da gestire in Prenotazioni.\n\n` +
          `Chiudere comunque questa data?`,
      );
      if (!ok) return;
    }
    await save({ from: date, to: date, closed: !isClosed });
  }

  return (
    <div className="closure-calendar-shell">
      <div className="card closure-calendar-card">
        <div className="closure-calendar-toolbar">
          <div className="closure-calendar-copy">
            <h2 className="display-md">Calendario delle chiusure</h2>
            <p className="closure-calendar-hint text-sm">
              Clicca un giorno per chiudere o riaprire tutti i tour. Le
              prenotazioni già fatte non vengono cancellate.
            </p>
          </div>
          <label>
            Mese
            <input
              type="month"
              required
              className="text-input"
              value={month}
              onChange={(e) => {
                if (e.target.value) setMonth(e.target.value);
              }}
            />
          </label>
        </div>
        <div
          className="closure-calendar"
          style={{ gridTemplateRows: `auto repeat(${weeks}, minmax(0, 1fr))` }}
        >
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
            <strong key={day}>{day}</strong>
          ))}
          {Array.from({ length: offset }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, "0")}`;
            const isClosed = closedDates.includes(date);
            const reservations = bookings.filter((b) => b.date === date).length;
            return (
              <button
                type="button"
                key={date}
                disabled={busy}
                aria-pressed={isClosed}
                aria-label={`${isClosed ? "Riapri" : "Chiudi"} tutti i tour il ${date}`}
                title={
                  isClosed
                    ? "Clicca per riaprire"
                    : "Clicca per chiudere alle nuove prenotazioni"
                }
                onClick={() => void toggleDay(date, isClosed)}
              >
                <strong>{index + 1}</strong>
                <small>{isClosed ? "Chiuso" : "Aperto"}</small>
                {reservations > 0 && <small>{reservations} pren.</small>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
