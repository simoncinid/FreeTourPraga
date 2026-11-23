"use client";
import {
  VisualContentEditor,
  type VisualContentChrome,
} from "./VisualContentEditor";
import {
  contentEditorSection,
  contentEditorTarget,
  pageEditorId,
  pageEditorKey,
} from "@/lib/content-routing";
import type { Tour } from "@/lib/types";
import { siteNavigation } from "@/lib/navigation";
import { SectionBlocksEditor } from "./SectionBlocksEditor";

import Link from "next/link";
import { useState } from "react";
import { SiteContentEditor } from "./SiteContentEditor";
import {
  contentSections,
  pageLabels,
  type ContentSection,
} from "@/lib/content-sections";
import type { ContentPage, EuropeanPartner } from "@/lib/platform/model";
import type { SiteContent } from "@/lib/platform/content";

function Input({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      {multiline ? (
        <textarea
          aria-label={label}
          className="text-input min-h-40"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          aria-label={label}
          className="text-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function PageEditor({
  pages,
  pageKey,
  busy,
  save,
  seoOnly = false,
}: {
  pages: Record<string, ContentPage>;
  pageKey: string;
  busy: boolean;
  save: (body: unknown) => Promise<unknown>;
  seoOnly?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState<ContentPage>(
    pages[pageKey] || {
      title: "",
      subtitle: "",
      body: "",
      seoTitle: "",
      seoDescription: "",
      published: false,
    },
  );
  return (
    <form
      className="card grid gap-5 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (uploading) return;
        void save({
          key: pageKey,
          page: seoOnly ? { ...page, published: true } : page,
        });
      }}
    >
      <h2 className="display-md">
        {seoOnly
          ? "Metadati per i motori di ricerca"
          : pageLabels[pageKey as keyof typeof pageLabels] ||
            pages[pageKey]?.title}
      </h2>
      {seoOnly ? (
        <p className="text-sm">
          Titolo e descrizione nei risultati di ricerca. I testi visibili si
          modificano esclusivamente nell’editor qui sopra.
        </p>
      ) : (
        <>
          <Input
            label="Titolo pagina"
            value={page.title}
            onChange={(title) =>
              setPage((previous) => ({ ...previous, title }))
            }
          />
          <Input
            label="Sopratitolo pagina"
            value={page.subtitle}
            onChange={(subtitle) =>
              setPage((previous) => ({ ...previous, subtitle }))
            }
          />
          <Input
            label="Testo pagina"
            value={page.body}
            onChange={(body) => setPage((previous) => ({ ...previous, body }))}
            multiline
          />
        </>
      )}
      {!seoOnly && page.benefits && (
        <fieldset className="grid gap-3">
          <legend>Punti di forza</legend>
          {page.benefits.map((b, i) => (
            <div key={i} className="grid gap-2 rounded border p-3">
              <Input
                label={`Titolo punto ${i + 1}`}
                value={b.title}
                onChange={(title) =>
                  setPage((p) => ({
                    ...p,
                    benefits: p.benefits?.map((v, j) =>
                      j === i ? { ...v, title } : v,
                    ),
                  }))
                }
              />
              <Input
                label={`Testo punto ${i + 1}`}
                value={b.text}
                multiline
                onChange={(text) =>
                  setPage((p) => ({
                    ...p,
                    benefits: p.benefits?.map((v, j) =>
                      j === i ? { ...v, text } : v,
                    ),
                  }))
                }
              />
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setPage((p) => ({
                    ...p,
                    benefits: p.benefits?.filter((_, j) => j !== i),
                  }))
                }
              >
                Rimuovi punto
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button-secondary"
            onClick={() =>
              setPage((p) => ({
                ...p,
                benefits: [...(p.benefits ?? []), { title: "", text: "" }],
              }))
            }
          >
            Aggiungi punto
          </button>
        </fieldset>
      )}
      {(!seoOnly || pageKey !== "homepage") && (
        <SectionBlocksEditor
          blocks={page.contentBlocks}
          onChange={(contentBlocks) =>
            setPage((p) => ({ ...p, contentBlocks }))
          }
          onUploading={setUploading}
        />
      )}
      <Input
        label="Titolo SEO"
        value={page.seoTitle}
        onChange={(seoTitle) =>
          setPage((previous) => ({ ...previous, seoTitle }))
        }
      />
      <Input
        label="Descrizione SEO"
        value={page.seoDescription}
        onChange={(seoDescription) =>
          setPage((previous) => ({ ...previous, seoDescription }))
        }
      />
      {!seoOnly && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={page.published}
            onChange={(event) =>
              setPage((previous) => ({
                ...previous,
                published: event.target.checked,
              }))
            }
          />
          Usa questi testi nella pagina pubblica
        </label>
      )}
      <button className="button-primary" disabled={busy || uploading}>
        {seoOnly ? "Salva SEO" : "Salva pagina"}
      </button>
    </form>
  );
}

export function ContentWorkspace({
  content,
  tours,
  partners,
  pages,
  detail,
  busy,
  saveSite,
  savePage,
  saveVisual,
  onChromeChange,
}: {
  content: SiteContent;
  tours: Pick<Tour, "title" | "slug" | "canonicalPath">[];
  pages: Record<string, ContentPage>;
  partners?: EuropeanPartner[];
  detail?: string;
  busy: boolean;
  saveVisual: (body: unknown) => Promise<unknown>;
  saveSite: (content: SiteContent) => Promise<unknown>;
  savePage: (body: unknown) => Promise<unknown>;
  onChromeChange?: (chrome: VisualContentChrome | null) => void;
}) {
  const section: ContentSection = contentEditorSection(detail, pages);
  const pageKey =
    section === "pagine" && detail !== "pagine"
      ? pageEditorKey(detail || "chi-siamo")
      : "chi-siamo";
  const metadataKey =
    section === "homepage"
      ? "homepage"
      : section === "blog"
        ? "blog"
        : section === "faq"
          ? "faq"
          : null;
  if (detail === "articoli")
    return (
      <SiteContentEditor
        initial={content}
        section="blog"
        busy={busy}
        save={saveSite}
      />
    );
  if (!["identita", "navigazione", "recensioni"].includes(section))
    return (
      <VisualContentEditor
        key={detail || "homepage"}
        content={content}
        pages={pages}
        tours={tours}
        partners={partners}
        detail={detail}
        busy={busy}
        save={saveVisual}
        onChromeChange={onChromeChange}
      />
    );
  return (
    <div className="grid gap-6">
      <div>
        <p className="mt-2 text-sm text-muted">
          Ogni area ha un unico editor. I contenuti condivisi si aggiornano in
          tutte le pagine che li utilizzano.
        </p>
      </div>
      <nav
        aria-label="Albero pagine come nel menu pubblico"
        className="card grid gap-3 p-5"
      >
        <Link href="/admin/contenuti/homepage">Homepage</Link>
        {siteNavigation(content, tours).map((n) => {
          const target = (href: string) =>
            contentEditorTarget(href, tours, pages, content);
          return n.children ? (
            <details key={n.label}>
              <summary>{n.label}</summary>
              <div className="grid gap-2 border-l pl-5">
                <Link href={target(n.href)}>Modifica {n.label}</Link>
                {n.children.map((c) => (
                  <Link key={c.href} href={target(c.href)}>
                    {c.label}
                  </Link>
                ))}
              </div>
            </details>
          ) : (
            <Link key={n.href} href={target(n.href)}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Aree contenuti" className="flex flex-wrap gap-2">
        {Object.entries(contentSections).map(([key, item]) => (
          <Link
            key={key}
            href={`/admin/contenuti/${key}`}
            aria-current={section === key ? "page" : undefined}
            className={section === key ? "button-primary" : "button-secondary"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {section === "pagine" ? (
        <>
          <p className="text-sm">
            Solo le pagine del sito. Articoli dal Blog, tour dalla sezione Tour;
            homepage, FAQ e contatti condividono i propri editor.
          </p>
          <nav
            aria-label="Pagine del sito"
            className="flex flex-nowrap gap-2 overflow-x-auto pb-1"
          >
            {Object.entries({
              ...pageLabels,
              ...Object.fromEntries(
                Object.entries(pages)
                  .filter(([k]) => k.startsWith("legacy:"))
                  .map(([k, p]) => [k, p.title]),
              ),
            }).map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/contenuti/${key.startsWith("legacy:") ? pageEditorId(key) : key}`}
                aria-current={pageKey === key ? "page" : undefined}
                className={
                  pageKey === key ? "button-primary" : "button-secondary"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
          <PageEditor
            key={pageKey}
            pages={pages}
            pageKey={pageKey}
            busy={busy}
            save={savePage}
          />
        </>
      ) : (
        <>
          <SiteContentEditor
            key={section}
            initial={content}
            section={section}
            busy={busy}
            save={saveSite}
          />
          {metadataKey && (
            <PageEditor
              key={`seo-${metadataKey}`}
              pages={pages}
              pageKey={metadataKey}
              busy={busy}
              save={savePage}
              seoOnly
            />
          )}
        </>
      )}
    </div>
  );
}
