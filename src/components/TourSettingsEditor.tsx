"use client";
// import { RichTextEditor } from "./RichTextEditor";
// import { InlineRichField } from "./InlineRichField";
import { useState, type ReactNode } from "react";
import type { CatalogTour } from "@/lib/platform/model";
// import { ImageSourceField, uploadAdminImage } from "./ImageSourceField";
// import { AdminNotice } from "./AdminNotice";
import css from "./tour-edit-panels.module.css";

/* Etichette del precedente editor.
type DetailCopy = NonNullable<CatalogTour["detailCopy"]>;

const DETAIL_COPY_FIELDS: [keyof DetailCopy, string, string][] = [
  ["priceLabel", "Etichetta prezzo", "Tariffa intera adulti / Prezzo"],
  ["pricePersonLabel", "Sotto-prezzo", "a persona"],
  ["guidePrefix", "Prefisso lingua", "Guida in"],
  ["navDescrizione", "Nav · Descrizione", "Descrizione"],
  ["navItinerario", "Nav · Itinerario", "Itinerario"],
  ["navInfo", "Nav · Informazioni utili", "Informazioni utili"],
  ["navCancellazione", "Nav · Cancellazione", "Cancellazione"],
  ["navIncontro", "Nav · Punto di incontro", "Punto di incontro"],
  ["navRecensioni", "Nav · Recensioni", "Recensioni"],
  ["headingDescrizione", "Titolo sezione Descrizione", "Descrizione"],
  ["headingItinerario", "Titolo sezione Itinerario", "Itinerario"],
  ["headingInfo", "Titolo Informazioni utili", "Informazioni utili"],
  ["headingIncluso", "Titolo Incluso", "Incluso"],
  ["headingEscluso", "Titolo Non incluso", "Non incluso"],
  ["headingPratiche", "Titolo Informazioni pratiche", "Informazioni pratiche"],
  ["headingCancellazione", "Titolo Cancellazione", "Cancellazione"],
  ["headingRecensioni", "Titolo Recensioni", "Recensioni"],
  ["whatsappTitle", "Titolo box WhatsApp", "Hai dubbi o domande prima di prenotare?"],
  ["whatsappBody", "Testo box WhatsApp", "Il nostro team in italiano…"],
  ["whatsappCta", "Pulsante WhatsApp", "Scrivici su WhatsApp"],
];
*/
const groupsBySection = {
  details: [["identity", "Dati principali"]],
  content: [
    ["visual", "Editor visuale"],
    // ["copy", "Testi e itinerario"],
    // ["labels", "Etichette pagina"],
  ],
  seo: [["seo", "SEO"]],
  /* media: [
    // ["gallery", "Foto aggiuntive"],
    // ["cover", "Copertina"],
  ], */
} as const;

