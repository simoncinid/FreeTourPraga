"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Upload,
  ImageIcon,
} from "lucide-react";
import { AdminNotice } from "./AdminNotice";
import { ImageSourceField, uploadAdminImage } from "./ImageSourceField";
import {
  RecordDrawer,
  RecordPager,
  useRecordPagination,
  recordsCss as css,
} from "./AdminRecords";
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
  const [uploading, setUploading] = useState(false),
    [message, setMessage] = useState(""),
    [url, setUrl] = useState(""),
    [draft, setDraft] = useState<{ index: number; photo: TourPhoto } | null>(
      null,
    );
  const { area: pagingArea, ...paging } = useRecordPagination(photos.length),
    locked = disabled || uploading;
  function move(index: number, delta: number) {
    const next = [...photos];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
    paging.setPage(Math.floor((index + delta) / paging.size));
  }
  function add() {
    if (locked || !url.trim() || photos.length >= 20) return;
    onChange([...photos, { url: url.trim(), alt: "" }]);
    paging.setPage(Math.floor(photos.length / paging.size));
    setUrl("");
    setMessage("Foto aggiunta. Salva il tour per pubblicarla.");
  }
  return (
    <section className={css.center} aria-label="Galleria fotografica">
      <header className={css.toolbar}>
        <div>
          <strong>Galleria fotografica</strong>
          <p className={css.caption}>
            La copertina viene mostrata per prima. Ordine e descrizioni si
            modificano qui; massimo 20 foto aggiuntive.
          </p>
        </div>
        <span className={css.badge}>{photos.length}/20 foto</span>
      </header>
      <div className={css.toolbar}>
        <div className={css.filters}>
          <input
            className="text-input"
            aria-label="Aggiungi foto da URL"
            placeholder="https://… oppure /api/media/…"
            maxLength={1000}
            value={url}
            disabled={locked || photos.length >= 20}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="button-secondary"
            disabled={locked || photos.length >= 20 || !url.trim()}
            onClick={add}
          >
            Aggiungi URL
          </button>
        </div>
        <label className="button-secondary tour-gallery-upload">
          <Upload size={14} />
          Carica foto
          <input
            className="sr-only"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={locked || photos.length >= 20}
            onChange={async (event) => {
              const files = Array.from(event.currentTarget.files || []);
              event.currentTarget.value = "";
              if (!files.length) return;
              if (photos.length + files.length > 20) {
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
                  setMessage(
                    `Caricamento foto ${index + 1} di ${files.length}…`,
                  );
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
      </div>
      <div ref={pagingArea} className={css.tableArea}>
        <table className={css.table}>
          <colgroup>
            <col style={{ width: 85 }} />
            <col style={{ width: 80 }} />
            <col />
            <col style={{ width: 165 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Ordine</th>
              <th>Foto</th>
              <th>Descrizione / URL</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {photos
              .slice(paging.start, paging.start + paging.size)
              .map((photo, local) => {
                const index = paging.start + local;
                return (
                  <tr key={`${photo.url}-${index}`}>
                    <td>Foto {index + 1}</td>
                    <td>
                      <div className="tour-gallery-thumb">
                        <ImageIcon size={16} />
                        <Image
                          src={photo.url}
                          alt={photo.alt || `Foto ${index + 1}`}
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                          unoptimized
                          width={56}
                          height={36}
                          style={{
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <strong>
                        {photo.alt || "Descrizione non impostata"}
                      </strong>
                      <small>{photo.url}</small>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={css.icon}
                          disabled={locked}
                          aria-label={`Modifica foto ${index + 1}`}
                          onClick={() =>
                            setDraft({ index, photo: { ...photo } })
                          }
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className={css.icon}
                          disabled={locked || !index}
                          aria-label={`Sposta prima foto ${index + 1}`}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className={css.icon}
                          disabled={locked || index === photos.length - 1}
                          aria-label={`Sposta dopo foto ${index + 1}`}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${css.icon} ${css.danger}`}
                          disabled={locked}
                          aria-label={`Rimuovi foto ${index + 1}`}
                          onClick={() =>
                            onChange(photos.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {!photos.length && (
          <p className={css.empty}>
            Nessuna foto aggiuntiva. Il tour mostra la copertina.
          </p>
        )}
      </div>
      <p className={css.caption}>
        JPEG, PNG o WebP · massimo 5 MB per immagine. Salva il tour per
        pubblicare le modifiche.
      </p>
      <RecordPager
        page={paging.page}
        pages={paging.pages}
        total={photos.length}
        onChange={paging.setPage}
      />
      {message && <AdminNotice key={message} message={message} />}
      {draft && (
        <RecordDrawer
          title={`Foto ${draft.index + 1}`}
          subtitle="Galleria del tour"
          close={() => setDraft(null)}
          locked={locked}
        >
          <div
            className="tour-photo-edit"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          >
            <ImageSourceField
              label="Foto"
              value={draft.photo.url}
              alt={draft.photo.alt}
              disabled={locked}
              onNotice={setMessage}
              onUploading={(busy) => {
                setUploading(busy);
                onUploading(busy);
              }}
              onChange={(url) =>
                setDraft({ ...draft, photo: { ...draft.photo, url } })
              }
              onAltChange={(alt) =>
                setDraft({ ...draft, photo: { ...draft.photo, alt } })
              }
            />
          </div>
          <footer className={css.drawerFooter}>
            <button
              type="button"
              className="button-secondary"
              disabled={locked}
              onClick={() => setDraft(null)}
            >
              Annulla
            </button>
            <button
              type="button"
              className="button-primary"
              disabled={locked || !draft.photo.url.trim()}
              onClick={() => {
                onChange(
                  photos.map((photo, index) =>
                    index === draft.index ? draft.photo : photo,
                  ),
                );
                setDraft(null);
              }}
            >
              Applica alla bozza
            </button>
          </footer>
        </RecordDrawer>
      )}
    </section>
  );
}
