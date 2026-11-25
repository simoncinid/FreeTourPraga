"use client";
import { PriceInput } from "./PriceInput";
import { useState } from "react";
import { TourPackageSelect } from "./TourPackageSelect";
import type { CatalogTour } from "@/lib/platform/model";
import type { CommissionRule, PriceCategory } from "@/lib/types";
import { categoriesFor } from "@/lib/participant-pricing";
export function TourCommercialEditor({
  tour: t,
  availableTours,
  change,
  section = "all",
}: {
  section?: "all" | "categories" | "rules" | "commissions";
  tour: CatalogTour;
  availableTours: CatalogTour[];
  change: (key: keyof CatalogTour, value: unknown) => void;
}) {
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
        hidden={section !== "all" && section !== "categories"}
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
        <label>
          Valuta
          <select
            className="text-input"
            value={t.currency ?? "EUR"}
            onChange={(e) => change("currency", e.target.value)}
          >
            <option value="EUR">EUR — Euro</option>
            <option value="CZK">CZK — Corona ceca</option>
          </select>
        </label>
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
            disabled={currentCategoryPage === 0}
            onClick={() => setCategoryPage(currentCategoryPage - 1)}
          >
            Precedente
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={
              currentCategoryPage >= Math.ceil(categories.length / 3) - 1
            }
            onClick={() => setCategoryPage(currentCategoryPage + 1)}
          >
            Successiva
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
      <section
        data-tour-panel="rules"
        hidden={section !== "all" && section !== "rules"}
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
      <section
        data-tour-panel="rules"
        hidden={section !== "all" && section !== "rules"}
        className="card tour-payments grid gap-4 p-6"
      >
        <h2 className="display-md">Pagamenti</h2>
        <p>
          I metodi selezionati sono disponibili per questo tour. I tour nello
          stesso ordine devono avere almeno un metodo in comune.
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
      <section
        data-tour-panel="commissions"
        hidden={section !== "all" && section !== "commissions"}
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
              disabled={currentRulePage === 0}
              onClick={() => setRulePage(Math.max(0, currentRulePage - 1))}
            >
              Precedente
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={currentRulePage >= rules.length - 1}
              onClick={() => setRulePage(currentRulePage + 1)}
            >
              Successiva
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
