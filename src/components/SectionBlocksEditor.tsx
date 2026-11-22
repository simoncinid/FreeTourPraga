"use client";
import type { ContentSectionBlock } from "@/lib/types";
import { ImageSourceField } from "./ImageSourceField";
import { SectionBlocks } from "./SectionBlocks";
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
    <section className="card grid gap-4 p-6">
      <h2 className="display-md">Sezioni aggiuntive</h2>
      <p>
        Testo, foto o testo con foto, nello stesso ordine della pagina pubblica.
      </p>
      {blocks.map((b, i) => (
        <fieldset className="grid gap-3 rounded border p-4" key={i}>
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
              <label>
                Testo
                <textarea
                  className="text-input min-h-32"
                  value={b.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                />
              </label>
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
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-3">
        {(["text", "image", "split"] as const).map((type, i) => (
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
      {notice && <p role="status">{notice}</p>}
      {preview && (
        <div className="rounded border p-5">
          <SectionBlocks blocks={blocks} />
        </div>
      )}
    </section>
  );
}