export function TourSettingsEditor({
  tour: t,
  section,
  panels,
  change,
  categories,
  // busy,
  // onUploading,
}: {
  tour: CatalogTour;
  section: keyof typeof groupsBySection;
  panels?: Partial<Record<"visual" | "gallery", ReactNode>>;
  change: (
    key: keyof CatalogTour,
    value:
      | unknown
      | ((prev: CatalogTour[keyof CatalogTour]) => unknown),
  ) => void;
  categories: string[];
  busy: boolean;
  onUploading: (busy: boolean) => void;
}) {
  const groups = groupsBySection[section];
  const [group, setGroup] = useState<string>(groups[0][0]),
    // [copy, setCopy] = useState("shortDescription"),
    // [upload, setUpload] = useState(false),
    // [notice, setNotice] = useState(""),
    [categoryNew, setCategoryNew] = useState(
      () => !categories.includes(t.category) && Boolean(t.category),
    );
  const field = (
    key: keyof CatalogTour,
    label: string,
    type = "text",
    min = 0,
    max?: number,
  ) => {
    const required = key === "slug" || key === "language";
    return (
      <label key={key} data-tour-setting={key}>
        {label}
        {required ? " *" : ""}
        <input
          className="text-input"
          type={type}
          value={String(t[key] ?? (key === "arrivalMinutes" ? 15 : ""))}
          required={required}
          min={type === "number" ? min : undefined}
          max={max}
          onChange={(event) =>
            change(key, type === "number" ? Number(event.target.value) : event.target.value)
          }
        />
      </label>
    );
  };
  /* const textKeys = [
    ["shortDescription", "Descrizione breve"],
    ["description", "Descrizione completa"],
    ["highlights", "Punti salienti"],
    ["inclusions", "Servizi inclusi"],
    ["exclusions", "Servizi esclusi"],
    ["safetyNotes", "Informazioni pratiche"],
    ["highlightGalleries", "Foto dei punti salienti"],
  ];
  const listFields = ["highlights", "inclusions", "exclusions", "safetyNotes"] as const;
  const listField = listFields.find((field) => field === copy);
  const list = listField ? t[listField] ?? [] : [];
  function updateList(
    field: (typeof listFields)[number],
    texts: string[],
    formatting: (string | null)[] | ((prev: (string | null)[] | undefined) => (string | null)[]),
  ) {
    change(field, texts);
    // Solo il campo aggiornato: il merge in TourEditor conserva il resto.
    change("formattedCopy", (prev: CatalogTour["formattedCopy"]) => {
      const copy = prev || {};
      const nextFormatting =
        typeof formatting === "function"
          ? formatting(copy[field])
          : formatting;
      return { [field]: nextFormatting };
    });
  } */
  return (
    <div
      className={css.workspace}
      onInvalidCapture={(event) => {
        const input = event.target as HTMLInputElement;
        const target = input.closest<HTMLElement>("[data-settings-group]")
          ?.dataset.settingsGroup;
        if (target && target !== group) {
          event.preventDefault();
          setGroup(target);
          requestAnimationFrame(() => input.reportValidity());
        }
      }}
    >
      {groups.length > 1 && (
        <nav className={css.subnav} aria-label="Opzioni della scheda">
          {groups.map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={group === key}
              onClick={() => setGroup(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {panels && Object.entries(panels).map(([key, panel]) => (
        <div key={key} className={css.embedded} hidden={group !== key}>
          {panel}
        </div>
      ))}
      {section === "details" && group === "identity" && (
        <div className={css.flags}>
          <label className={css.check}>
            <input
              type="checkbox"
              checked={t.published}
              onChange={(e) => change("published", e.target.checked)}
            />
            Pubblica sul sito
          </label>
          {t.importedFromWordpress && (
            <label className={css.check}>
              <input
                type="checkbox"
                checked={!t.operationalReviewRequired}
                onChange={(e) =>
                  change("operationalReviewRequired", !e.target.checked)
                }
              />
              Prezzi, età, capienza e partenze verificati
            </label>
          )}
        </div>
      )}
      {section === "details" && (
        <section
          data-settings-group="identity"
          hidden={group !== "identity"}
          className={css.card}
        >
          <header className={css.sectionHead}>
            <h2>Identità e caratteristiche del tour</h2>
          </header>
          <div className={css.three}>
            {/* <div data-tour-setting="title" className="col-span-full">
              <InlineRichField
                label="Titolo"
                required
                html={t.formattedCopy?.title}
                text={t.title}
                onChange={(html, plain) => {
                  change("title", plain);
                  change("formattedCopy", {
                    title: plain ? html : "",
                  });
                }}
              />
            </div> */}
            {field("slug", "Indirizzo pagina (slug)")}
            {/* {field("guide", "Guida in card")} */}
            <label data-tour-setting="category">
              Categoria *
              <select
                className="text-input"
                value={
                  categoryNew ||
                  !categories.length ||
                  !String(t.category ?? "").trim() ||
                  !categories.includes(String(t.category ?? ""))
                    ? "__new__"
                    : String(t.category ?? "")
                }
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setCategoryNew(true);
                    if (categories.includes(String(t.category ?? ""))) {
                      change("category", "");
                    }
                    return;
                  }
                  setCategoryNew(false);
                  change("category", e.target.value);
                }}
                required
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="__new__">+ Nuova categoria…</option>
              </select>
            </label>
            {(categoryNew ||
              !categories.length ||
              !String(t.category ?? "").trim() ||
              !categories.includes(String(t.category ?? ""))) && (
              <label data-tour-setting="category-new">
                Nome nuova categoria *
                <input
                  className="text-input"
                  value={String(t.category ?? "")}
                  required
                  placeholder="Es. Gli essenziali"
                  onChange={(e) => {
                    setCategoryNew(true);
                    change("category", e.target.value);
                  }}
                />
              </label>
            )}
            {field("language", "Lingua")}
            {field("durationMinutes", "Durata (min)", "number")}
            {/* {field("durationLabel", "Durata mostrata in scheda")} */}
            <label>
              Tipo di percorso
              <input
                className="text-input"
                value={t.walkingLabel ?? "A piedi"}
                maxLength={80}
                onChange={(e) => change("walkingLabel", e.target.value)}
              />
            </label>
            <label>
              Intensità del percorso
              <select
                className="text-input"
                value={t.walkingDifficulty}
                onChange={(e) =>
                  change("walkingDifficulty", Number(e.target.value))
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} su 5
                  </option>
                ))}
              </select>
            </label>
            <label>
              Animali
              <select
                className="text-input"
                value={
                  t.petsAllowed === undefined ? "" : t.petsAllowed ? "yes" : "no"
                }
                onChange={(e) =>
                  change(
                    "petsAllowed",
                    e.target.value === "" ? undefined : e.target.value === "yes",
                  )
                }
              >
                <option value="">Non indicato</option>
                <option value="yes">Ammessi</option>
                <option value="no">Non ammessi</option>
              </select>
            </label>
            <label>
              Barriere architettoniche
              <select
                className="text-input"
                value={
                  t.architecturalBarriers === undefined
                    ? ""
                    : t.architecturalBarriers
                      ? "yes"
                      : "no"
                }
                onChange={(e) =>
                  change(
                    "architecturalBarriers",
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "yes",
                  )
                }
              >
                <option value="">Non indicato</option>
                <option value="yes">Presenti</option>
                <option value="no">Non segnalate</option>
              </select>
            </label>

          </div>
          <p className={css.hint}>
            Le categorie non hanno una gestione separata: scegline una esistente
            o creane una nuova qui (o in «Nuovo tour»). Comparirà come tab in
            homepage se almeno un tour pubblicato la utilizza. Salva la scheda
            prima di intervenire sul calendario.
          </p>
        </section>
      )}
      {section === "details" && (
        <section
          data-settings-group="identity"
          className={css.card}
        >
          <header className={css.sectionHead}>
            <h2>Incontro e informazioni di partenza</h2>
          </header>
          <div className={css.three}>
            {field("mapUrl", "Link Google Maps")}
            {field(
              "arrivalMinutes",
              "Anticipo richiesto (min)",
              "number",
              0,
              240,
            )}
          </div>
        </section>
      )}
      {/* {section === "content" && (
        <section
          data-settings-group="copy"
          hidden={group !== "copy"}
          className={`${css.card} ${copy === "shortDescription" ? css.shortText : ["highlights", "inclusions", "exclusions", "safetyNotes"].includes(copy) ? css.listText : css.settingsCard}`}
        >
          <div className={css.textControls}>
            <select
              className="text-input"
              aria-label="Testo del tour da modificare"
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
            >
              {textKeys.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {copy === "highlightGalleries" ? (
            <label className={css.editor}>
              Gruppi separati da una riga vuota · massimo 4 URL per gruppo
              <textarea className="text-input"
                value={(t.highlightGalleries || []).map((group) => group.join("\n")).join("\n\n")}
                onChange={(event) => change("highlightGalleries", event.target.value.split(/\n\s*\n/)
                  .map((group) => group.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4))
                  .filter((group) => group.length))} />
            </label>
          ) : listField ? (
            <div className="grid gap-4">
              {list.map((item, index) => (
                <div key={index} className="grid gap-2 rounded border p-3">
                  <RichTextEditor label={`Voce ${index + 1}`} text={item} html={t.formattedCopy?.[listField]?.[index] ?? undefined}
                    onChange={(html, plain) => updateList(
                      listField,
                      list.map((text, i) => i === index ? plain : text),
                      (prev) => list.map((_, i) =>
                        i === index ? html : prev?.[i] ?? null,
                      ),
                    )} />
                  <button type="button" className="button-secondary button-danger justify-self-start"
                    onClick={() => {
                      updateList(listField, list.filter((_, i) => i !== index),
                        list.map((_, i) => t.formattedCopy?.[listField]?.[i] ?? null).filter((_, i) => i !== index));
                      if (listField === "highlights" && t.highlightGalleries)
                        change("highlightGalleries", t.highlightGalleries.filter((_, i) => i !== index));
                      if (listField === "highlights" && t.itineraryGroups)
                        change("itineraryGroups", t.itineraryGroups.map((group) => ({
                          ...group, start: group.start > index ? group.start - 1 : group.start,
                        })).filter((group, i, groups) => group.start < list.length - 1 &&
                          groups.findIndex((item) => item.start === group.start) === i));
                    }}>Rimuovi voce</button>
                </div>
              ))}
              <button type="button" className="button-secondary justify-self-start" disabled={list.length >= 30}
                onClick={() => updateList(listField, [...list, "Nuova voce"],
                  [...list.map((_, i) => t.formattedCopy?.[listField]?.[i] ?? null), null])}>Aggiungi voce</button>
            </div>
          ) : copy === "description" ? (
            <RichTextEditor key={copy} label="Descrizione completa" html={t.descriptionHtml} text={t.description}
              onChange={(html, plain) => { change("descriptionHtml", html); change("description", plain); }} />
          ) : (
            <RichTextEditor key={copy} label="Descrizione breve" html={t.formattedCopy?.shortDescription} text={t.shortDescription}
              onChange={(html, plain) => {
                change("shortDescription", plain);
                change("formattedCopy", {
                  shortDescription: plain ? html : "",
                });
              }} />
          )}
          {copy === "highlightGalleries" && (
            <div className={css.upload}>
              <label>
                Carica foto e aggiungile all’ultimo gruppo (JPEG, PNG o WebP;
                massimo 5 MB)
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || upload}
                  onChange={async (event) => {
                    const files = Array.from(event.currentTarget.files || []);
                    event.currentTarget.value = "";
                    if (!files.length) return;
                    setUpload(true);
                    onUploading(true);
                    setNotice("Caricamento foto punti salienti…");
                    try {
                      const urls: string[] = [];
                      for (const file of files)
                        urls.push(await uploadAdminImage(file));
                      const groups = (t.highlightGalleries || []).map((g) => [
                        ...g,
                      ]);
                      for (const url of urls) {
                        if (
                          !groups.length ||
                          groups[groups.length - 1].length >= 4
                        )
                          groups.push([]);
                        groups[groups.length - 1].push(url);
                      }
                      change("highlightGalleries", groups);
                      setNotice("Foto aggiunte. Salva il tour per pubblicarle.");
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : "Errore caricamento",
                      );
                    } finally {
                      setUpload(false);
                      onUploading(false);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </section>
      )}
      {section === "content" && (
        <section
          data-settings-group="labels"
          hidden={group !== "labels"}
          className={css.card}
        >
          <header className={css.sectionHead}>
            <h2>Etichette della pagina tour</h2>
          </header>
          <p className={css.hint}>
            Testi di navigazione, titoli sezione e box WhatsApp. Vuoto = testo
            predefinito italiano.
          </p>
          <div className={css.three}>
            {DETAIL_COPY_FIELDS.map(([key, label, fallback]) => (
              <label key={key}>
                {label}
                <input
                  className="text-input"
                  value={t.detailCopy?.[key] || fallback}
                  onChange={(event) =>
                    change("detailCopy", {
                      ...t.detailCopy,
                      [key]:
                        event.target.value === fallback
                          ? ""
                          : event.target.value,
                    })
                  }
                />
              </label>
            ))}
          </div>
        </section>
      )} */}
      {section === "seo" && (
        <section
          data-settings-group="seo"
          hidden={group !== "seo"}
          className={css.card}
        >
          <header className={css.sectionHead}>
            <h2>Risultati nei motori di ricerca</h2>
          </header>
          <label data-tour-setting="seoTitle">
            Titolo SEO
            <input
              className="text-input"
              value={t.seoTitle || t.title || ""}
              onChange={(e) =>
                change(
                  "seoTitle",
                  e.target.value === t.title ? "" : e.target.value,
                )
              }
            />
          </label>
          <label>
            Descrizione SEO
            <textarea
              className="text-input"
              rows={3}
              value={t.seoDescription || t.shortDescription || ""}
              onChange={(e) =>
                change(
                  "seoDescription",
                  e.target.value === t.shortDescription ? "" : e.target.value,
                )
              }
            />
          </label>
          <label>
            Parole chiave SEO (separate da virgola)
            <input
              className="text-input"
              value={(t.seoKeywords ?? []).join(", ")}
              onChange={(e) =>
                change(
                  "seoKeywords",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
        </section>
      )}
      {/* {section === "media" && (
        <section
          data-settings-group="cover"
          hidden={group !== "cover"}
          className={`${css.card} ${css.cover}`}
        >
          <ImageSourceField
            label="Foto copertina"
            value={t.imageUrl}
            required
            disabled={busy || upload}
            onUploading={onUploading}
            onNotice={setNotice}
            onChange={(imageUrl) => change("imageUrl", imageUrl)}
          />
        </section>
      )}
      {notice && <AdminNotice key={notice} message={notice} />} */}
    </div>
  );
}
