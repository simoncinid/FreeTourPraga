"use client";

import { useState } from "react";
import type { CatalogTour } from "@/lib/platform/model";
import { pragueLocal } from "@/lib/platform/time";
import { isFreeTour } from "@/lib/tour-rules";

function formatClosureDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "full",
  });
}

export function TourOperationsEditor({
  tour: t,
  change,
  closedDates = [],
}: {
  tour: CatalogTour;
  change: (key: keyof CatalogTour, value: unknown) => void;
  closedDates?: string[];
}) {
  const today = pragueLocal(new Date().toISOString()).slice(0, 10);
  const [draftDate, setDraftDate] = useState(today);
  const [draftTimes, setDraftTimes] = useState("");
  const [adding, setAdding] = useState(false);
  const schedule = t.schedule ?? {
    enabled: false,
    from: today,
    to: `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`,
    weekdays: [1, 2, 3, 4, 5, 6, 0],
    times: ["10:00"],
    capacity: Math.min(t.maxGuests, 25),
  };
  const setSchedule = (value: Partial<typeof schedule>) =>
    change("schedule", { ...schedule, ...value });
  return (
    <>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Tipo di tour e percorso</h2>
        <label>
          Tipo di tour
          <select
            className="text-input"
            value={isFreeTour(t) ? "free" : "paid"}
            onChange={(e) => {
              const free = e.target.value === "free";
              change("isFreeTour", free);
              change("priceLabel", free ? "Offerta libera" : "");
              if (free) {
                change("basePriceCents", 0);
                change("childPriceCents", 0);
                change("infantPriceCents", 0);
              }
            }}
          >
            <option value="paid">A pagamento</option>
            <option value="free">
              Free tour · offerta libera fino a 6 persone
            </option>
          </select>
        </label>
        <p className="text-sm">
          Free tour: oltre 6 partecipanti si applicano 12 € a persona. La
          capienza massima è 25 persone.
        </p>
        <div className="form-grid">
          <label>
            Tipo di percorso
            <input
              className="text-input"
              value={t.walkingLabel ?? "A piedi"}
              maxLength={80}
              onChange={(e) => change("walkingLabel", e.target.value)}
            />
          </label>
          <label>
            Intensità del percorso
            <select
              className="text-input"
              value={t.walkingDifficulty}
              onChange={(e) =>
                change("walkingDifficulty", Number(e.target.value))
              }
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} su 5
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Programmazione settimanale</h2>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => setSchedule({ enabled: e.target.checked })}
          />
          Programma le partenze ricorrenti
        </label>
        <p className="text-sm">
          Scegli giorni e orari di Praga. Le partenze dei prossimi 90 giorni
          vengono aggiornate automaticamente. Le chiusure del calendario
          generale valgono per tutti i tour; le prenotazioni esistenti restano
          conservate.
        </p>
        {schedule.enabled && (
          <>
            <div className="form-grid">
              <label>
                Dal
                <input
                  className="text-input"
                  type="date"
                  required
                  value={schedule.from}
                  onChange={(e) => setSchedule({ from: e.target.value })}
                />
              </label>
              <label>
                Al
                <input
                  className="text-input"
                  type="date"
                  required
                  min={schedule.from}
                  value={schedule.to}
                  onChange={(e) => setSchedule({ to: e.target.value })}
                />
              </label>
              <label>
                Posti per partenza
                <input
                  className="text-input"
                  type="number"
                  required
                  min={1}
                  max={25}
                  value={schedule.capacity}
                  onChange={(e) =>
                    setSchedule({ capacity: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <fieldset>
              <legend className="mb-3 font-semibold">
                Giorni della settimana
              </legend>
              <div className="flex flex-wrap gap-4">
                {[
                  "Domenica",
                  "Lunedì",
                  "Martedì",
                  "Mercoledì",
                  "Giovedì",
                  "Venerdì",
                  "Sabato",
                ].map((day, index) => (
                  <label key={day} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={schedule.weekdays.includes(index)}
                      onChange={(e) =>
                        setSchedule({
                          weekdays: e.target.checked
                            ? [...schedule.weekdays, index]
                            : schedule.weekdays.filter((d) => d !== index),
                        })
                      }
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-3">
              <legend>Orari di partenza</legend>
              {schedule.times.map((time, index) => (
                <div key={index} className="flex items-center gap-4">
                  <input
                    aria-label={`Orario ${index + 1}`}
                    type="time"
                    className="text-input"
                    value={time}
                    required
                    onChange={(e) =>
                      setSchedule({
                        times: schedule.times.map((v, i) =>
                          i === index ? e.target.value : v,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="underline"
                    disabled={schedule.times.length === 1}
                    onClick={() =>
                      setSchedule({
                        times: schedule.times.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button-secondary"
                disabled={schedule.times.length >= 10}
                onClick={() =>
                  setSchedule({ times: [...schedule.times, "14:00"] })
                }
              >
                Aggiungi orario
              </button>
            </fieldset>
          </>
        )}
      </div>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Chiusure di questo tour</h2>
        <p className="text-sm">
          Chiudi una data intera o solo alcuni orari, ad esempio il pomeriggio
          di Natale. Per cambiare una chiusura, eliminala e aggiungila di
          nuovo. Salva il tour per applicare le modifiche specifiche.
        </p>
        {closedDates.length > 0 && (
          <div className="grid gap-3">
            {closedDates.map((date) => (
              <div
                key={`global-${date}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
              >
                <div className="grid gap-1">
                  <span className="font-medium">{formatClosureDay(date)}</span>
                  <span className="text-sm text-muted">Tutto il giorno</span>
                </div>
                <span className="closure-global-pill">Chiusura generale</span>
              </div>
            ))}
          </div>
        )}
        {(t.closures ?? []).map((closure, index) => (
          <div
            key={`${closure.date}-${closure.times.join("-")}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
          >
            <div className="grid gap-1">
              <span className="font-medium">{formatClosureDay(closure.date)}</span>
              <span className="text-sm text-muted">
                {closure.times.length
                  ? closure.times.join(", ")
                  : "Tutto il giorno"}
              </span>
            </div>
            <button
              type="button"
              className="underline"
              onClick={() =>
                change(
                  "closures",
                  t.closures!.filter((_, i) => i !== index),
                )
              }
            >
              Rimuovi
            </button>
          </div>
        ))}
        {adding ? (
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <label>
              Giorno
              <input
                type="date"
                className="text-input"
                required
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />
            </label>
            <label>
              Orari da chiudere (vuoto = tutto il giorno)
              <input
                className="text-input"
                placeholder="14:00, 16:00"
                value={draftTimes}
                onChange={(e) => setDraftTimes(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  if (!draftDate) return;
                  change("closures", [
                    ...(t.closures ?? []),
                    {
                      date: draftDate,
                      times: draftTimes.split(/[,;\s]+/).filter(Boolean),
                    },
                  ]);
                  setDraftTimes("");
                  setDraftDate(today);
                  setAdding(false);
                }}
              >
                Conferma chiusura
              </button>
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setDraftTimes("");
                  setDraftDate(today);
                  setAdding(false);
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button-secondary"
            onClick={() => setAdding(true)}
          >
            Aggiungi chiusura
          </button>
        )}
      </div>
      <div className="card grid gap-5 p-6">
        <h2 id="promemoria" className="display-md">Cancellazioni e promemoria</h2>
        <div className="form-grid">
          {(
            [
              [
                "cancellationHours",
                "Cancellazione gratuita (ore prima)",
                0,
                720,
                24,
              ],
              ["lateRefundPercent", "Rimborso dopo il termine (%)", 0, 100, 0],
              [
                "reminderHours",
                "Invia promemoria email (ore prima)",
                1,
                168,
                24,
              ],
            ] as const
          ).map(([key, label, min, max, fallback]) => (
            <label key={key}>
              {label}
              <input
                className="text-input"
                type="number"
                min={min}
                max={max}
                value={t[key] ?? fallback}
                onChange={(e) => change(key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <label>
          Testo del promemoria
          <textarea
            className="text-input"
            rows={6}
            maxLength={10000}
            value={t.reminderTemplate ?? ""}
            onChange={(e) => change("reminderTemplate", e.target.value)}
            placeholder="Ciao {nome}, ti aspettiamo per {tour} il {data}. Punto d’incontro: {incontro}. {mappa}"
          />
        </label>
        <p className="text-sm">
          Variabili disponibili:{" "}
          {"{nome}, {tour}, {data}, {incontro}, {mappa}, {pnr}"}. Punto
          d’incontro, mappa e regole del tour sono sempre inclusi. Lascia vuoto
          per il modello standard.
        </p>
      </div>
    </>
  );
}
