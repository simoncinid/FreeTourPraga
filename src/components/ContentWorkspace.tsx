"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteContentEditor } from "./SiteContentEditor";
import {
  contentSections,
  pageLabels,
  type ContentSection,
} from "@/lib/content-sections";
import type { ContentPage } from "@/lib/platform/model";
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
        void save({
          key: pageKey,
          page: seoOnly ? { ...page, published: true } : page,
        });
      }}
    >
      <h2 className="display-md">
        {seoOnly
          ? "Metadati per i motori di ricerca"
          : pageLabels[pageKey as keyof typeof pageLabels] || pages[pageKey]?.title}
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
      <button className="button-primary" disabled={busy}>
        {seoOnly ? "Salva SEO" : "Salva pagina"}
      </button>
    </form>
  );
}

export function ContentWorkspace({
  content,
  pages,
  detail,
  busy,
  saveSite,
  savePage,
}: {
  content: SiteContent;
  pages: Record<string, ContentPage>;
  detail?: string;
  busy: boolean;
  saveSite: (content: SiteContent) => Promise<unknown>;
  savePage: (body: unknown) => Promise<unknown>;
}) {
  const labels = { ...pageLabels, ...Object.fromEntries(Object.entries(pages).filter(([key]) => key.startsWith("legacy:")).map(([key, page]) => [key, page.title])) };
  const isPage = Boolean(detail && Object.hasOwn(labels, detail));
  const section: ContentSection =
    isPage || detail === "pagine"
      ? "pagine"
      : detail && Object.hasOwn(contentSections, detail)
        ? (detail as ContentSection)
        : "homepage";
  const pageKey = isPage ? detail! : "chi-siamo";
  const metadataKey =
    section === "homepage"
      ? "homepage"
      : section === "blog"
        ? "blog"
        : section === "faq"
          ? "faq"
          : null;
  return (
    <div className="grid gap-6">
      <div>
        <p className="mt-2 text-sm text-muted">
          Ogni area ha un unico editor. I contenuti condivisi si aggiornano in
          tutte le pagine che li utilizzano.
        </p>
      </div>
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
            Qui modifichi solo le pagine del sito. Articoli, homepage e FAQ
            hanno il proprio editor; i recapiti condivisi sono in Dati e
            contatti.
          </p>
          <nav aria-label="Pagine del sito" className="flex flex-wrap gap-2">
            {Object.entries(labels).map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/contenuti/${encodeURIComponent(key)}`}
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
