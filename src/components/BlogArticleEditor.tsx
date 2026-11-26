"use client";
import { CONTENT_SECTION_STRUCTURE_ENABLED } from "@/lib/content-policy";

import { RichTextEditor } from "./RichTextEditor";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ImageSourceField } from "./ImageSourceField";
import { guidePath, guideSlug } from "@/lib/public-paths";
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
  useEffect(() => {
    const open = () => {
      const element = document.getElementById(
        decodeURIComponent(location.hash.slice(1)),
      );
      if (element instanceof HTMLDetailsElement) {
        element.open = true;
        element.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [articles.length]);
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
        i === blockIndex
          ? ({ ...block, ...patch } as BlogBlock)
          : block,
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
  function imageFields(
    imageUrl: string,
    alt: string,
    onUrl: (url: string) => void,
    onAlt: (alt: string) => void,
    label: string,
  ) {
    return (
      <ImageSourceField
        label={label}
        value={imageUrl}
        alt={alt}
        required
        disabled={locked}
        onChange={onUrl}
        onAltChange={onAlt}
        onNotice={setNotice}
        onUploading={(next) => {
          setUploading(next);
          onUploading(next);
        }}
      />
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
          id={`articolo-${guideSlug(article)}`}
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
                  href={guidePath(article)}
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
                className="button-secondary button-danger"
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
            {article.title && (
              <p className="text-sm text-muted">
                Indirizzo stabile: {guidePath(article)}. Cambiare il titolo
                conserva questo indirizzo.
              </p>
            )}
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
            <RichTextEditor label="Introduzione" text={article.intro} html={article.introHtml}
              onChange={(html, intro) => update(index, { intro, introHtml: html })} />
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
                    {CONTENT_SECTION_STRUCTURE_ENABLED && (
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
                    )}
                    {CONTENT_SECTION_STRUCTURE_ENABLED && (
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
                    )}
                    {CONTENT_SECTION_STRUCTURE_ENABLED && (
                      <button
                        type="button"
                        className="button-secondary button-danger"
                        onClick={() =>
                          changeBlocks(
                            index,
                            article.blocks!.filter((_, i) => i !== blockIndex),
                          )
                        }
                      >
                        Rimuovi blocco
                      </button>
                    )}
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
                      <RichTextEditor label="Testo della sezione" text={block.text} html={block.html}
                        onChange={(html, text) => updateBlock(index, blockIndex, { text, html })} />
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
                {CONTENT_SECTION_STRUCTURE_ENABLED && (
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
                )}
                {CONTENT_SECTION_STRUCTURE_ENABLED && (
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
                )}
                {CONTENT_SECTION_STRUCTURE_ENABLED && (
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
                )}
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
        disabled={locked || articles.length >= 100}
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
