"use client";
import { PriceInput } from "./PriceInput";
import { RichTextEditor } from "./RichTextEditor";
import { useState } from "react";
import type { CatalogTour } from "@/lib/platform/model";
import { ImageSourceField, uploadAdminImage } from "./ImageSourceField";
import { AdminNotice } from "./AdminNotice";
import css from "./tour-edit-panels.module.css";
export function TourSettingsEditor({
  tour: t,
  change,
  categories,
  busy,
  onUploading,
}: {
  tour: CatalogTour;
  change: (key: keyof CatalogTour, value: unknown) => void;
  categories: string[];
  busy: boolean;
  onUploading: (busy: boolean) => void;
}) {
  const [group, setGroup] = useState("identity"),
    [copy, setCopy] = useState("shortDescription"),
    [upload, setUpload] = useState(false),
    [notice, setNotice] = useState(""),
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
    const price = String(key).endsWith("PriceCents"),
      required = ["title", "slug", "category", "language"].includes(key);
    return (
      <label key={key} data-tour-setting={key}>
        {label}
        {required ? " *" : ""}
        {price ? (
          <PriceInput cents={Number(t[key] ?? 0)} onChange={(value) => change(key, value ?? 0)} />
        ) : (
          <input
            className="text-input"
            type={type}
            value={String(t[key] ?? (key === "arrivalMinutes" ? 15 : ""))}
            required={required}
            min={type === "number" ? min : undefined}
            max={max}
            list={key === "category" ? "tour-category-options" : undefined}
            onChange={(e) => change(key, type === "number" ? Number(e.target.value) : e.target.value)}
          />
        )}
      </label>
    );
  };
  const textKeys = [
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
  function updateList(field: typeof listFields[number], texts: string[], formatting: (string | null)[]) {
    change(field, texts);
    change("formattedCopy", { ...t.formattedCopy, [field]: formatting });
  }
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
      <nav className={css.subnav} aria-label="Dati e SEO">
        {[
          ["identity", "Dati principali"],
          ["meeting", "Punto d’incontro"],
          ["copy", "Testi e itinerario"],
          ["seo", "SEO"],
          ["cover", "Copertina"],
          ...(!t.priceCategories?.length ? [["legacy", "Prezzi legacy"]] : []),
        ].map(([key, label]) => (
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
      <section
        data-settings-group="identity"
        hidden={group !== "identity"}
        className={css.card}
      >
        <header className={css.sectionHead}>
          <h2>Identità e prenotabilità</h2>
        </header>
        <div className={css.three}>
          {field("title", "Titolo")}
          {field("slug", "Indirizzo pagina (slug)")}
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
          {field("durationLabel", "Durata mostrata in scheda")}
          {field(
            "advanceBookingHours",
            "Anticipo consigliato per prenotare (ore)",
            "number",
            0,
            168,
          )}
          {field(
            "fareRequirements",
            "Documenti richiesti per la tariffa ridotta",
          )}
          {t.isFreeTour &&
            field("suggestedContribution", "Offerta consigliata")}
          {field(
            "maxGuests",
            "Partecipanti per prenotazione",
            "number",
            1,
            10000,
          )}
          {field(
            "bookingCutoffHours",
            "Chiusura prenotazioni (ore prima)",
            "number",
          )}
          {field(
            "bookingCutoffMinutes",
            "Minuti aggiuntivi di chiusura",
            "number",
            0,
            59,
          )}
          {field(
            "arrivalMinutes",
            "Anticipo richiesto (min)",
            "number",
            0,
            240,
          )}
        </div>
        <p className={css.hint}>
          Le categorie non hanno una gestione separata: scegline una esistente
          o creane una nuova qui (o in «Nuovo tour»). Comparirà come tab in
          homepage se almeno un tour pubblicato la utilizza. Salva la scheda
          prima di intervenire sul calendario.
        </p>
      </section>
      <section
        data-settings-group="meeting"
        hidden={group !== "meeting"}
        className={css.card}
      >
        <header className={css.sectionHead}>
          <h2>Incontro e informazioni di partenza</h2>
        </header>
        <div className={css.three}>
          {field("meetingPoint", "Punto d’incontro")}
          {field("meetingAddress", "Indirizzo")}
          {field("meetingInstructions", "Come riconoscere la guida")}
          {field("mapUrl", "Link Google Maps")}
          {field("walkingDifficulty", "Livello di intensità (1–5)", "number", 1, 5)}
          <label>
            Giorni operativi
            <input
              className="text-input"
              value={t.operatingDays || ""}
              disabled={
                t.schedule?.enabled ||
                !!t.calendarRules?.length ||
                !!t.slots.length
              }
              onChange={(e) => change("operatingDays", e.target.value)}
            />
          </label>
          <label>
            Orario mostrato
            <input
              className="text-input"
              value={t.departureTime || ""}
              disabled={
                t.schedule?.enabled ||
                !!t.calendarRules?.length ||
                !!t.slots.length
              }
              onChange={(e) => change("departureTime", e.target.value)}
            />
          </label>
        </div>
        <p className={css.hint}>
          Giorni e orario sono modificabili qui solo per tour senza partenze;
          negli altri casi derivano dalla programmazione.
        </p>
      </section>
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
                    list.map((_, i) => i === index ? html : t.formattedCopy?.[listField]?.[i] ?? null),
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
              change("formattedCopy", { ...t.formattedCopy, shortDescription: html });
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
      <section
        data-settings-group="seo"
        hidden={group !== "seo"}
        className={css.card}
      >
        <header className={css.sectionHead}>
          <h2>Risultati nei motori di ricerca</h2>
        </header>
        {field("seoTitle", "Titolo SEO")}
        <label>
          Descrizione SEO
          <textarea
            className="text-input"
            rows={3}
            value={t.seoDescription || ""}
            onChange={(e) => change("seoDescription", e.target.value)}
          />
        </label>
      </section>
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
      <section
        data-settings-group="legacy"
        hidden={group !== "legacy"}
        className={css.card}
      >
        <header className={css.sectionHead}>
          <h2>Listino precedente alle categorie</h2>
        </header>
        <div className={css.three}>
          {field("basePriceCents", "Prezzo adulti", "number")}
          {field("childPriceCents", "Prezzo bambini", "number")}
          {field("infantPriceCents", "Prezzo infanti", "number")}
          {field("adultMinAge", "Età minima adulti", "number")}
          {field("childMinAge", "Età minima bambini", "number")}
        </div>
      </section>
      {notice && <AdminNotice key={notice} message={notice} />}
    </div>
  );
}
