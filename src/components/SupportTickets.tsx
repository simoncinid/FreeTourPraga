"use client";
import { useState } from "react";
import type { PlatformState } from "@/lib/platform/model";

const labels = { open: "Aperto", working: "In lavorazione", done: "Risolto" };

export function SupportTickets({
  tickets,
  busy,
  save,
}: {
  tickets: NonNullable<PlatformState["tickets"]>;
  busy: boolean;
  save: (body: unknown, method?: string) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <section className="card grid gap-4 p-6">
      <h2 className="display-md">Supporto</h2>
      <p>Apri una richiesta per il web developer. Lo stato resta visibile qui.</p>
      <label>
        Oggetto
        <input className="text-input" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Descrizione
        <textarea className="text-input" value={body} maxLength={5000} rows={4} onChange={(e) => setBody(e.target.value)} />
      </label>
      <button
        type="button"
        className="button-primary"
        disabled={busy || title.trim().length < 3 || body.trim().length < 3}
        onClick={() => {
          void save({ title, body }, "POST").then((result) => {
            if (result) {
              setTitle("");
              setBody("");
            }
          });
        }}
      >
        Apri ticket
      </button>
      <ul className="grid gap-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded border p-3">
            <strong>{ticket.title}</strong>
            <p>{ticket.body}</p>
            <label>
              Stato
              <select
                className="text-input"
                value={ticket.status}
                disabled={busy}
                onChange={(e) =>
                  void save(
                    { id: ticket.id, status: e.target.value },
                    "PATCH",
                  )
                }
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
