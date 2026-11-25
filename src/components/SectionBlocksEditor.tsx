"use client";
import { CONTENT_SECTION_STRUCTURE_ENABLED } from "@/lib/content-policy";
import type { ContentSectionBlock } from "@/lib/types";
import { RichTextEditor } from "./RichTextEditor";
import { ImageSourceField } from "./ImageSourceField";
import { SectionBlocks } from "./SectionBlocks";
import { RecordDrawer } from "./AdminRecords";
import { AdminNotice } from "./AdminNotice";
import { useState } from "react";
export function SectionBlocksEditor({
  blocks = [],
  onChange,
  onUploading,
}: {
  blocks?: ContentSectionBlock[];
  onChange: (blocks: ContentSectionBlock[]) => void;
  onUploading?: (value: boolean) => void;
}) {
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState(false),
    [notice, setNotice] = useState("");
  const update = (i: number, patch: Partial<ContentSectionBlock>) =>
    onChange(
      blocks.map((b, j) =>
        j === i ? ({ ...b, ...patch } as ContentSectionBlock) : b,
      ),
    );
  const move = (i: number, delta: number) => {
    const next = [...blocks];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  };
  return (
    <section className="card tour-section-editor grid gap-4 p-6">
      <h2 className="display-md">Contenuti delle sezioni esistenti</h2>
      <p>
        Modifica i contenuti esistenti. Aggiunta, rimozione e riordino delle
        sezioni non sono previsti dal contratto.
      </p>
      {blocks.map((b, i) => (
        <fieldset
          hidden={i !== Math.min(page, Math.max(0, blocks.length - 1))}
          className="grid gap-3 rounded border p-4"
          key={i}
        >
          <legend>
            Blocco {i + 1} ·{" "}
            {b.type === "text"
              ? "Testo"
              : b.type === "image"
                ? "Foto"
                : "Testo e foto"}
          </legend>
          {b.type !== "image" && (
            <>
              <label>
                Titolo
                <input
                  className="text-input"
                  value={b.heading}
                  onChange={(e) => update(i, { heading: e.target.value })}
                />
              </label>
              <RichTextEditor label="Testo" text={b.text} html={b.html}
                onChange={(html, text) => update(i, { html, text })} />
            </>
          )}
          {b.type !== "text" && (
            <>
              <ImageSourceField
                label="Immagine"
                value={b.imageUrl}
                onChange={(imageUrl) => update(i, { imageUrl })}
                onUploading={onUploading}
                onNotice={setNotice}
              />
              <label>
                Testo alternativo
                <input
                  className="text-input"
                  value={b.alt}
                  onChange={(e) => update(i, { alt: e.target.value })}
                />
              </label>
              <label>
                Didascalia
                <input
                  className="text-input"
                  value={b.caption}
                  onChange={(e) => update(i, { caption: e.target.value })}
                />
              </label>
            </>
          )}
          {b.type === "split" && (
            <label>
              Posizione foto
              <select
                className="text-input"
                value={b.imagePosition}
                onChange={(e) =>
                  update(i, {
                    imagePosition: e.target.value as "left" | "right",
                  })
                }
              >
                <option value="left">Sinistra</option>
                <option value="right">Destra</option>
              </select>
            </label>
          )}
          {CONTENT_SECTION_STRUCTURE_ENABLED && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                Sposta su
              </button>
              <button
                type="button"
                disabled={i === blocks.length - 1}
                onClick={() => move(i, 1)}
              >
                Sposta giù
              </button>
              <button
                type="button"
                onClick={() => onChange(blocks.filter((_, j) => j !== i))}
              >
                Rimuovi blocco
              </button>
            </div>
          )}
        </fieldset>
      ))}
      {blocks.length > 0 && (
        <div className="admin-pagination">
          <span>
            Sezione {Math.min(page + 1, blocks.length)} di {blocks.length}
          </span>
          <button
            type="button"
            className="button-secondary"
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Precedente
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={page >= blocks.length - 1}
            onClick={() => setPage(page + 1)}
          >
            Successiva
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {CONTENT_SECTION_STRUCTURE_ENABLED &&
          (["text", "image", "split"] as const).map((type, i) => (
            <button
              key={type}
              className="button-secondary"
              type="button"
              disabled={blocks.length >= 60}
              onClick={() =>
                onChange([
                  ...blocks,
                  type === "text"
                    ? { type, heading: "", text: "" }
                    : type === "image"
                      ? { type, imageUrl: "", alt: "", caption: "" }
                      : {
                          type,
                          heading: "",
                          text: "",
                          imageUrl: "",
                          alt: "",
                          caption: "",
                          imagePosition: "right",
                        },
                ])
              }
            >
              Aggiungi {["testo", "foto", "testo e foto"][i]}
            </button>
          ))}
        <button
          type="button"
          className="button-secondary"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Chiudi anteprima blocchi" : "Anteprima blocchi"}
        </button>
      </div>
      {notice && <AdminNotice key={notice} message={notice} />}
      {preview && (
        <RecordDrawer
          title="Anteprima sezioni"
          subtitle="Contenuti esistenti"
          close={() => setPreview(false)}
        >
          <div className="tour-block-preview">
            <SectionBlocks blocks={blocks} />
          </div>
        </RecordDrawer>
      )}
    </section>
  );
}
