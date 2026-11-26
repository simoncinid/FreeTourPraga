"use client";

// import { RichTextEditor } from "./RichTextEditor";
// import { InlineRichField } from "./InlineRichField";
import { VisualContentEditor } from "./VisualContentEditor";
import { sampleParagraph, samplePhotos } from "@/lib/content-placeholders";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
// import { ImageSourceField } from "./ImageSourceField";
import { guidePath, guideSlug } from "@/lib/public-paths";
import type { BlogBlock, SiteContent } from "@/lib/platform/content";
import {
  recordsCss as css,
  RecordDrawer,
} from "./AdminRecords";

type Article = SiteContent["gallery"][number];

function sampleBlock(type: BlogBlock["type"]): BlogBlock {
  const text = { heading: "Lorem ipsum", text: sampleParagraph };
  const photo = samplePhotos[type === "split" ? 2 : 1];
  const image = { imageUrl: photo.url, alt: photo.alt, caption: "Lorem ipsum dolor sit amet" };
  if (type === "text") return { type, ...text };
  if (type === "image") return { type, ...image };
  return { type, ...text, ...image, imagePosition: "right" };
}

function newArticle(articles: Article[]): Article {
  let slug = "nuovo-articolo";
  for (let suffix = 2; articles.some((article) =>
    guideSlug(article) === slug || article.slugAliases?.includes(slug)); suffix++)
    slug = `nuovo-articolo-${suffix}`;
  return {
    id: crypto.randomUUID(),
    slug,
    title: "Lorem ipsum dolor sit amet",
    caption: sampleParagraph,
    imageUrl: samplePhotos[0].url,
    imageAlt: samplePhotos[0].alt,
    intro: sampleParagraph,
    blocks: [sampleBlock("text"), sampleBlock("image"), sampleBlock("split")],
    kicker: "Lorem ipsum",
    backLabel: "Tutte le guide",
    footerBackLabel: "Torna a tutte le guide",
    ctaEnabled: true,
    ctaLabel: "Lorem ipsum",
    ctaHref: "/tour",
    channel: "blog",
  };
}

/*
const emptyArticle = (): Article => ({
  title: "",
  caption: "",
  imageUrl: "",
  imageAlt: "",
  intro: "",
  blocks: [{ type: "text", heading: "", text: "" }],
  ctaEnabled: false,
  ctaLabel: "",
  ctaHref: "",
  channel: "blog",
});

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

*/

function channelLabel(channel?: Article["channel"]) {
  return channel === "useful" ? "Informazioni utili" : "Blog";
}

