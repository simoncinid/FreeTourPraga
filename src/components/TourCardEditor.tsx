"use client";

import type { CatalogTour } from "@/lib/platform/model";
import { richHasText, richOrPlain } from "@/lib/rich-text";
import { RichTextEditor } from "./RichTextEditor";
import { InlineRichField } from "./InlineRichField";

type Preview = NonNullable<CatalogTour["cardPreview"]>;

function highlightsPlain(tour: CatalogTour) {
  return (tour.highlights ?? []).join("\n");
}

function highlightsHtml(tour: CatalogTour) {
  const htmlParts = tour.formattedCopy?.highlights;
  if (htmlParts?.some((item) => richHasText(item))) {
    return `<ul>${(tour.highlights ?? [])
      .map((stop, index) => {
        const html = htmlParts[index];
        return `<li>${richHasText(html) ? html : stop}</li>`;
      })
      .join("")}</ul>`;
  }
  return "";
}

export function TourCardEditor({
  tour,
  onChange,
}: {
  tour: CatalogTour;
  onChange: (preview: Preview) => void;
}) {
  const preview = tour.cardPreview ?? {};
  const facts = preview.facts ?? [];
  const titleHtml = richOrPlain(
    preview.title?.includes("<") ? preview.title : undefined,
    tour.formattedCopy?.title,
  );
  const titleText =
    (preview.title && !preview.title.includes("<")
      ? preview.title
      : ""
    ).trim() || tour.title || "";
  const descriptionHtml = richOrPlain(
    preview.description,
    tour.formattedCopy?.shortDescription,
  );
  const descriptionText = tour.shortDescription || "";
  const itineraryHtml = richOrPlain(preview.itinerary, highlightsHtml(tour));
  const itineraryText = highlightsPlain(tour) || tour.description || "";

  return (
    <section className="card grid gap-5 p-6">
      <h2 className="display-md">Card di anteprima</h2>
      <p>
        I campi mostrano ciò che compare sulla card (override oppure dati del
        tour). Titolo, descrizione e itinerario aggiornano anche la scheda
        Contenuto. Le etichette pulsante, se lasciate ai default, non creano
        override.
      </p>
      <InlineRichField
        label="Titolo"
        html={titleHtml || undefined}
        text={titleText}
        onChange={(html, plain) =>
          onChange({
            ...preview,
            title: plain ? (richHasText(html) && html.includes("<") ? html : plain) : "",
          })
        }
      />
      <div className="form-grid">
        {(
          [
            ["itineraryLabel", "Pulsante itinerario", "Itinerario completo"],
            ["pricesLabel", "Pulsante prezzi", "Prezzi"],
            ["bookLabel", "Pulsante prenotazione", "Prenota"],
            ["detailsLabel", "Pulsante dettagli", "Scopri di più"],
          ] as const
        ).map(([key, label, fallback]) => (
          <label key={key}>
            {label}
            <input
              className="text-input"
              value={preview[key] || fallback}
              maxLength={80}
              onChange={(event) =>
                onChange({
                  ...preview,
                  [key]:
                    event.target.value === fallback ? "" : event.target.value,
                })
              }
            />
          </label>
        ))}
      </div>
      <RichTextEditor
        label="Descrizione breve"
        html={descriptionHtml || undefined}
        text={descriptionText}
        onChange={(html, plain) =>
          onChange({ ...preview, description: plain ? html : "" })
        }
      />
      <RichTextEditor
        label="Itinerario della card"
        html={itineraryHtml || undefined}
        text={itineraryText}
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
                  text={fact.replace(/<[^>]*>/g, " ").trim()}
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
