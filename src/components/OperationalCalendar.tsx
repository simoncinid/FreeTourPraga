"use client";
import { useState } from "react";
import type { CatalogTour } from "@/lib/platform/model";
import { pragueLocal } from "@/lib/platform/time";
export function OperationalCalendar({
  tours,
  busy,
  save,
  fixedTourId,
}: {
  tours: CatalogTour[];
  busy: boolean;
  fixedTourId?: string;
  save: (body: unknown) => Promise<unknown>;
}) {
  const today = pragueLocal(new Date().toISOString()).slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [ids, setIds] = useState<string[]>(fixedTourId ? [fixedTourId] : []);
  const [from, setFrom] = useState(today),
    [to, setTo] = useState(today),
    [times, setTimes] = useState(""),
    [capacity, setCapacity] = useState(25);
  const [weekdays, setWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [action, setAction] = useState("close"),
    [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");
  const [viewRange, setViewRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const selected = tours.filter((t) => ids.includes(t.id));
  const [year, mo] = month.split("-").map(Number),
    days = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const shift = (delta: number) => {
    setViewRange(null);
    setMonth(iso(new Date(Date.UTC(year, mo - 1 + delta, 1))).slice(0, 7));
  };
  const viewStart = viewRange?.from || `${month}-01`;
  const viewEnd = viewRange?.to || `${month}-${String(days).padStart(2, "0")}`;
  const viewDays = Math.max(
    0,
    Math.min(
      367,
      Math.round((Date.parse(viewEnd) - Date.parse(viewStart)) / 86400000) + 1,
    ),
  );
  function filterView(start = from, end = to) {
    if (
      !start ||
      !end ||
      start > end ||
      Date.parse(end) - Date.parse(start) > 366 * 86400000
    ) {
      setMessage("Scegli un intervallo valido, massimo un anno.");
      return;
    }
    setMonth(start.slice(0, 7));
    setViewRange({ from: start, to: end });
    setDetail("");
  }
  function quick(kind: string) {
    const [currentYear, currentMonth] = today.split("-").map(Number);
    let start = today,
      end = today;
    if (kind === "yesterday")
      start = end = iso(new Date(Date.parse(`${today}T12:00:00Z`) - 86400000));
    if (kind === "month" || kind === "last") {
      const offset = kind === "last" ? -1 : 0;
      start = iso(
        new Date(Date.UTC(currentYear, currentMonth - 1 + offset, 1)),
      );
      end = iso(new Date(Date.UTC(currentYear, currentMonth + offset, 0)));
    }
    if (kind === "year") {
      start = `${currentYear}-01-01`;
      end = `${currentYear}-12-31`;
    }
    setFrom(start);
    setTo(end);
    filterView(start, end);
  }
  async function apply(
    dateFrom = from,
    dateTo = to,
    selectedTimes = times,
    operation = action,
    places = capacity,
  ) {
    setMessage("");
    try {
      await save({
        tourIds: ids,
        from: dateFrom,
        to: dateTo,
        weekdays,
        times: selectedTimes.split(/[,\s]+/).filter(Boolean),
        action: operation,
        capacity: operation === "close" ? undefined : places,
      });
      setMessage(
        "Calendario aggiornato. Le prenotazioni esistenti sono conservate.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operazione non riuscita");
    }
  }
  return (
    <section className="card grid gap-5 p-6">
      <h2 className="display-md">Calendario operativo</h2>
      {!fixedTourId && (
        <fieldset>
          <legend>Tour su cui operare</legend>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setIds(tours.map((t) => t.id))}
          >
            Seleziona tutti
          </button>{" "}
          <button
            type="button"
            className="button-secondary"
            onClick={() => setIds([])}
          >
            Deseleziona
          </button>
          <select
            multiple
            aria-label="Tour selezionati"
            className="text-input min-h-32 mt-3"
            value={ids}
            onChange={(e) =>
              setIds(Array.from(e.target.selectedOptions, (o) => o.value))
            }
          >
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </fieldset>
      )}
      <p className="text-sm">
        Ambito:{" "}
        {selected.length
          ? selected.map((t) => t.title).join(", ")
          : "seleziona almeno un tour"}
        . Le chiusure bloccano solo nuove prenotazioni.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label="Mese precedente"
          onClick={() => shift(-1)}
        >
          ←
        </button>
        <input
          aria-label="Mese calendario"
          type="month"
          value={month}
          onChange={(e) => {
            if (e.target.value) {
              setMonth(e.target.value);
              setViewRange(null);
            }
          }}
        />
        <button
          type="button"
          aria-label="Mese successivo"
          onClick={() => shift(1)}
        >
          →
        </button>
      </div>
      <p role="status">
        Vista dal {viewStart} al {viewEnd}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <strong key={d}>{d}</strong>
        ))}
        {Array.from(
          { length: (new Date(`${viewStart}T12:00:00Z`).getUTCDay() + 6) % 7 },
          (_, i) => (
            <span key={`b${i}`} />
          ),
        )}
        {Array.from({ length: viewDays }, (_, i) => {
          const date = iso(
            new Date(Date.parse(`${viewStart}T12:00:00Z`) + i * 86400000),
          );
          const slots = selected.flatMap((t) =>
            t.slots.filter(
              (s) => pragueLocal(s.startsAt).slice(0, 10) === date,
            ),
          );
          return (
            <button
              type="button"
              className="rounded border p-2 text-sm"
              key={date}
              aria-label={`Giorno ${date}`}
              onClick={() => {
                setFrom(date);
                setTo(date);
                setWeekdays([0, 1, 2, 3, 4, 5, 6]);
                setDetail(selected.length === 1 ? date : "");
              }}
            >
              <strong>
                {viewRange
                  ? date.slice(5).split("-").reverse().join("/")
                  : Number(date.slice(8))}
              </strong>
              <small className="block">
                {slots.filter((s) => !s.closed).length} orari
              </small>
              <small className="block">
                {slots.reduce((n, s) => n + s.reserved, 0)} pax
              </small>
            </button>
          );
        })}
      </div>
      {detail && selected.length === 1 && (
        <div className="grid gap-3 rounded border p-4">
          <h3>Partenze del {detail}</h3>
          {selected[0].slots
            .filter((s) => pragueLocal(s.startsAt).slice(0, 10) === detail)
            .map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3">
                <span>
                  {pragueLocal(s.startsAt).slice(11, 16)} · {s.reserved}/
                  {s.capacity} · {s.closed ? "Chiuso" : "Aperto"}
                </span>
                <button
                  disabled={busy}
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    void apply(
                      detail,
                      detail,
                      pragueLocal(s.startsAt).slice(11, 16),
                      s.closed ? "open" : "close",
                      s.capacity,
                    )
                  }
                >
                  {s.closed ? "Riapri" : "Chiudi"}
                </button>
                <label>
                  Posti
                  <input
                    aria-label={`Posti ${pragueLocal(s.startsAt).slice(11, 16)}`}
                    type="number"
                    min={Math.max(1, s.reserved)}
                    max={10000}
                    defaultValue={s.capacity}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (n !== s.capacity && n >= s.reserved && n > 0)
                        void apply(
                          detail,
                          detail,
                          pragueLocal(s.startsAt).slice(11, 16),
                          "capacity",
                          n,
                        );
                    }}
                  />
                </label>
              </div>
            ))}
          <p>
            Per aggiungere una partenza usa Apri qui sotto, con il nuovo orario.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {[
          ["today", "Oggi"],
          ["yesterday", "Ieri"],
          ["month", "Questo mese"],
          ["last", "Mese scorso"],
          ["year", "Intero anno"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            className="button-secondary"
            onClick={() => quick(k)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="form-grid">
        <label>
          Dal
          <input
            className="text-input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Al
          <input
            className="text-input"
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label>
          Operazione
          <select
            className="text-input"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="close">Chiudi</option>
            <option value="open">Apri / aggiungi orari</option>
            <option value="capacity">Modifica capienza</option>
          </select>
        </label>
        <label>
          Orari (vuoto = tutti)
          <input
            className="text-input"
            value={times}
            placeholder="10:00, 14:30"
            onChange={(e) => setTimes(e.target.value)}
          />
        </label>
        {action !== "close" && (
          <label>
            Posti per orario
            <input
              className="text-input"
              type="number"
              min={1}
              max={10000}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </label>
        )}
      </div>
      <button
        type="button"
        className="button-secondary"
        onClick={() => filterView()}
      >
        Filtra vista dal/al
      </button>
      <fieldset>
        <legend>Giorni della settimana</legend>
        <div className="flex flex-wrap gap-3">
          {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map((d, i) => (
            <label key={d}>
              <input
                type="checkbox"
                checked={weekdays.includes(i)}
                onChange={(e) =>
                  setWeekdays(
                    e.target.checked
                      ? [...weekdays, i]
                      : weekdays.filter((x) => x !== i),
                  )
                }
              />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        disabled={busy || !ids.length || !weekdays.length || !from || !to}
        className="button-primary"
        onClick={() => void apply()}
      >
        Applica a {selected.length} tour dal {from} al {to}
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
