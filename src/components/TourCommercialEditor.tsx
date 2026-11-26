"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PriceInput } from "./PriceInput";
import { useState } from "react";
import { TourPackageSelect } from "./TourPackageSelect";
import type { CatalogTour } from "@/lib/platform/model";
import type { CommissionRule, PriceCategory } from "@/lib/types";
import { categoriesFor } from "@/lib/participant-pricing";
import { pragueLocal } from "@/lib/platform/time";
import { isFreeTour } from "@/lib/tour-rules";
import { CountInput } from "./CountInput";
import css from "./tour-edit-panels.module.css";
export function TourCommercialEditor({
  tour: t,
  availableTours,
  change,
  section,
}: {
  section: "categories" | "rules" | "commissions";
  tour: CatalogTour;
  availableTours: CatalogTour[];
  change: (key: keyof CatalogTour, value: unknown) => void;
}) {
  const today = pragueLocal(new Date().toISOString()).slice(0, 10);
  const [offerFrom, setOfferFrom] = useState(today);
  const [offerTo, setOfferTo] = useState(today);
  const [offerPercent, setOfferPercent] = useState(10);
  const [categoryPage, setCategoryPage] = useState(0);
  const [rulePage, setRulePage] = useState(0);
  const categories = categoriesFor(t),
    rules = t.commissionRules ?? [];
  const currentCategoryPage = Math.min(
    categoryPage,
    Math.max(0, Math.ceil(categories.length / 3) - 1),
  );
  const currentRulePage = Math.min(rulePage, Math.max(0, rules.length - 1));
  const setCategory = (i: number, patch: Partial<PriceCategory>) =>
    change(
      "priceCategories",
      categories.map((c, j) => (i === j ? { ...c, ...patch } : c)),
    );
  const setRule = (i: number, patch: Partial<CommissionRule>) =>
    change(
      "commissionRules",
      rules.map((r, j) => (i === j ? { ...r, ...patch } : r)),
    );
  return (
    <>
      <section
        data-tour-panel="categories"
        hidden={section !== "categories"}
        className="card tour-prices grid gap-5 p-6"
        onInvalidCapture={(e) => {
          const index = Number(
            (e.target as HTMLElement).closest<HTMLElement>(
              "[data-category-index]",
            )?.dataset.categoryIndex || 0,
          );
          const nextPage = Math.floor(index / 3);
          if (nextPage !== currentCategoryPage) {
            e.preventDefault();
            setCategoryPage(nextPage);
            requestAnimationFrame(() =>
              (e.target as HTMLInputElement).reportValidity(),
            );
          }
        }}
      >
        <h2 className="display-md">Categorie e prezzi</h2>
        <div className={css.three}>
          <label>
            Tipo di tour
            <select
              className="text-input"
              value={isFreeTour(t) ? "free" : "paid"}
              onChange={(e) => {
                const free = e.target.value === "free";
                change("isFreeTour", free);
                change("priceLabel", free ? "Offerta libera" : "");
                if (free) {
                  change("basePriceCents", 0);
                  change("childPriceCents", 0);
                  change("infantPriceCents", 0);
                }
              }}
            >
              <option value="paid">A pagamento</option>
              <option value="free">Free tour · offerta libera</option>
            </select>
          </label>
          <label>
            Valuta
            <select
              className="text-input"
              value={t.currency ?? "EUR"}
              onChange={(event) => change("currency", event.target.value)}
            >
              <option value="EUR">EUR — Euro</option>
              <option value="CZK">CZK — Corona ceca</option>
            </select>
          </label>
          {/* <label>
            Documenti richiesti per la tariffa ridotta
            <input className="text-input" value={t.fareRequirements ?? ""}
              onChange={(event) => change("fareRequirements", event.target.value)} />
          </label> */}
          {t.isFreeTour && (
            <label>
              Offerta consigliata
              <input className="text-input" value={t.suggestedContribution ?? ""}
                onChange={(event) => change("suggestedContribution", event.target.value)} />
            </label>
          )}
        </div>
        <p>
          Ogni categoria compare nella prenotazione. Età e condizioni possono
          sovrapporsi: il cliente sceglie la categoria applicabile per ciascuna
          persona.
        </p>
        <div className="price-category-grid">
          {categories.map((c, i) => (
            <fieldset
              data-category-index={i}
              hidden={
                Math.floor(i / 3) !==
                Math.min(
                  categoryPage,
                  Math.max(0, Math.ceil(categories.length / 3) - 1),
                )
              }
              className="grid gap-3 rounded border p-4"
              key={c.id}
            >
              <legend>Categoria {i + 1}</legend>
              <label>
                Nome *
                <input
                  className="text-input"
                  required
                  value={c.label}
                  onChange={(e) => setCategory(i, { label: e.target.value })}
                />
              </label>
              <div className="form-grid">
                <label>
                  Prezzo ({t.currency ?? "EUR"}) *
                  <PriceInput required cents={c.priceCents}
                    onChange={(priceCents) => setCategory(i, { priceCents: priceCents ?? 0 })} />
                </label>
                {t.currency === "CZK" && (
                  <label>
                    Equivalente indicativo in euro
                    <PriceInput optional cents={c.estimatedEuroCents}
                      onChange={(estimatedEuroCents) => setCategory(i, { estimatedEuroCents })} />
                  </label>
                )}
                <label>
                  Età min
                  <input
                    className="text-input"
                    type="number"
                    min={0}
                    max={120}
                    value={c.minAge ?? ""}
                    onChange={(e) =>
                      setCategory(i, {
                        minAge:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Età max
                  <input
                    className="text-input"
                    type="number"
                    min={0}
                    max={120}
                    value={c.maxAge ?? ""}
                    onChange={(e) =>
                      setCategory(i, {
                        maxAge:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Condizioni
                <input
                  className="text-input"
                  value={c.description ?? ""}
                  onChange={(e) =>
                    setCategory(i, { description: e.target.value })
                  }
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...categories];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    change("priceCategories", next);
                  }}
                >
                  Sposta su
                </button>
                <button
                  type="button"
                  className="button-secondary button-danger"
                  disabled={categories.length === 1}
                  onClick={() =>
                    change(
                      "priceCategories",
                      categories.filter((_, j) => j !== i),
                    )
                  }
                >
                  Rimuovi categoria
                </button>
              </div>
            </fieldset>
          ))}
        </div>
        <div className="admin-pagination">
          <span>
            Pagina{" "}
            {Math.min(
              categoryPage + 1,
              Math.max(1, Math.ceil(categories.length / 3)),
            )}{" "}
            di {Math.max(1, Math.ceil(categories.length / 3))}
          </span>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina precedente"
            disabled={currentCategoryPage === 0}
            onClick={() => setCategoryPage(currentCategoryPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina successiva"
            disabled={
              currentCategoryPage >= Math.ceil(categories.length / 3) - 1
            }
            onClick={() => setCategoryPage(currentCategoryPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setCategoryPage(Math.floor(categories.length / 3));
            change("priceCategories", [
              ...categories,
              {
                id: crypto.randomUUID(),
                label: "Nuova categoria",
                priceCents: 0,
              },
            ]);
          }}
        >
          Aggiungi categoria
        </button>
        <label>
          <input
            type="checkbox"
            checked={t.onlineDiscounts !== false}
            onChange={(e) => change("onlineDiscounts", e.target.checked)}
          />{" "}
          Consenti offerte last-minute su questo tour
        </label>
      </section>
      {!t.priceCategories?.length && (
        <section data-tour-panel="categories" hidden={section !== "categories"}
          className="card grid gap-4 p-6">
          <h2 className="display-md">Listino precedente alle categorie</h2>
          <div className={css.three}>
            {([
              ["basePriceCents", "Prezzo adulti"],
              ["childPriceCents", "Prezzo bambini"],
              ["infantPriceCents", "Prezzo infanti"],
            ] as const).map(([key, label]) => (
              <label key={key}>
                {label}
                <PriceInput cents={t[key] ?? 0} onChange={(value) => change(key, value ?? 0)} />
              </label>
            ))}
            {([
              ["adultMinAge", "Età minima adulti"],
              ["childMinAge", "Età minima bambini"],
            ] as const).map(([key, label]) => (
              <label key={key}>
                {label}
                <input className="text-input" type="number" min={0} value={t[key] ?? ""}
                  onChange={(event) => change(key, Number(event.target.value))} />
              </label>
            ))}
          </div>
        </section>
      )}
      <section
        data-tour-panel="categories"
        hidden={section !== "categories"}
        className="card tour-payments grid gap-4 p-6"
      >
        <h2 className="display-md">Pagamenti</h2>
        <p>
          Il checkout pubblico usa WhatsApp. Questi metodi si applicano alle
          prenotazioni che indicano esplicitamente contanti o bonifico.
        </p>
        {(["cash", "bank_transfer"] as const).map((method) => (
          <label key={method}>
            <input
              type="checkbox"
              checked={(t.paymentMethods ?? ["cash"]).includes(method)}
              onChange={(e) =>
                change(
                  "paymentMethods",
                  e.target.checked
                    ? [...(t.paymentMethods ?? ["cash"]), method]
                    : (t.paymentMethods ?? ["cash"]).filter(
                        (m) => m !== method,
                      ),
                )
              }
            />{" "}
            {method === "cash" ? "Contanti sul posto" : "Bonifico bancario"}
          </label>
        ))}
        {t.paymentMethods?.length === 0 && (
          <p role="alert">Seleziona almeno un metodo di pagamento.</p>
        )}
        <label>
          Istruzioni bonifico (beneficiario, IBAN e scadenza)
          <textarea
            className="text-input"
            maxLength={5000}
            value={t.paymentInstructions ?? ""}
            required={t.paymentMethods?.includes("bank_transfer")}
            onChange={(e) => change("paymentInstructions", e.target.value)}
          />
        </label>
      </section>
      <section data-tour-panel="categories" hidden={section !== "categories"} className="card grid gap-4 p-6">
        <header className={css.sectionHead}>
          <div>
            <h2>Offerte</h2>
            <p>Sconto in percentuale, valido solo nel periodo indicato per questo tour.</p>
          </div>
        </header>
        <ul>
          {(t.seasonalOffers ?? []).map((offer) => (
            <li key={offer.id}>
              −{offer.percent}% dal {offer.from.split("-").reverse().join("/")} al{" "}
              {offer.to.split("-").reverse().join("/")}{" "}
              <button
                type="button"
                className="button-secondary button-danger"
                onClick={() =>
                  change(
                    "seasonalOffers",
                    (t.seasonalOffers ?? []).filter((item) => item.id !== offer.id),
                  )
                }
              >
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
        <div className={css.three}>
          <label>
            Dal
            <input className="text-input" type="date" value={offerFrom} onChange={(e) => setOfferFrom(e.target.value)} />
          </label>
          <label>
            Al
            <input className="text-input" type="date" min={offerFrom} value={offerTo} onChange={(e) => setOfferTo(e.target.value)} />
          </label>
          <label>
            Sconto %
            <input className="text-input" type="number" min={1} max={100} value={offerPercent} onChange={(e) => setOfferPercent(Number(e.target.value))} />
          </label>
        </div>
        <button
          type="button"
          className="button-primary"
          disabled={!offerFrom || !offerTo || offerFrom > offerTo || offerPercent < 1}
          onClick={() =>
            change("seasonalOffers", [
              ...(t.seasonalOffers ?? []),
              {
                id: crypto.randomUUID(),
                from: offerFrom,
                to: offerTo,
                percent: offerPercent,
              },
            ])
          }
        >
          Aggiungi offerta
        </button>
      </section>
      <section data-tour-panel="rules" hidden={section !== "rules"}
        className="card grid gap-4 p-6">
        <h2 className="display-md">Limiti e anticipo di prenotazione</h2>
        <div className={css.three}>
          <label>
            Partecipanti per prenotazione
            <CountInput value={Number(t.maxGuests) || undefined} min={1} max={10000}
              placeholder="Es. 25" required onChange={(value) => change("maxGuests", value)} />
          </label>
          <label>
            Anticipo consigliato per prenotare (ore)
            <input className="text-input" type="number" min={0} max={168}
              value={t.advanceBookingHours ?? ""}
              onChange={(event) => change("advanceBookingHours", Number(event.target.value))} />
          </label>
          <label>
            Prenotabile fino a (ore prima)
            <input
              className="text-input"
              type="number"
              min={0}
              max={168}
              value={t.bookingCutoffHours}
              onChange={(e) => change("bookingCutoffHours", Number(e.target.value))}
            />
          </label>
          <label>
            Minuti aggiuntivi
            <input
              className="text-input"
              type="number"
              min={0}
              max={59}
              value={t.bookingCutoffMinutes ?? 0}
              onChange={(e) =>
                change("bookingCutoffMinutes", Number(e.target.value))
              }
            />
          </label>
          <label>
            Minimo partecipanti per la partenza
            <input
              className="text-input"
              type="number"
              min={1}
              max={10000}
              value={t.minParticipants ?? ""}
              onChange={(e) =>
                change(
                  "minParticipants",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </label>
        </div>
      </section>
      <section
        data-tour-panel="rules"
        hidden={section !== "rules"}
        className="card tour-group-rules grid gap-4 p-6"
      >
        <h2 className="display-md">Regole gruppi Free Tour</h2>
        <label>
          Modalità
          <select
            className="text-input"
            value={t.freeGroupMode ?? "fixed"}
            onChange={(e) => change("freeGroupMode", e.target.value)}
          >
            <option value="fixed">Tariffa fissa oltre soglia</option>
            <option value="contact">
              Contattare il servizio clienti oltre soglia
            </option>
            <option value="none">Offerta libera per tutti i gruppi</option>
          </select>
        </label>
        <label>
          Soglia partecipanti
          <input
            className="text-input"
            type="number"
            min={0}
            max={10000}
            value={t.freeGroupLimit ?? 6}
            onChange={(e) => change("freeGroupLimit", Number(e.target.value))}
          />
        </label>
        <label>
          Tariffa per persona oltre soglia ({t.currency ?? "EUR"})
          <PriceInput cents={t.freeGroupPriceCents ?? 1200}
            onChange={(value) => change("freeGroupPriceCents", value ?? 0)} />
        </label>
      </section>
      <section data-tour-panel="rules" hidden={section !== "rules"}
        className="card grid gap-4 p-6">
        <h2 className="display-md">Policy di cancellazione</h2>
        {/* <label className="grid gap-2">
          Clausola di cancellazione (tour)
          <textarea
            className="text-input"
            rows={5}
            maxLength={4000}
            placeholder="Vuoto = usa la clausola globale delle Impostazioni"
            value={t.cancellationClause ?? ""}
            onChange={(e) => change("cancellationClause", e.target.value)}
          />
          <span className="text-sm">
            Se lasci vuoto, sul sito e nelle email compare la clausola globale.
          </span>
        </label> */}
        <div className={css.three}>
          {(
            [
              [
                "cancellationHours",
                "Rimborso automatico: ore gratuite",
                0,
                720,
                24,
              ],
              [
                "lateRefundPercent",
                "Rimborso automatico dopo il termine (%)",
                0,
                100,
                0,
              ],
            ] as const
          ).map(([key, label, min, max, fallback]) => (
            <label key={key}>
              {label}
              <input
                className="text-input"
                type="number"
                min={min}
                max={max}
                value={t[key] ?? fallback}
                onChange={(e) => change(key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </section>
      <section
        data-tour-panel="commissions"
        hidden={section !== "commissions"}
        className="card tour-commission-card grid gap-4 p-6"
      >
        <h2 className="display-md">Commissioni affiliati</h2>
        <p>
          Fisso per persona, percentuale sul totale pagato per questo tour. Il
          pacchetto applica la regola a ciascun tour, senza duplicare il totale.
          Maturazione dopo la fine della visita; cancellazioni e assenze
          escluse.
        </p>
        <div>
          <TourPackageSelect
            options={availableTours
              .filter((v) => v.id !== t.id)
              .map((v) => ({ value: v.slug, label: v.title }))}
            value={t.commissionPackageWith ?? []}
            onChange={(value) => change("commissionPackageWith", value)}
          />
          <small>
            Solo un abbinamento selezionato nello stesso ordine applica la
            regola pacchetto. Nessuna selezione = tour singolo. Non applica
            sconti al cliente.
          </small>
        </div>
        {rules.map((r, i) => (
          <fieldset
            hidden={i !== currentRulePage}
            className="tour-commission-rule grid gap-3 rounded border p-4"
            key={i}
            onInvalidCapture={(event) => {
              if (rulePage !== i) {
                event.preventDefault();
                setRulePage(i);
                const input = event.target as HTMLInputElement;
                requestAnimationFrame(() => input.reportValidity());
              }
            }}
          >
            <legend>Regola {i + 1}</legend>
            <label>
              Tipo affiliato *
              <input
                className="text-input"
                list={`commission-affiliate-types-${i}`}
                value={r.affiliateType}
                onChange={(e) => setRule(i, { affiliateType: e.target.value })}
                maxLength={80}
                required
              />
              <datalist id={`commission-affiliate-types-${i}`}>
                {[
                  "guide",
                  "agency",
                  "hotel",
                  "promoter",
                  ...rules.map((r) => r.affiliateType),
                ]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .map((v) => (
                    <option key={v} value={v} />
                  ))}
              </datalist>
            </label>
            <label>
              Codice affiliato
              <input
                className="text-input"
                placeholder="Tutti gli affiliati del tipo"
                title="Lascia vuoto per applicare la regola a tutti gli affiliati del tipo"
                value={r.affiliateCode ?? ""}
                onChange={(e) =>
                  setRule(i, { affiliateCode: e.target.value.toUpperCase() })
                }
              />
            </label>
            <label>
              Prodotto
              <select
                className="text-input"
                value={r.product}
                onChange={(e) =>
                  setRule(i, {
                    product: e.target.value as CommissionRule["product"],
                  })
                }
              >
                <option value="free">Free Tour</option>
                <option value="paid">Tour a pagamento</option>
                <option value="package">Pacchetto / più tour</option>
              </select>
            </label>
            <label>
              Calcolo
              <select
                className="text-input"
                value={r.mode}
                onChange={(e) =>
                  setRule(i, { mode: e.target.value as CommissionRule["mode"] })
                }
              >
                <option value="fixed">Fisso per persona</option>
                <option value="percent">Percentuale sul totale</option>
              </select>
            </label>
            <label>
              {r.mode === "fixed"
                ? `Importo (${t.currency ?? "EUR"}) per persona`
                : "Percentuale"}
              <input
                className="text-input"
                type="number"
                min={0}
                max={r.mode === "percent" ? 100 : 100000}
                step="0.01"
                value={r.mode === "fixed" ? r.value / 100 : r.value}
                onChange={(e) =>
                  setRule(i, {
                    value:
                      r.mode === "fixed"
                        ? Math.round(Number(e.target.value) * 100)
                        : Number(e.target.value),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="button-secondary button-danger"
              onClick={() =>
                change(
                  "commissionRules",
                  rules.filter((_, j) => j !== i),
                )
              }
            >
              Rimuovi regola
            </button>
          </fieldset>
        ))}
        {rules.length > 0 && (
          <div className="admin-pagination">
            <span>
              Regola {Math.min(rulePage + 1, rules.length)} di {rules.length}
            </span>
            <button
              type="button"
              className="button-secondary"
              aria-label="Regola precedente"
              disabled={currentRulePage === 0}
              onClick={() => setRulePage(Math.max(0, currentRulePage - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="button-secondary"
              aria-label="Regola successiva"
              disabled={currentRulePage >= rules.length - 1}
              onClick={() => setRulePage(currentRulePage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setRulePage(rules.length);
            change("commissionRules", [
              ...rules,
              {
                affiliateType: "guide",
                product: "paid",
                mode: "percent",
                value: 0,
              },
            ]);
          }}
        >
          Aggiungi regola commissione
        </button>
      </section>
    </>
  );
}
