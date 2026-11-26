"use client";
import { RichTextEditor } from "./RichTextEditor";
import { AdminNotice } from "./AdminNotice";
import { ExperienceGroupsEditor } from "./ExperienceGroupsEditor";
import { NavigationEditor } from "./NavigationEditor";
import { SectionBlocksEditor } from "./SectionBlocksEditor";
import { siteNavigation } from "@/lib/navigation";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BlogArticleEditor } from "./BlogArticleEditor";
import { ImageSourceField } from "./ImageSourceField";
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
  officeAddress: "Sede ufficio (previo appuntamento)",
  castleMeetingAddress: "Ritrovo Castello con interni",
  googleReviewUrl: "Link per lasciare una recensione Google",
  instagramDirectUrl: "Link Instagram Direct",
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
  heroImageMobile: "Immagine hero mobile",
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
            {fields.map((f, j) => key === "faqs" && f === "a" ? (
              <RichTextEditor key={f} label={names[j]} text={item.a} html={item.answerHtml}
                onChange={(answerHtml, a) => update(list.map((x, k) => k === i ? { ...x, a, answerHtml } : x))} />
            ) : (
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
                className="button-secondary button-danger"
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
    return keys.map((key) => {
      if (
        (key === "heroImage" || key === "heroImageMobile") &&
        group === "home"
      ) {
        return (
          <ImageSourceField
            key={key}
            label={labels[key]}
            value={
              key === "heroImage"
                ? c.home.heroImage
                : c.home.heroImageMobile || ""
            }
            disabled={busy || articleUploading}
            required={key === "heroImage"}
            onNotice={setNotice}
            onUploading={setArticleUploading}
            onChange={(value) =>
              setC((previous) => ({
                ...previous,
                home: {
                  ...previous.home,
                  [key]: value,
                },
              }))
            }
          />
        );
      }
      if (/Body$|^footer(?:Text|Note)$|^description$/.test(key)) {
        const formattedKey = `${group}-${key}`;
        return (
          <RichTextEditor key={key} label={labels[key] || key} html={c.formattedText?.[formattedKey]}
            text={String((c[group] as unknown as Record<string, unknown>)[key] ?? "")}
            onChange={(html, text) => setC((previous) => ({
              ...previous,
              [group]: { ...previous[group], [key]: text },
              formattedText: { ...previous.formattedText, [formattedKey]: html },
            }))} />
        );
      }
      return (
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
      );
    });
  }
  function homePanel(
    title: string,
    keys: readonly string[],
    extra?: ReactNode,
    open = false,
  ) {
    return (
      <details open={open}>
        <summary className="title-md">{title}</summary>
        <div className="grid gap-4 pt-4">
          {fields("home", keys)}
          {extra}
        </div>
      </details>
    );
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
        {notice && <AdminNotice key={notice} message={notice} />}
        {"globals" in groups && fields("globals", groups.globals)}
        {"home" in groups &&
          section !== "homepage" &&
          fields("home", groups.home)}
        {section === "homepage" && (
          <>
            {homePanel(
              "Apertura e pulsanti",
              contentFields.homepage.home.filter((k) =>
                /^(hero|primary|secondary)/.test(k),
              ),
              undefined,
              true,
            )}
            {homePanel(
              "Dati in evidenza della homepage",
              [],
              rows("stats", ["value", "label"], ["Titolo", "Testo"]),
            )}
            {homePanel(
              "Le nostre esperienze",
              contentFields.homepage.home.filter((k) => k.startsWith("tours")),
              <>
                <ExperienceGroupsEditor
                  groups={c.home.groups}
                  onChange={(groups) =>
                    setC((p) => ({ ...p, home: { ...p.home, groups } }))
                  }
                />
                <label>
                  Intervallo cambio categorie (secondi)
                  <input
                    className="text-input"
                    type="number"
                    min={3}
                    max={30}
                    value={c.home.carouselIntervalSeconds ?? 5}
                    onChange={(e) =>
                      setC((previous) => ({
                        ...previous,
                        home: {
                          ...previous.home,
                          carouselIntervalSeconds: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </label>
              </>,
            )}
            {homePanel(
              "Perché sceglierci",
              contentFields.homepage.home.filter((k) => k.startsWith("trust")),
              rows("pillars", ["title", "text"], ["Titolo", "Testo"]),
            )}
            <Link className="button-secondary" href="/admin/contenuti/blog">
              Guide e consigli: modifica introduzione e articoli
            </Link>
            <Link className="button-secondary" href="/admin/contenuti/faq">
              Prima di prenotare: modifica domande e risposte
            </Link>
            <Link className="button-secondary" href="/admin/contenuti/identita">
              Punti d’incontro e recapiti condivisi
            </Link>
            <Link
              className="button-secondary"
              href="/admin/contenuti/recensioni"
            >
              Recensioni e collegamenti ufficiali
            </Link>
            {homePanel(
              "Scuole, gruppi e agenzie",
              contentFields.homepage.home.filter((k) =>
                k.startsWith("partner"),
              ),
            )}
            <details>
              <summary className="title-md">
                Offerte tramite servizio clienti
              </summary>
              <div className="grid gap-4 pt-4">
                <Field
                  label="Condizioni offerte"
                  value={c.home.specialOffersNote ?? ""}
                  multi
                  onChange={(specialOffersNote) =>
                    setC((p) => ({
                      ...p,
                      home: { ...p.home, specialOffersNote },
                    }))
                  }
                />
                <label>
                  Valuta offerte
                  <select
                    className="text-input"
                    value={c.home.specialOffersCurrency ?? "EUR"}
                    onChange={(e) =>
                      setC((p) => ({
                        ...p,
                        home: {
                          ...p.home,
                          specialOffersCurrency: e.target.value as
                            "EUR" | "CZK",
                        },
                      }))
                    }
                  >
                    <option value="EUR">EUR</option>
                    <option value="CZK">CZK</option>
                  </select>
                </label>
                {(c.home.specialOffers ?? []).map((o, i) => (
                  <div className="grid gap-2 rounded border p-3" key={i}>
                    <Field
                      label="Tour del pacchetto"
                      value={o.label}
                      onChange={(label) =>
                        setC((p) => ({
                          ...p,
                          home: {
                            ...p.home,
                            specialOffers: p.home.specialOffers?.map((x, j) =>
                              i === j ? { ...x, label } : x,
                            ),
                          },
                        }))
                      }
                    />
                    <label>
                      Prezzo
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="text-input"
                        value={o.priceCents / 100}
                        onChange={(e) =>
                          setC((p) => ({
                            ...p,
                            home: {
                              ...p.home,
                              specialOffers: p.home.specialOffers?.map(
                                (x, j) =>
                                  i === j
                                    ? {
                                        ...x,
                                        priceCents: Math.round(
                                          Number(e.target.value) * 100,
                                        ),
                                      }
                                    : x,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="button-secondary button-danger"
                      onClick={() =>
                        setC((p) => ({
                          ...p,
                          home: {
                            ...p.home,
                            specialOffers: p.home.specialOffers?.filter(
                              (_, j) => j !== i,
                            ),
                          },
                        }))
                      }
                    >
                      Rimuovi offerta
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    setC((p) => ({
                      ...p,
                      home: {
                        ...p.home,
                        specialOffers: [
                          ...(p.home.specialOffers ?? []),
                          { label: "Nuova offerta", priceCents: 0 },
                        ],
                      },
                    }))
                  }
                >
                  Aggiungi offerta
                </button>
              </div>
            </details>
            <SectionBlocksEditor
              blocks={c.home.contentBlocks}
              onChange={(contentBlocks) =>
                setC((p) => ({ ...p, home: { ...p.home, contentBlocks } }))
              }
              onUploading={setArticleUploading}
            />
            <h3 className="border-t pt-5 text-lg font-bold">
              Profili social (footer e Contatti)
            </h3>
            <p className="text-sm text-muted">
              Inserisci gli URL ufficiali quando disponibili. Finché restano i
              link generici delle piattaforme, le icone restano comunque
              pubblicate.
            </p>
            {rows(
              "socialLinks",
              ["label", "url"],
              ["Social", "URL profilo HTTPS"],
            )}
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
            <NavigationEditor
              items={siteNavigation(c)}
              onChange={(navigation) =>
                setC((p) => ({
                  ...p,
                  globals: { ...p.globals, navigation, navigationVersion: 2 },
                }))
              }
            />
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
