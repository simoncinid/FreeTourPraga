"use client";
import { useState } from "react";
import type { EuropeanPartner, PlatformState } from "@/lib/platform/model";
import { ImageSourceField } from "./ImageSourceField";
import { partnerStats } from "@/lib/partner-statistics";
export function PartnersManager({
  data,
  busy,
  mutate,
}: {
  data: PlatformState | Pick<PlatformState, "partners" | "partnerClicks">;
  busy: boolean;
  mutate: (route: string, body: unknown, method?: string) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<EuropeanPartner | null>(null),
    [upload, setUpload] = useState(false),
    [notice, setNotice] = useState("");
  const [from, setFrom] = useState(
      new Date().toISOString().slice(0, 7) + "-01",
    ),
    [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const stats = partnerStats(data as PlatformState, from, to);
  return (
    <div className="grid gap-5">
      <h2 className="display-md">Partner Europa e statistiche</h2>
      <button
        type="button"
        className="button-primary"
        onClick={() =>
          setDraft({
            id: crypto.randomUUID(),
            name: "",
            description: "",
            imageUrl: "",
            email: "",
            phone: "",
            website: "",
            published: false,
          })
        }
      >
        Nuovo partner
      </button>
      {draft && (
        <form
          className="card grid gap-4 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (upload) return;
            const result = await mutate("partner", draft, "PUT");
            if (result) setDraft(null);
          }}
        >
          <h3>Scheda partner</h3>
          {(["name", "description", "email", "phone", "website"] as const).map(
            (key, i) => (
              <label key={key}>
                {["Nome", "Descrizione", "Email", "Telefono", "Sito HTTPS"][i]}
                {key === "description" ? (
                  <textarea
                    className="text-input"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    required={key === "name" || key === "website"}
                    type={
                      key === "email"
                        ? "email"
                        : key === "website"
                          ? "url"
                          : "text"
                    }
                    className="text-input"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                )}
              </label>
            ),
          )}
          <ImageSourceField
            label="Foto o logo"
            value={draft.imageUrl}
            onChange={(imageUrl) => setDraft({ ...draft, imageUrl })}
            onUploading={setUpload}
            onNotice={setNotice}
          />
          {notice && <p role="status">{notice}</p>}
          <label>
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) =>
                setDraft({ ...draft, published: e.target.checked })
              }
            />{" "}
            Pubblica
          </label>
          <button className="button-primary" disabled={busy || upload}>
            Salva partner
          </button>
          <button type="button" onClick={() => setDraft(null)}>
            Annulla
          </button>
        </form>
      )}
      {(data.partners ?? [])
        .filter((p) => !p.deleted)
        .map((p) => (
          <article
            key={p.id}
            className="card flex flex-wrap items-center gap-4 p-5"
          >
            <strong>{p.name}</strong>
            <span>{p.published ? "Pubblicato" : "Bozza"}</span>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setDraft(p)}
            >
              Modifica
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `Eliminare ${p.name}? Le statistiche rimangono disponibili.`,
                  )
                )
                  void mutate("partner", { id: p.id }, "DELETE");
              }}
            >
              Elimina
            </button>
          </article>
        ))}
      <section className="card grid gap-4 p-5">
        <h3>Traffico inviato ai partner</h3>
        <p>
          Un visitatore che consente le statistiche viene contato una volta per
          partner e giorno. I click senza consenso aumentano solo il totale. La
          somma nel periodo rappresenta visitatori-giorno, non persone uniche
          nell’intero periodo.
        </p>
        <div className="flex flex-wrap gap-4">
          <label>
            Dal
            <input
              aria-label="Statistiche dal"
              className="text-input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Al
            <input
              aria-label="Statistiche al"
              className="text-input"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <a
            className="button-secondary"
            href={`/api/platform/admin/partners/stats?from=${from}&to=${to}&format=csv`}
          >
            Esporta CSV
          </a>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Click totali</th>
                <th>Visitatori-giorno</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.name}
                    {p.deleted ? " (eliminato)" : ""}
                    <details>
                      <summary>Storico giornaliero</summary>
                      {p.daily.map((d) => (
                        <p key={d.day}>
                          {d.day}: {d.clicks} click · {d.uniqueVisitorDays}{" "}
                          visitatori
                        </p>
                      ))}
                    </details>
                  </td>
                  <td>{p.clicks}</td>
                  <td>{p.uniqueVisitorDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
