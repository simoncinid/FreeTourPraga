"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { guideAnchor } from "@/lib/format";
import type { BlogBlock, SiteContent } from "@/lib/platform/content";

type Article = SiteContent["gallery"][number];

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  maxLength = 250,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
}) {
  const props = {
    className: `text-input ${multiline ? "min-h-32" : ""}`,
    value,
    required,
    maxLength,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
  };
  return (
    <label className="grid gap-2 text-sm">
      {label}
      {multiline ? <textarea {...props} /> : <input {...props} />}
    </label>
  );
}

export function BlogArticleEditor({
  articles,
  onChange,
  busy,
  onUploading,
}: {
  articles: Article[];
  onChange: (articles: Article[]) => void;
  busy: boolean;
  onUploading: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const locked = busy || uploading;
  function update(index: number, patch: Partial<Article>) {
    onChange(
      articles.map((article, i) =>
        i === index ? { ...article, ...patch } : article,
      ),
    );
  }
  function changeBlocks(index: number, blocks: BlogBlock[]) {
    update(index, { blocks });
  }
  function updateBlock(
    articleIndex: number,
    blockIndex: number,
    patch: Partial<BlogBlock>,
  ) {
    changeBlocks(
      articleIndex,
      (articles[articleIndex].blocks ?? []).map((block, i) =>
        i === blockIndex ? ({ ...block, ...patch } as BlogBlock) : block,
      ),
    );
  }
  function moveArticle(index: number, direction: number) {
    const next = [...articles];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  async function upload(file: File, done: (url: string) => void) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setNotice("Usa una foto JPEG, PNG o WebP di massimo 5 MB.");
      return;
    }
    setUploading(true);
    onUploading(true);
    setNotice("Caricamento immagine…");
    try {
      const response = await fetch("/api/platform/admin/media", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Caricamento non riuscito");
      done(data.url);
      setNotice(
        "Immagine caricata. Pubblica i contenuti per renderla visibile.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Caricamento non riuscito",
      );
    } finally {
      setUploading(false);
      onUploading(false);
    }
  }
  function imageFields(
    imageUrl: string,
    alt: string,
    onUrl: (url: string) => void,
    onAlt: (alt: string) => void,
    label: string,
  ) {
    return (
      <div className="grid gap-3">
        {/^\/(?!\/)|^https:\/\//.test(imageUrl) && (
          <Image
            src={imageUrl}
            alt={alt || "Anteprima immagine"}
            width={480}
            height={270}
            unoptimized
            className="max-h-48 w-full rounded-lg object-cover"
          />
        )}
        <TextField
          label={`URL ${label}`}
          value={imageUrl}
          onChange={onUrl}
          required
          maxLength={1000}
        />
        <label className="grid gap-2 text-sm">
          Carica {label} (JPEG, PNG o WebP, massimo 5 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file, onUrl);
            }}
          />
        </label>
        <TextField
          label={`Descrizione immagine (testo alternativo) — ${label}`}
          value={alt}
          onChange={onAlt}
        />
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted">
        Crea l’apertura con titolo, sintesi e copertina. Sotto, aggiungi e
        ordina liberamente testo, immagini o blocchi con testo e foto. Tutti gli
        articoli seguono la stessa colonna di lettura, con contenuti allineati a
        sinistra. Il pulsante finale è facoltativo. Le modifiche si salvano con
        “Pubblica contenuti”.
      </p>
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {articles.map((article, index) => (
        <details
          key={index}
          open={index === 0}
          className="rounded-xl border border-hairline bg-white p-5"
        >
          <summary className="cursor-pointer font-bold">
            Articolo {index + 1} · {article.title || "Nuovo articolo"}
          </summary>
          <fieldset disabled={locked} className="mt-5 grid min-w-0 gap-5">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {article.title && (
                <Link
                  href={`/blog/${guideAnchor(article.title)}`}
                  target="_blank"
                  className="underline"
                >
                  Apri articolo pubblicato
                </Link>
              )}
              <button
                type="button"
                disabled={locked || index === 0}
                className="underline disabled:opacity-40"
                onClick={() => moveArticle(index, -1)}
              >
                Sposta articolo su
              </button>
              <button
                type="button"
                disabled={locked || index === articles.length - 1}
                className="underline disabled:opacity-40"
                onClick={() => moveArticle(index, 1)}
              >
                Sposta articolo giù
              </button>
              <button
                type="button"
                className="text-red-700 underline"
                onClick={() => {
                  if (
                    window.confirm(
                      `Rimuovere “${article.title || "Nuovo articolo"}”? La rimozione sarà pubblicata solo al salvataggio.`,
                    )
                  )
                    onChange(articles.filter((_, i) => i !== index));
                }}
              >
                Rimuovi articolo
              </button>
            </div>
            <TextField
              label="Titolo articolo"
              value={article.title}
              onChange={(title) => update(index, { title })}
              required
            />
            <TextField
              label="Sintesi sotto il titolo"
              value={article.caption}
              onChange={(caption) => update(index, { caption })}
              required
              multiline
              maxLength={5000}
            />
            {imageFields(
              article.imageUrl,
              article.imageAlt ?? "",
              (imageUrl) => update(index, { imageUrl }),
              (imageAlt) => update(index, { imageAlt }),
              "copertina",
            )}
            <TextField
              label="Introduzione dell’articolo (facoltativa)"
              value={article.intro ?? ""}
              onChange={(intro) => update(index, { intro })}
              multiline
              maxLength={20000}
            />
            <div className="grid gap-4 border-t pt-5">
              <h3 className="text-lg font-bold">Contenuto dell’articolo</h3>
              {(article.blocks ?? []).map((block, blockIndex) => (
                <div
                  key={blockIndex}
                  className="grid gap-4 rounded-lg border bg-surface-soft p-4"
                >
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <strong>
                      Blocco {blockIndex + 1} ·{" "}
                      {block.type === "text"
                        ? "Testo"
                        : block.type === "image"
                          ? "Immagine"
                          : "Testo e immagine"}
                    </strong>
                    <button
                      type="button"
                      disabled={locked || blockIndex === 0}
                      className="underline disabled:opacity-40"
                      onClick={() => {
                        const next = [...article.blocks!];
                        [next[blockIndex - 1], next[blockIndex]] = [
                          next[blockIndex],
                          next[blockIndex - 1],
                        ];
                        changeBlocks(index, next);
                      }}
                    >
                      Sposta blocco su
                    </button>
                    <button
                      type="button"
                      disabled={
                        locked || blockIndex === article.blocks!.length - 1
                      }
                      className="underline disabled:opacity-40"
                      onClick={() => {
                        const next = [...article.blocks!];
                        [next[blockIndex + 1], next[blockIndex]] = [
                          next[blockIndex],
                          next[blockIndex + 1],
                        ];
                        changeBlocks(index, next);
                      }}
                    >
                      Sposta blocco giù
                    </button>
                    <button
                      type="button"
                      className="text-red-700 underline"
                      onClick={() =>
                        changeBlocks(
                          index,
                          article.blocks!.filter((_, i) => i !== blockIndex),
                        )
                      }
                    >
                      Rimuovi blocco
                    </button>
                  </div>
                  {block.type !== "image" && (
                    <>
                      <TextField
                        label="Titolo sezione (facoltativo)"
                        value={block.heading}
                        onChange={(heading) =>
                          updateBlock(index, blockIndex, { heading })
                        }
                      />
                      <TextField
                        label="Testo — separa i paragrafi con una riga vuota"
                        value={block.text}
                        onChange={(text) =>
                          updateBlock(index, blockIndex, { text })
                        }
                        multiline
                        required
                        maxLength={20000}
                      />
                    </>
                  )}
                  {block.type !== "text" && (
                    <>
                      {imageFields(
                        block.imageUrl,
                        block.alt,
                        (imageUrl) =>
                          updateBlock(index, blockIndex, { imageUrl }),
                        (alt) => updateBlock(index, blockIndex, { alt }),
                        `foto del blocco ${blockIndex + 1}`,
                      )}
                      <TextField
                        label="Didascalia foto (facoltativa)"
                        value={block.caption}
                        onChange={(caption) =>
                          updateBlock(index, blockIndex, { caption })
                        }
                        maxLength={1000}
                      />
                    </>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={locked || (article.blocks?.length ?? 0) >= 40}
                  onClick={() =>
                    changeBlocks(index, [
                      ...(article.blocks ?? []),
                      { type: "text", heading: "", text: "" },
                    ])
                  }
                >
                  Aggiungi testo
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={locked || (article.blocks?.length ?? 0) >= 40}
                  onClick={() =>
                    changeBlocks(index, [
                      ...(article.blocks ?? []),
                      { type: "image", imageUrl: "", alt: "", caption: "" },
                    ])
                  }
                >
                  Aggiungi immagine
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={locked || (article.blocks?.length ?? 0) >= 40}
                  onClick={() =>
                    changeBlocks(index, [
                      ...(article.blocks ?? []),
                      {
                        type: "split",
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
                  Aggiungi testo e immagine
                </button>
              </div>
            </div>
            <div className="grid gap-4 border-t pt-5">
              <h3 className="text-lg font-bold">
                Pulsante finale (facoltativo)
              </h3>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={article.ctaEnabled === true}
                  onChange={(event) =>
                    update(index, { ctaEnabled: event.target.checked })
                  }
                />
                Mostra un pulsante in questo articolo
              </label>
              {article.ctaEnabled && (
                <>
                  <TextField
                    label="Testo del pulsante"
                    value={article.ctaLabel}
                    onChange={(ctaLabel) => update(index, { ctaLabel })}
                    required
                  />
                  <TextField
                    label="Link del pulsante — percorso /pagina oppure URL https://"
                    value={article.ctaHref}
                    onChange={(ctaHref) => update(index, { ctaHref })}
                    required
                    maxLength={1000}
                  />
                </>
              )}
            </div>
          </fieldset>
        </details>
      ))}
      <button
        type="button"
        className="button-secondary"
        disabled={locked || articles.length >= 20}
        onClick={() =>
          onChange([
            ...articles,
            {
              title: "",
              caption: "",
              imageUrl: "",
              imageAlt: "",
              intro: "",
              blocks: [],
              ctaEnabled: false,
              ctaLabel: "",
              ctaHref: "",
            },
          ])
        }
      >
        Crea articolo
      </button>
    </div>
  );
}
