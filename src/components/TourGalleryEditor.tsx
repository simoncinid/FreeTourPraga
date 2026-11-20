"use client";

import { useState } from "react";
import { ImageSourceField, uploadAdminImage } from "./ImageSourceField";
import type { TourPhoto } from "@/lib/types";

export function TourGalleryEditor({
  photos,
  disabled,
  onChange,
  onUploading,
}: {
  photos: TourPhoto[];
  disabled: boolean;
  onChange: (photos: TourPhoto[]) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const locked = disabled || uploading;

  function move(index: number, direction: number) {
    const next = [...photos];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }

  function addPhoto(url: string) {
    if (!url.trim() || photos.length >= 20) return;
    onChange([...photos, { url: url.trim(), alt: "" }]);
    setUrlDraft("");
    setMessage("Foto aggiunta. Salva il tour per pubblicarla.");
  }

  return (
    <section className="card grid gap-5 p-6" aria-label="Galleria fotografica">
      <div>
        <h2 className="display-md">Galleria fotografica</h2>
        <p className="mt-2 text-sm text-muted">
          La copertina è la prima foto. Aggiungi fino a 20 foto del percorso: per
          URL o caricamento dal computer. L’ordine qui sotto è quello della
          galleria pubblica. Salva il tour per pubblicare le modifiche.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm">
          Aggiungi foto da URL
          <input
            className="text-input"
            value={urlDraft}
            disabled={locked || photos.length >= 20}
            placeholder="https://… oppure /api/media/…"
            maxLength={1000}
            onChange={(event) => setUrlDraft(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="button-secondary"
          disabled={locked || photos.length >= 20 || !urlDraft.trim()}
          onClick={() => addPhoto(urlDraft)}
        >
          Aggiungi URL
        </button>
      </div>
      <label className="grid gap-2 text-sm">
        Oppure carica dal computer (JPEG, PNG o WebP; massimo 5 MB ciascuna)
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={locked || photos.length >= 20}
          onChange={async (event) => {
            const files = Array.from(event.currentTarget.files || []);
            event.currentTarget.value = "";
            if (!files.length) return;
            if (files.length + photos.length > 20) {
              setMessage(
                "Puoi aggiungere al massimo 20 foto. Seleziona meno file.",
              );
              return;
            }
            setUploading(true);
            onUploading(true);
            const next = [...photos];
            try {
              for (const [index, file] of files.entries()) {
                setMessage(`Caricamento foto ${index + 1} di ${files.length}…`);
                next.push({ url: await uploadAdminImage(file), alt: "" });
                onChange([...next]);
              }
              setMessage(
                `${files.length} foto caricate. Aggiungi una descrizione e salva il tour per pubblicarle.`,
              );
            } catch (error) {
              setMessage(
                `${error instanceof Error ? error.message : "Errore caricamento"}. Le foto già caricate sono conservate: salva il tour per pubblicarle.`,
              );
            } finally {
              setUploading(false);
              onUploading(false);
            }
          }}
        />
      </label>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {photos.length === 0 && (
        <p className="text-sm text-muted">
          Nessuna foto aggiuntiva. Il tour mostra la copertina.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo, index) => (
          <div
            key={`${photo.url}-${index}`}
            className="min-w-0 rounded-lg border border-hairline p-3"
          >
            <ImageSourceField
              label={`Foto ${index + 1}`}
              value={photo.url}
              alt={photo.alt}
              disabled={locked}
              onNotice={setMessage}
              onUploading={(next) => {
                setUploading(next);
                onUploading(next);
              }}
              onChange={(url) =>
                onChange(
                  photos.map((item, i) =>
                    i === index ? { ...item, url } : item,
                  ),
                )
              }
              onAltChange={(alt) =>
                onChange(
                  photos.map((item, i) =>
                    i === index ? { ...item, alt } : item,
                  ),
                )
              }
            />
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                className="underline disabled:opacity-40"
                disabled={locked || index === 0}
                aria-label={`Sposta prima foto ${index + 1}`}
                onClick={() => move(index, -1)}
              >
                ← Prima
              </button>
              <button
                type="button"
                className="underline disabled:opacity-40"
                disabled={locked || index === photos.length - 1}
                aria-label={`Sposta dopo foto ${index + 1}`}
                onClick={() => move(index, 1)}
              >
                Dopo →
              </button>
              <button
                type="button"
                className="underline disabled:opacity-40"
                disabled={locked}
                aria-label={`Rimuovi foto ${index + 1}`}
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
