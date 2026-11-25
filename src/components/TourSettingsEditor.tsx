"use client";
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
    [notice, setNotice] = useState("");
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
        <input
          className="text-input"
          type={type}
          value={String(
            price
              ? Number(t[key] ?? 0) / 100
              : (t[key] ?? (key === "arrivalMinutes" ? 15 : "")),
          )}
          required={required}
          min={type === "number" ? min : undefined}
          max={max}
          step={price ? "0.01" : undefined}
          list={key === "category" ? "tour-category-options" : undefined}
          onChange={(e) =>
            change(
              key,
              price
                ? Math.round(Number(e.target.value) * 100)
                : type === "number"
                  ? Number(e.target.value)
                  : e.target.value,
            )
          }
        />
      </label>
    );
  };
  const textKeys = [
    ["shortDescription", "Descrizione breve"],
    ["description", "Descrizione completa"],
    ...(t.descriptionHtml ? [["descriptionHtml", "HTML importato"]] : []),
    ["highlights", "Punti salienti"],
    ["inclusions", "Servizi inclusi"],
    ["exclusions", "Servizi esclusi"],
    ["safetyNotes", "Informazioni pratiche"],
    ["highlightGalleries", "Foto dei punti salienti"],
  ];
  const textValue =
    copy === "highlightGalleries"
      ? (t.highlightGalleries || []).map((g) => g.join("\n")).join("\n\n")
      : Array.isArray(t[copy as keyof CatalogTour])
        ? (
            t[
              copy as "highlights" | "inclusions" | "exclusions" | "safetyNotes"
            ] || []
          ).join("\n")
        : String(t[copy as keyof CatalogTour] || "");
  function updateText(value: string) {
    change(
      copy as keyof CatalogTour,
      copy === "highlightGalleries"
        ? value
            .split(/\n\s*\n/)
            .map((g) =>
              g
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(0, 4),
            )
            .filter((g) => g.length)
        : ["highlights", "inclusions", "exclusions", "safetyNotes"].includes(
              copy,
            )
          ? value === ""
            ? []
            : value.split("\n")
          : value,
    );
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
          {field("category", "Categoria")}
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
            "arrivalMinutes",
            "Anticipo richiesto (min)",
            "number",
            0,
            240,
          )}
        </div>
        <datalist id="tour-category-options">
          {categories.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <p className={css.hint}>
          La categoria comparirà come tab in homepage se almeno un tour
          pubblicato la utilizza. Salva la scheda prima di intervenire sul
          calendario.
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
        <label className={css.editor}>
          {["highlights", "inclusions", "exclusions", "safetyNotes"].includes(
            copy,
          )
            ? "Un elemento per riga"
            : copy === "highlightGalleries"
              ? "Gruppi separati da una riga vuota · massimo 4 URL per gruppo"
              : "Contenuto"}
          <textarea
            className="text-input"
            value={textValue}
            onChange={(e) => updateText(e.target.value)}
          />
        </label>
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