/* Editor precedente.
function ArticleForm({
  article,
  locked,
  notice,
  onNotice,
  onUploading,
  onChange,
}: {
  article: Article;
  locked: boolean;
  notice: string;
  onNotice: (value: string) => void;
  onUploading: (uploading: boolean) => void;
  onChange: (patch: Partial<Article>) => void;
}) {
  function changeBlocks(blocks: BlogBlock[]) {
    onChange({ blocks });
  }
  function updateBlock(blockIndex: number, patch: Partial<BlogBlock>) {
    changeBlocks(
      (article.blocks ?? []).map((block, i) =>
        i === blockIndex ? ({ ...block, ...patch } as BlogBlock) : block,
      ),
    );
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
        onNotice={onNotice}
        onUploading={onUploading}
      />
    );
  }
  return (
    <fieldset disabled={locked} className="articles-drawer-form grid min-w-0 gap-5">
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <label className="grid gap-2 text-sm">
        Elenco
        <select
          className="text-input"
          value={article.channel === "useful" ? "useful" : "blog"}
          onChange={(event) =>
            onChange({
              channel: event.target.value === "useful" ? "useful" : "blog",
            })
          }
        >
          <option value="blog">Blog</option>
          <option value="useful">Informazioni utili</option>
        </select>
      </label>
      <InlineRichField
        label="Titolo articolo"
        required
        html={article.titleHtml}
        text={article.title}
        onChange={(titleHtml, title) => onChange({ title, titleHtml })}
      />
      {article.title && (
        <p className="text-sm text-muted">
          Indirizzo stabile: {guidePath(article)}. Cambiare il titolo conserva
          questo indirizzo.
        </p>
      )}
      <InlineRichField
        label="Sintesi sotto il titolo"
        required
        multiline
        html={article.captionHtml}
        text={article.caption}
        onChange={(captionHtml, caption) => onChange({ caption, captionHtml })}
      />
      <TextField
        label="Kicker sopra il titolo"
        value={article.kicker ?? ""}
        onChange={(kicker) => onChange({ kicker })}
        maxLength={120}
      />
      <TextField
        label="Link indietro (testo)"
        value={article.backLabel ?? ""}
        onChange={(backLabel) => onChange({ backLabel })}
        maxLength={80}
      />
      <TextField
        label="Link a piè di pagina (testo)"
        value={article.footerBackLabel ?? ""}
        onChange={(footerBackLabel) => onChange({ footerBackLabel })}
        maxLength={80}
      />
      <TextField
        label="Titolo SEO"
        value={article.seoTitle ?? ""}
        onChange={(seoTitle) => onChange({ seoTitle })}
        maxLength={200}
      />
      <TextField
        label="Descrizione SEO"
        value={article.seoDescription ?? ""}
        onChange={(seoDescription) => onChange({ seoDescription })}
        multiline
        maxLength={500}
      />
      {imageFields(
        article.imageUrl,
        article.imageAlt ?? "",
        (imageUrl) => onChange({ imageUrl }),
        (imageAlt) => onChange({ imageAlt }),
        "copertina",
      )}
      <RichTextEditor
        label="Introduzione"
        text={article.intro}
        html={article.introHtml}
        onChange={(html, intro) => onChange({ intro, introHtml: html })}
      />
      <div className="grid gap-4 border-t pt-5">
        <h3 className="text-lg font-bold">Contenuto dell’articolo</h3>
        {!(article.blocks ?? []).length && (
          <p className="text-sm text-muted">
            Nessun blocco ancora. Aggiungi testo, un’immagine oppure un blocco
            misto qui sotto.
          </p>
        )}
        {(article.blocks ?? []).map((block, blockIndex) => (
          <div
            key={blockIndex}
            className="grid gap-4 rounded-lg border bg-surface-soft p-4"
          >
            <div className="flex items-center gap-3 text-sm">
              <strong className="min-w-0 flex-1 truncate">
                Blocco {blockIndex + 1} ·{" "}
                {block.type === "text"
                  ? "Testo"
                  : block.type === "image"
                    ? "Immagine"
                    : "Testo e immagine"}
              </strong>
              <div className={css.drawerTitleActions}>
                <button
                  type="button"
                  className={css.icon}
                  aria-label="Sposta blocco su"
                  title="Sposta blocco su"
                  disabled={locked || blockIndex === 0}
                  onClick={() => {
                    const next = [...article.blocks!];
                    [next[blockIndex - 1], next[blockIndex]] = [
                      next[blockIndex],
                      next[blockIndex - 1],
                    ];
                    changeBlocks(next);
                  }}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  className={css.icon}
                  aria-label="Sposta blocco giù"
                  title="Sposta blocco giù"
                  disabled={
                    locked || blockIndex === article.blocks!.length - 1
                  }
                  onClick={() => {
                    const next = [...article.blocks!];
                    [next[blockIndex + 1], next[blockIndex]] = [
                      next[blockIndex],
                      next[blockIndex + 1],
                    ];
                    changeBlocks(next);
                  }}
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  type="button"
                  className={`${css.icon} ${css.danger}`}
                  aria-label="Rimuovi blocco"
                  title="Rimuovi blocco"
                  disabled={locked}
                  onClick={() =>
                    changeBlocks(
                      article.blocks!.filter((_, i) => i !== blockIndex),
                    )
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {block.type !== "image" && (
              <>
                <InlineRichField
                  label="Titolo sezione (facoltativo)"
                  text={block.heading}
                  html={block.headingHtml}
                  onChange={(headingHtml, heading) =>
                    updateBlock(blockIndex, { heading, headingHtml })
                  }
                />
                <RichTextEditor
                  label="Testo della sezione"
                  text={block.text}
                  html={block.html}
                  onChange={(html, text) =>
                    updateBlock(blockIndex, { text, html })
                  }
                />
              </>
            )}
            {block.type !== "text" && (
              <>
                {imageFields(
                  block.imageUrl,
                  block.alt,
                  (imageUrl) => updateBlock(blockIndex, { imageUrl }),
                  (alt) => updateBlock(blockIndex, { alt }),
                  `foto del blocco ${blockIndex + 1}`,
                )}
                <InlineRichField
                  label="Didascalia foto (facoltativa)"
                  text={block.caption}
                  html={block.captionHtml}
                  onChange={(captionHtml, caption) => updateBlock(blockIndex, { caption, captionHtml })}
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
              changeBlocks([
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
              changeBlocks([
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
              changeBlocks([
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
        <h3 className="text-lg font-bold">Pulsante finale (facoltativo)</h3>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={article.ctaEnabled === true}
            onChange={(event) =>
              onChange({ ctaEnabled: event.target.checked })
            }
          />
          Mostra un pulsante in questo articolo
        </label>
        {article.ctaEnabled && (
          <>
            <TextField
              label="Testo del pulsante"
              value={article.ctaLabel}
              onChange={(ctaLabel) => onChange({ ctaLabel })}
              required
            />
            <TextField
              label="Link del pulsante — percorso /pagina oppure URL https://"
              value={article.ctaHref}
              onChange={(ctaHref) => onChange({ ctaHref })}
              required
              maxLength={1000}
            />
          </>
        )}
      </div>
    </fieldset>
  );
}

*/

