"use client";
import { useState } from "react";
import { Plus, Trash2, Info } from "lucide-react";
import type { CatalogTour } from "@/lib/platform/model";
import { pragueLocal } from "@/lib/platform/time";
import { isFreeTour } from "@/lib/tour-rules";
import {
  RecordDrawer,
  RecordPager,
  useRecordPagination,
  recordsCss as records,
} from "./AdminRecords";
import css from "./tour-edit-panels.module.css";
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
  const [tab, setTab] = useState("schedule"),
    [adding, setAdding] = useState(false),
    [help, setHelp] = useState(false),
    [date, setDate] = useState(today),
    [times, setTimes] = useState("");
  const schedule = t.schedule ?? {
    enabled: false,
    from: today,
    to: `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`,
    weekdays: [1, 2, 3, 4, 5, 6, 0],
    times: ["10:00"],
    capacity: t.maxGuests,
  };
  const update = (patch: Partial<typeof schedule>) =>
    change("schedule", { ...schedule, ...patch });
  const closures = [
    ...closedDates.map((day) => ({
      date: day,
      times: [] as string[],
      global: true,
      index: -1,
    })),
    ...(t.closures || []).map((closure, index) => ({
      ...closure,
      global: false,
      index,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const paging = useRecordPagination(closures.length);
  return (
    <div className={css.workspace}>
      <nav className={css.subnav} aria-label="Programmazione e policy">
        {[
          ["schedule", "Programmazione"],
          ["closures", `Chiusure (${closures.length})`],
          ["policy", "Percorso e cancellazione"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      <section hidden={tab !== "schedule"} className={css.card}>
        <header className={css.sectionHead}>
          <div>
            <h2>Programmazione settimanale</h2>
            <p>
              Orari locali di Praga · le prenotazioni esistenti restano
              conservate.
            </p>
          </div>
          <button
            type="button"
            className={records.icon}
            aria-label="Informazioni sulla programmazione"
            onClick={() => setHelp(true)}
          >
            <Info size={16} />
          </button>
        </header>
        <label className={css.check}>
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
          />
          Programma le partenze ricorrenti
        </label>
        {schedule.enabled && (
          <>
            <div className={css.three}>
              <label>
                Dal *
                <input
                  className="text-input"
                  type="date"
                  required
                  value={schedule.from}
                  onChange={(e) => update({ from: e.target.value })}
                />
              </label>
              <label>
                Al *
                <input
                  className="text-input"
                  type="date"
                  required
                  min={schedule.from}
                  value={schedule.to}
                  onChange={(e) => update({ to: e.target.value })}
                />
              </label>
              <label>
                Posti per partenza *
                <input
                  className="text-input"
                  type="number"
                  required
                  min={1}
                  max={10000}
                  value={schedule.capacity}
                  onChange={(e) => update({ capacity: Number(e.target.value) })}
                />
              </label>
            </div>
            <fieldset className={css.weekdays}>
              <legend>Giorni della settimana</legend>
              {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(
                (day, index) => (
                  <label
                    key={day}
                    title={
                      [
                        "Domenica",
                        "Lunedì",
                        "Martedì",
                        "Mercoledì",
                        "Giovedì",
                        "Venerdì",
                        "Sabato",
                      ][index]
                    }
                  >
                    <input
                      type="checkbox"
                      checked={schedule.weekdays.includes(index)}
                      onChange={(e) =>
                        update({
                          weekdays: e.target.checked
                            ? [...schedule.weekdays, index]
                            : schedule.weekdays.filter((d) => d !== index),
                        })
                      }
                    />
                    {day}
                  </label>
                ),
              )}
            </fieldset>
            <fieldset className={css.timeField}>
              <legend>Orari di partenza</legend>
              <div className={css.timeGrid}>
                {schedule.times.map((time, index) => (
                  <div key={index}>
                    <input
                      className="text-input"
                      aria-label={`Orario ${index + 1}`}
                      type="time"
                      value={time}
                      required
                      onChange={(e) =>
                        update({
                          times: schedule.times.map((value, i) =>
                            i === index ? e.target.value : value,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Rimuovi orario ${index + 1}`}
                      className={records.icon}
                      disabled={schedule.times.length === 1}
                      onClick={() =>
                        update({
                          times: schedule.times.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button-secondary"
                  disabled={schedule.times.length >= 10}
                  onClick={() =>
                    update({ times: [...schedule.times, "14:00"] })
                  }
                >
                  <Plus size={14} />
                  Orario
                </button>
              </div>
            </fieldset>
          </>
        )}
      </section>
      <section hidden={tab !== "closures"} className={records.center}>
        <div className={records.toolbar}>
          <p className={records.caption}>
            Le chiusure generali sono in sola lettura. Per cambiare una chiusura
            del tour, rimuovila e aggiungila di nuovo.
          </p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setAdding(true)}
          >
            <Plus size={14} />
            Chiusura
          </button>
        </div>
        <div ref={paging.area} className={records.tableArea}>
          <table className={records.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Orari</th>
                <th>Ambito</th>
                <th className={records.actions}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {closures
                .slice(paging.start, paging.start + paging.size)
                .map((row) => (
                  <tr key={`${row.global}-${row.date}-${row.index}`}>
                    <td>
                      {new Date(row.date + "T12:00:00Z").toLocaleDateString(
                        "it-IT",
                        { dateStyle: "medium", timeZone: "Europe/Prague" },
                      )}
                    </td>
                    <td>
                      {row.times.length
                        ? row.times.join(", ")
                        : "Tutto il giorno"}
                    </td>
                    <td>
                      <span className={records.badge}>
                        {row.global ? "Generale" : "Solo questo tour"}
                      </span>
                    </td>
                    <td className={records.actions}>
                      {!row.global && (
                        <button
                          type="button"
                          className={`${records.icon} ${records.danger}`}
                          aria-label={`Rimuovi chiusura ${row.date}`}
                          onClick={() =>
                            change(
                              "closures",
                              t.closures!.filter(
                                (_, index) => index !== row.index,
                              ),
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!closures.length && (
            <p className={records.empty}>Nessuna chiusura configurata.</p>
          )}
        </div>
        <RecordPager
          page={paging.page}
          pages={paging.pages}
          total={closures.length}
          onChange={paging.setPage}
        />
      </section>
      <section hidden={tab !== "policy"} className={css.card}>
        <header className={css.sectionHead}>
          <div>
            <h2>Tipo di tour e percorso</h2>
            <p>
              Le regole per i gruppi e la capienza sono configurabili nelle
              tariffe del tour.
            </p>
          </div>
        </header>
        <div className={css.three}>
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
              <option value="free">Free tour · offerta libera</option>
            </select>
          </label>
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
        <h3 className={css.groupTitle}>Policy di cancellazione</h3>
        <div className={css.three}>
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
      </section>
      {adding && (
        <RecordDrawer
          title="Nuova chiusura"
          subtitle="Programmazione del tour"
          close={() => setAdding(false)}
        >
          <div
            className={records.form}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          >
            <div className={records.formGrid}>
              <label>
                Giorno *
                <input
                  className="text-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Orari
                <input
                  className="text-input"
                  placeholder="14:00, 16:00"
                  value={times}
                  onChange={(e) => setTimes(e.target.value)}
                />
              </label>
            </div>
            <p className={records.caption}>
              Lascia gli orari vuoti per chiudere l’intera giornata. Salva il
              tour per applicare le modifiche.
            </p>
            <footer className={records.drawerFooter}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setAdding(false);
                  setTimes("");
                  setDate(today);
                }}
              >
                Annulla
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={!date}
                onClick={() => {
                  change("closures", [
                    ...(t.closures || []),
                    { date, times: times.split(/[,;\s]+/).filter(Boolean) },
                  ]);
                  setTimes("");
                  setAdding(false);
                }}
              >
                Aggiungi alla bozza
              </button>
            </footer>
          </div>
        </RecordDrawer>
      )}
      {help && (
        <RecordDrawer
          title="Come funziona la programmazione"
          subtitle="Informazioni operative"
          close={() => setHelp(false)}
        >
          <p className={records.caption}>
            Scegli giorni e orari di Praga. Le partenze del periodo, fino a un
            anno, vengono aggiornate automaticamente. Le chiusure del calendario
            generale valgono per tutti i tour; le prenotazioni esistenti restano
            conservate. Salva il tour per applicare le modifiche.
          </p>
        </RecordDrawer>
      )}
    </div>
  );
}
