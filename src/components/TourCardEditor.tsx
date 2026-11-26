"use client";

import type { CatalogTour } from "@/lib/platform/model";
import { RichTextEditor } from "./RichTextEditor";

type Preview = NonNullable<CatalogTour["cardPreview"]>;

export function TourCardEditor({
  tour,
  onChange,
}: {
  tour: CatalogTour;
  onChange: (preview: Preview) => void;
}) {
  const preview = tour.cardPreview ?? {};
  const facts = preview.facts ?? [];

  return (
    <section className="card grid gap-5 p-6">
      <h2 className="display-md">Card di anteprima</h2>
      <p>
        Titolo, descrizione breve e itinerario aggiornano anche il contenuto del
        tour (scheda Contenuto). Gli altri campi valgono solo per la card; se
        restano vuoti, la card riusa i dati del tour.
      </p>
      <div className="form-grid">
        {(
          [
            ["title", "Titolo", tour.title],
            ["itineraryLabel", "Pulsante itinerario", "Itinerario completo"],
            ["pricesLabel", "Pulsante prezzi", "Prezzi per persona"],
            ["bookLabel", "Pulsante prenotazione", "Prenota"],
            ["detailsLabel", "Pulsante dettagli", "Scopri di più"],
          ] as const
        ).map(([key, label, placeholder]) => (
          <label key={key}>
            {label}
            <input
              className="text-input"
              value={preview[key] ?? ""}
              placeholder={placeholder}
              maxLength={key === "title" ? 200 : 80}
              onChange={(event) =>
                onChange({ ...preview, [key]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
      <RichTextEditor
        label="Descrizione breve"
        html={preview.description}
        onChange={(html, plain) =>
          onChange({ ...preview, description: plain ? html : "" })
        }
      />
      <RichTextEditor
        label="Itinerario della card"
        html={preview.itinerary}
        onChange={(html, plain) =>
          onChange({ ...preview, itinerary: plain ? html : "" })
        }
      />
      <fieldset className="grid gap-4">
        <legend>Elenco informazioni</legend>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preview.facts === undefined}
            onChange={(event) =>
              onChange({
                ...preview,
                facts: event.target.checked ? undefined : [],
              })
            }
          />
          Usa le informazioni del tour
        </label>
        {preview.facts !== undefined && (
          <>
            {facts.map((fact, index) => (
              <div key={index} className="grid gap-2 rounded border p-3">
                <RichTextEditor
                  label={`Informazione ${index + 1}`}
                  html={fact}
                  onChange={(html, plain) =>
                    onChange({
                      ...preview,
                      facts: facts.map((item, i) =>
                        i === index ? (plain ? html : "") : item,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="button-secondary justify-self-start"
                  onClick={() =>
                    onChange({
                      ...preview,
                      facts: facts.filter((_, i) => i !== index),
                    })
                  }
                >
                  Rimuovi informazione
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button-secondary justify-self-start"
              disabled={facts.length >= 30}
              onClick={() =>
                onChange({
                  ...preview,
                  facts: [...facts, "Nuova informazione"],
                })
              }
            >
              Aggiungi informazione
            </button>
          </>
        )}
      </fieldset>
    </section>
  );
}
