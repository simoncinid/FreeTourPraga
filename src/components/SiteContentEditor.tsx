"use client";
import { useState } from "react";
import { BlogArticleEditor } from "./BlogArticleEditor";
import {
  contentFields,
  contentSections,
  type StructuredContentSection,
} from "@/lib/content-sections";
import type { SiteContent } from "@/lib/platform/content";
function Field({
  label,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      {multi ? (
        <textarea
          aria-label={label}
          className="text-input min-h-24"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          aria-label={label}
          className="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
const labels: Record<string, string> = {
  brandName: "Nome del marchio",
  description: "Descrizione generale",
  email: "Email di assistenza",
  phone: "Telefono con prefisso internazionale",
  whatsappNumber: "Numero WhatsApp (solo cifre con prefisso)",
  address: "Punto d’incontro principale",
  supportHours: "Orari assistenza",
  footerText: "Testo del footer",
  footerNote: "Nota finale footer",
  tripAdvisorUrl: "Profilo TripAdvisor",
  tripAdvisorTitle: "Titolo sezione TripAdvisor",
  tripAdvisorBody: "Testo TripAdvisor",
  heroImage: "Immagine principale",
  heroTitle: "Titolo principale",
  heroEyebrow: "Sopratitolo principale",
  heroBody: "Introduzione",
  primaryLabel: "Testo pulsante principale",
  primaryHref: "Destinazione pulsante principale",
  secondaryLabel: "Testo pulsante WhatsApp",
  toursEyebrow: "Sopratitolo tour",
  toursTitle: "Titolo tour",
  toursBody: "Introduzione tour",
  trustEyebrow: "Sopratitolo fiducia",
  trustTitle: "Titolo fiducia",
  trustBody: "Introduzione fiducia",
  galleryEyebrow: "Sopratitolo blog",
  galleryTitle: "Titolo elenco articoli",
  galleryBody: "Introduzione elenco articoli",
  answersTitle: "Titolo risposte rapide",
  answersBody: "Introduzione risposte rapide",
  partnerEyebrow: "Sopratitolo partner",
  partnerTitle: "Titolo partner",
  partnerBody: "Introduzione partner",
  partnerLabel: "Pulsante partner",
  faqTitle: "Titolo pagina FAQ",
  faqEyebrow: "Sopratitolo pagina FAQ",
  faqBody: "Introduzione pagina FAQ",
};
export function SiteContentEditor({
  initial,
  section,
  busy,
  save,
}: {
  initial: SiteContent;
  section: StructuredContentSection;
  busy: boolean;
  save: (content: SiteContent) => Promise<unknown>;
}) {
  const [c, setC] = useState(initial),
    [notice, setNotice] = useState(""),
    [articleUploading, setArticleUploading] = useState(false);
  async function image(file: File, done: (url: string) => void) {
    setArticleUploading(true);
    setNotice("Caricamento foto…");
    try {
      const r = await fetch("/api/platform/admin/media", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      done(d.url);
      setNotice("Foto caricata: pubblica le modifiche per usarla.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Caricamento non riuscito");
    } finally {
      setArticleUploading(false);
    }
  }
  function rows(
    key:
      "faqs" | "answers" | "socialLinks" | "navigation" | "stats" | "pillars",
    fields: string[],
    names: string[],
  ) {
    const group =
      key === "socialLinks" || key === "navigation"
        ? "globals"
        : key === "stats" || key === "pillars"
          ? "home"
          : null;
    const list = (group
      ? c[group][key as never]
      : c[key as "faqs" | "answers"]) as unknown as Record<string, string>[];
    const update = (next: Record<string, string>[]) =>
      setC((p) =>
        group
          ? { ...p, [group]: { ...p[group], [key]: next } }
          : { ...p, [key]: next },
      );
    return (
      <div className="grid gap-5">
        {list.map((item, i) => (
          <div key={i} className="grid gap-4 rounded-xl border p-5">
            {fields.map((f, j) => (
              <Field
                key={f}
                label={names[j]}
                value={item[f]}
                multi={["text", "caption", "a", "answer"].includes(f)}
                onChange={(v) =>
                  update(list.map((x, k) => (k === i ? { ...x, [f]: v } : x)))
                }
              />
            ))}
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="underline text-sm"
                disabled={i === 0}
                onClick={() => {
                  const next = [...list];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  update(next);
                }}
              >
                Sposta su
              </button>
              <button
                type="button"
                className="underline text-sm"
                onClick={() => update(list.filter((_, j) => j !== i))}
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="button-secondary"
          onClick={() =>
            update([
              ...list,
              Object.fromEntries(
                fields.map((f) => [f, f === "href" ? "/tour" : ""]),
              ),
            ])
          }
        >
          Aggiungi elemento
        </button>
      </div>
    );
  }
  function fields(group: "home" | "globals", keys: readonly string[]) {
    return keys.map((key) => (
      <Field
        key={key}
        label={labels[key] || key}
        value={String(
          (c[group] as unknown as Record<string, unknown>)[key] ?? "",
        )}
        multi={/Body|Text|Note|description|trustTitle/i.test(key)}
        onChange={(value) =>
          setC((previous) => ({
            ...previous,
            [group]: { ...previous[group], [key]: value },
          }))
        }
      />
    ));
  }
  const groups = contentFields[section];
  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !articleUploading) save(c);
      }}
    >
      <fieldset
        disabled={busy || articleUploading}
        className="card grid min-w-0 gap-5 p-6"
      >
        <h2 className="display-md">{contentSections[section].label}</h2>
        <p className="text-sm">{contentSections[section].description}</p>
        {notice && <p role="status">{notice}</p>}
        {"globals" in groups && fields("globals", groups.globals)}
        {"home" in groups && fields("home", groups.home)}
        {section === "homepage" && (
          <>
            <label>
              Carica immagine principale
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    void image(file, (url) =>
                      setC((previous) => ({
                        ...previous,
                        home: { ...previous.home, heroImage: url },
                      })),
                    );
                }}
              />
            </label>
            <h3 className="border-t pt-5 text-lg font-bold">
              Dati in evidenza della homepage
            </h3>
            {rows("stats", ["value", "label"], ["Titolo", "Testo"])}
            <h3 className="border-t pt-5 text-lg font-bold">Punti di forza</h3>
            <p className="text-sm text-muted">
              Usati nella homepage e, finché non viene personalizzata, nella
              pagina Chi siamo.
            </p>
            {rows("pillars", ["title", "text"], ["Titolo", "Testo"])}
          </>
        )}
        {section === "blog" && (
          <BlogArticleEditor
            articles={c.gallery}
            onChange={(gallery) =>
              setC((previous) => ({ ...previous, gallery }))
            }
            busy={busy}
            onUploading={setArticleUploading}
          />
        )}
        {section === "faq" && (
          <>
            <h3 className="border-t pt-5 text-lg font-bold">
              Domande della pagina FAQ
            </h3>
            {rows("faqs", ["q", "a"], ["Domanda", "Risposta"])}
            <h3 className="border-t pt-5 text-lg font-bold">
              Risposte rapide nella homepage
            </h3>
            {rows("answers", ["question", "answer"], ["Domanda", "Risposta"])}
          </>
        )}
        {section === "navigazione" && (
          <>
            <h3 className="text-lg font-bold">Menu del sito</h3>
            {rows(
              "navigation",
              ["label", "href"],
              ["Voce menu", "Percorso sul sito"],
            )}
            <h3 className="border-t pt-5 text-lg font-bold">Profili social</h3>
            {rows(
              "socialLinks",
              ["label", "url"],
              ["Social", "URL profilo HTTPS"],
            )}
          </>
        )}
      </fieldset>
      <button className="button-primary" disabled={busy || articleUploading}>
        Pubblica {contentSections[section].label.toLowerCase()}
      </button>
    </form>
  );
}
