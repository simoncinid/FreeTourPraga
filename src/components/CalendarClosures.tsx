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
  const [from, setFrom] = useState(() =>
    pragueLocal(new Date().toISOString()).slice(0, 10),
  );
  const [to, setTo] = useState(from);
  const [closed, setClosed] = useState(true);
  const [month, setMonth] = useState(from.slice(0, 7));
  const [year, monthNumber] = month.split("-").map(Number);
  const offset =
    (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const affected = bookings.filter((b) => b.date >= from && b.date <= to);
  return (
    <div className="grid gap-6">
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Calendario delle chiusure</h2>
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
        <p className="text-sm">
          Seleziona un giorno per chiudere o riaprire tutti i tour.
        </p>
        <div className="closure-calendar">
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
                onClick={() =>
                  void save({ from: date, to: date, closed: !isClosed })
                }
              >
                <strong>{index + 1}</strong>
                <small>{isClosed ? "Chiuso" : "Aperto"}</small>
                {reservations > 0 && <small>{reservations} pren.</small>}
              </button>
            );
          })}
        </div>
      </div>
      <form
        className="card grid gap-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void save({ from, to, closed });
        }}
      >
        <h2 className="display-md">Chiusure per tutti i tour</h2>
        <p>
          Chiudi una giornata o un periodo alle nuove prenotazioni. Gestisci
          giorni settimanali, orari e posti nella scheda di ciascun tour.
        </p>
        <div className="form-grid">
          <label>
            Dal
            <input
              className="text-input"
              type="date"
              required
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (e.target.value > to) setTo(e.target.value);
              }}
            />
          </label>
          <label>
            Al
            <input
              className="text-input"
              type="date"
              required
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label>
            Operazione
            <select
              className="text-input"
              value={closed ? "close" : "open"}
              onChange={(e) => setClosed(e.target.value === "close")}
            >
              <option value="close">Chiudi tutti i tour</option>
              <option value="open">Riapri tutti i tour</option>
            </select>
          </label>
        </div>
        {closed && affected.length > 0 && (
          <p role="status">
            Nel periodo ci sono {affected.length} prenotazioni attive per{" "}
            {affected.reduce((n, b) => n + b.guests, 0)} persone. La chiusura
            blocca nuove prenotazioni; gestisci quelle esistenti dalla sezione
            Prenotazioni.
          </p>
        )}
        <button className="button-primary" disabled={busy}>
          {closed ? "Chiudi il periodo" : "Riapri il periodo"}
        </button>
      </form>
      <div className="card grid gap-3 p-6">
        <h2 className="display-md">Giornate chiuse</h2>
        {!closedDates.length && <p>Nessuna chiusura impostata.</p>}
        {closedDates.map((date) => (
          <div
            key={date}
            className="flex items-center justify-between gap-4 border-b py-2"
          >
            <span>
              {new Date(`${date}T12:00:00Z`).toLocaleDateString("it-IT", {
                timeZone: "Europe/Prague",
                dateStyle: "full",
              })}
            </span>
            <button
              disabled={busy}
              className="underline"
              onClick={() => void save({ from: date, to: date, closed: false })}
            >
              Riapri
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