export function BlogArticleEditor({
  content,
  articles,
  onChange,
  busy,
  onUploading,
  createSignal = 0,
  onCreateHandled,
  publish,
}: {
  content: SiteContent;
  articles: Article[];
  onChange: (articles: Article[]) => void;
  busy: boolean;
  onUploading: (uploading: boolean) => void;
  createSignal?: number;
  onCreateHandled?: () => void;
  publish: () => Promise<unknown>;
}) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Article | null>(null);
  const locked = busy || uploading;

  const query = search.trim().toLocaleLowerCase("it");
  const rows = useMemo(
    () =>
      articles
        .map((article, index) => ({ article, index }))
        .filter(({ article }) => {
          if (channel === "blog" && article.channel === "useful") return false;
          if (channel === "useful" && article.channel !== "useful") return false;
          if (!query) return true;
          return `${article.title} ${article.caption} ${channelLabel(article.channel)}`
            .toLocaleLowerCase("it")
            .includes(query);
        }),
    [articles, channel, query],
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setMobile(mq.matches);
      if (!mq.matches) setExpanded(null);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!createSignal) return;
    const frame = requestAnimationFrame(() => {
      const created = newArticle(articles);
      onChange([...articles, created]);
      setDraft(created);
      setEditing(articles.length);
      onCreateHandled?.();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the header emits one signal per creation
  }, [createSignal]);

  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id.startsWith("articolo-")) return;
      const index = articles.findIndex(
        (article) => `articolo-${guideSlug(article)}` === id,
      );
      if (index < 0) return;
      setEditing(index);
      const article = articles[index];
      const slug = guideSlug(article);
      setDraft({ ...article, slug, id: article.id || `guide:${slug}`, blocks: [...(article.blocks ?? [])] });
      history.replaceState(history.state, "", location.pathname + location.search);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [articles]);

  function openEdit(index: number) {
    const article = articles[index];
    const slug = guideSlug(article);
    setDraft({ ...article, slug, id: article.id || `guide:${slug}`, blocks: [...(article.blocks ?? [])] });
    setEditing(index);
  }

  function closeEdit() {
    setEditing(null);
    setDraft(null);
  }

  function applyDraft(next: Article) {
    if (typeof editing !== "number") return;
    onChange(articles.map((article, i) => (i === editing ? next : article)));
    setDraft(next);
  }

  function moveArticle(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= articles.length) return;
    const next = [...articles];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    if (editing === index) setEditing(target);
    else if (editing === target) setEditing(index);
  }

  function removeArticle(index: number) {
    const article = articles[index];
    if (
      !window.confirm(
        `Rimuovere “${article.title || "Nuovo articolo"}”? La rimozione sarà pubblicata solo al salvataggio.`,
      )
    )
      return;
    onChange(articles.filter((_, i) => i !== index));
    if (editing === index) closeEdit();
  }

  const editingTitle = draft?.title?.trim() || "Articolo";

  return (
    <section className={`${css.center} articles-list-panel`}>
      <div className={`${css.toolbar} ${css.inquiryToolbar}`}>
        <div className={`${css.filters} ${css.inquiryFilters}`}>
          <label className={css.search}>
            <Search size={15} />
            <input
              className="text-input"
              aria-label="Cerca articoli"
              placeholder="Cerca titolo o sintesi"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </label>
          <select
            className="text-input"
            aria-label="Elenco articoli"
            value={channel}
            onChange={(event) => setChannel(event.currentTarget.value)}
          >
            <option value="">Tutti</option>
            <option value="blog">Blog</option>
            <option value="useful">Informazioni utili</option>
          </select>
        </div>
      </div>
      <div className={css.tableArea}>
        {mobile ? (
          <div className={css.inquiryList}>
            {rows.map(({ article, index }) => {
              const open = expanded === index;
              const useful = article.channel === "useful";
              return (
                <article
                  key={index}
                  className={`${css.inquiryItem}${open ? ` ${css.inquiryOpen}` : ""}`}
                >
                  <button
                    type="button"
                    className={css.inquiryToggle}
                    aria-expanded={open}
                    onClick={() =>
                      setExpanded((current) =>
                        current === index ? null : index,
                      )
                    }
                  >
                    <span className={css.inquiryNameRow}>
                      <span className={css.inquiryName}>
                        {article.title || "Nuovo articolo"}
                      </span>
                      <span
                        className={`${css.inquiryDot}${useful ? ` ${css.inquiryDotDone}` : ` ${css.inquiryDotNew}`}`}
                        title={channelLabel(article.channel)}
                        aria-label={channelLabel(article.channel)}
                      />
                    </span>
                    <ChevronDown size={16} aria-hidden />
                  </button>
                  {open && (
                    <div className={css.inquiryBody}>
                      <p className={css.inquiryMeta}>
                        {channelLabel(article.channel)} ·{" "}
                        {article.blocks?.length ?? 0} blocchi
                      </p>
                      {article.caption && (
                        <p className={css.inquiryMessage}>{article.caption}</p>
                      )}
                      <div className={css.inquiryActions}>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => openEdit(index)}
                        >
                          <Pencil size={15} />
                          Modifica
                        </button>
                        {article.title ? (
                          <Link
                            href={guidePath(article)}
                            target="_blank"
                            className="button-secondary"
                          >
                            <Eye size={15} />
                            Apri
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="button-secondary button-danger"
                            onClick={() => removeArticle(index)}
                          >
                            <Trash2 size={15} />
                            Rimuovi
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {!rows.length && (
              <p className={css.empty}>Nessun articolo corrisponde ai filtri.</p>
            )}
          </div>
        ) : (
          <table className={css.table}>
            <colgroup>
              <col />
              <col style={{ width: "22%" }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Elenco</th>
                <th>Blocchi</th>
                <th>
                  <span className="sr-only">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ article, index }) => (
                <tr
                  key={index}
                  className={css.clickable}
                  onClick={() => openEdit(index)}
                >
                  <td>
                    <strong>{article.title || "Nuovo articolo"}</strong>
                    {article.caption && <small>{article.caption}</small>}
                  </td>
                  <td>{channelLabel(article.channel)}</td>
                  <td className={css.number}>{article.blocks?.length ?? 0}</td>
                  <td className={css.actions} onClick={(e) => e.stopPropagation()}>
                    <div>
                      <button
                        type="button"
                        className={css.icon}
                        aria-label={`Modifica ${article.title || "articolo"}`}
                        onClick={() => openEdit(index)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${css.icon} ${css.danger}`}
                        aria-label={`Rimuovi ${article.title || "articolo"}`}
                        onClick={() => removeArticle(index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!mobile && !rows.length && (
          <p className={css.empty}>Nessun articolo corrisponde ai filtri.</p>
        )}
      </div>
      {draft && editing !== null && (
        <RecordDrawer
          title={editingTitle}
          subtitle={`Articolo ${editing + 1}`}
          close={closeEdit}
          locked={locked}
          actions={
            <>
              {draft.title ? (
                <Link
                  href={guidePath(draft)}
                  target="_blank"
                  className={css.icon}
                  aria-label="Apri articolo pubblicato"
                  title="Apri articolo pubblicato"
                >
                  <ArrowUpRight size={15} />
                </Link>
              ) : null}
              <button
                type="button"
                className={css.icon}
                aria-label="Sposta su"
                title="Sposta su"
                disabled={locked || typeof editing !== "number" || editing <= 0}
                onClick={() => {
                  if (typeof editing === "number") moveArticle(editing, -1);
                }}
              >
                <ChevronUp size={15} />
              </button>
              <button
                type="button"
                className={css.icon}
                aria-label="Sposta giù"
                title="Sposta giù"
                disabled={
                  locked ||
                  typeof editing !== "number" ||
                  editing >= articles.length - 1
                }
                onClick={() => {
                  if (typeof editing === "number") moveArticle(editing, 1);
                }}
              >
                <ChevronDown size={15} />
              </button>
              {typeof editing === "number" ? (
                <button
                  type="button"
                  className={`${css.icon} ${css.danger}`}
                  aria-label="Rimuovi articolo"
                  title="Rimuovi articolo"
                  disabled={locked}
                  onClick={() => removeArticle(editing)}
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </>
          }
        >
          <div className="articles-drawer-body">
            <details>
              <summary>Impostazioni articolo</summary>
              <div className="grid gap-3 py-3">
                <label>Elenco
                  <select className="text-input" value={draft.channel ?? "blog"}
                    onChange={(e) => applyDraft({ ...draft, channel: e.target.value === "useful" ? "useful" : "blog" })}>
                    <option value="blog">Blog</option>
                    <option value="useful">Informazioni utili</option>
                  </select>
                </label>
                <label className="flex gap-2">
                  <input type="checkbox" checked={draft.ctaEnabled} onChange={(e) =>
                    applyDraft({ ...draft, ctaEnabled: e.target.checked, ctaLabel: draft.ctaLabel || "Scopri i tour", ctaHref: draft.ctaHref || "/tour" })} />
                  Mostra il pulsante finale
                </label>
                <label>Titolo SEO
                  <input className="text-input" maxLength={250} value={draft.seoTitle ?? ""} onChange={(e) => applyDraft({ ...draft, seoTitle: e.target.value })} />
                </label>
                <label>Descrizione SEO
                  <textarea className="text-input" maxLength={500} value={draft.seoDescription ?? ""} onChange={(e) => applyDraft({ ...draft, seoDescription: e.target.value })} />
                </label>
              </div>
            </details>
            <div className="article-visual-workspace">
              <VisualContentEditor
                key={draft.id || guideSlug(draft)}
                content={{ ...content, gallery: [draft] }}
                pages={{}}
                tours={[]}
                busy={busy}
                save={async () => null}
                articleDraft={{
                  guide: draft,
                  change: applyDraft,
                  locked,
                  onUploading: (next) => {
                    setUploading(next);
                    onUploading(next);
                  },
                }}
              />
            </div>
          </div>
          <footer className={css.drawerFooter}>
            <button
              type="button"
              className="button-secondary"
              disabled={locked}
              onClick={closeEdit}
            >
              Chiudi
            </button>
            <button type="button" className="button-primary" disabled={locked} onClick={async () => {
              if (await publish()) closeEdit();
            }}>Pubblica articoli</button>
          </footer>
        </RecordDrawer>
      )}
    </section>
  );
}
