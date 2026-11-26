"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Pencil, Trash2, BarChart3 } from "lucide-react";
import type { EuropeanPartner, PlatformState } from "@/lib/platform/model";
import { partnerStats } from "@/lib/partner-statistics";
import { ImageSourceField } from "./ImageSourceField";
import { AdminNotice } from "./AdminNotice";
import { recordsCss as css, RecordDrawer } from "./AdminRecords";
function emptyPartner(): EuropeanPartner {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    imageUrl: "",
    email: "",
    phone: "",
    website: "",
    published: false,
  };
}
export function PartnersManager({
  data,
  busy,
  mutate,
  from,
  to,
  onFromChange,
  onToChange,
  openNewKey = 0,
}: {
  data: PlatformState | Pick<PlatformState, "partners" | "partnerClicks">;
  busy: boolean;
  mutate: (route: string, body: unknown, method?: string) => Promise<unknown>;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  openNewKey?: number;
}) {
  const [tab, setTab] = useState("partners"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const [periodFrom, setPeriodFrom] = useState(from),
    [periodTo, setPeriodTo] = useState(to);
  const [draft, setDraft] = useState<EuropeanPartner | null>(null),
    [historyId, setHistoryId] = useState<string | null>(null),
    [editorTab, setEditorTab] = useState("data");
  const [upload, setUpload] = useState(false),
    [notice, setNotice] = useState("");
  const query = search.trim().toLocaleLowerCase("it");
  const stats = useMemo(
    () => partnerStats(data as PlatformState, periodFrom, periodTo),
    [data, periodFrom, periodTo],
  );
  const history = stats.find((row) => row.id === historyId);
  const partners = useMemo(
    () =>
      (data.partners || []).filter(
        (item) =>
          !item.deleted &&
          (!status ||
            (status === "published" ? item.published : !item.published)) &&
          `${item.name} ${item.email}`
            .toLocaleLowerCase("it")
            .includes(query),
      ),
    [data.partners, status, query],
  );
  const statistics = useMemo(() => {
    const byId = new Map((data.partners || []).map((item) => [item.id, item]));
    return stats.filter((item) => {
      if (!query) return true;
      const partner = byId.get(item.id);
      return `${item.name} ${partner?.email || ""}`
        .toLocaleLowerCase("it")
        .includes(query);
    });
  }, [stats, data.partners, query]);
  function edit(partner: EuropeanPartner) {
    setEditorTab("data");
    setNotice("");
    setDraft({ ...partner });
  }
  function changeFrom(value: string) {
    if (!value || value === periodFrom) return;
    setPeriodFrom(value);
    onFromChange(value);
    if (value > periodTo) {
      setPeriodTo(value);
      onToChange(value);
    }
  }
  function changeTo(value: string) {
    if (!value || value === periodTo) return;
    setPeriodTo(value);
    onToChange(value);
  }
  useEffect(() => {
    if (!openNewKey) return;
    edit(emptyPartner());
  }, [openNewKey]);
  useEffect(() => {
    setPeriodFrom(from);
  }, [from]);
  useEffect(() => {
    setPeriodTo(to);
  }, [to]);
  const close = () => {
    if (!upload && !busy) {
      setDraft(null);
      setHistoryId(null);
      setNotice("");
    }
  };
  const isNew =
    draft && !(data.partners || []).some((item) => item.id === draft.id);
  return (
    <section className={css.center}>
      <header className={css.toolbar}>
        <div
          className={`${css.tabs} ${css.tabsGrow}`}
          role="tablist"
          aria-label="Partner Europa"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "partners"}
            onClick={() => setTab("partners")}
          >
            Partner
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "stats"}
            onClick={() => setTab("stats")}
          >
            Statistiche
          </button>
        </div>
      </header>
      <div className={css.toolbar}>
        <div
          className={`${css.filters}${tab === "stats" ? ` ${css.filtersStats}` : ""}`}
        >
          <label className={css.search}>
            <Search size={15} />
            <input
              className="text-input"
              aria-label="Cerca partner"
              placeholder="Cerca partner per nome o email"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </label>
          {tab === "partners" ? (
            <select
              className="text-input"
              aria-label="Stato partner"
              value={status}
              onChange={(e) => setStatus(e.currentTarget.value)}
            >
              <option value="">Tutti gli stati</option>
              <option value="published">Pubblicati</option>
              <option value="draft">Bozze</option>
            </select>
          ) : (
            <div className={css.period}>
              <label>
                Dal
                <input
                  aria-label="Statistiche dal"
                  className="text-input"
                  type="date"
                  value={periodFrom}
                  onChange={(e) => changeFrom(e.currentTarget.value)}
                  onInput={(e) => changeFrom(e.currentTarget.value)}
                />
              </label>
              <label>
                Al
                <input
                  aria-label="Statistiche al"
                  className="text-input"
                  type="date"
                  min={periodFrom}
                  value={periodTo}
                  onChange={(e) => changeTo(e.currentTarget.value)}
                  onInput={(e) => changeTo(e.currentTarget.value)}
                />
              </label>
            </div>
          )}
        </div>
      </div>
      <div className={css.tableArea}>
        <table className={css.table}>
          <colgroup>
            <col
              className={tab === "stats" ? css.statsNameCol : css.nameCol}
              style={{ width: "28%" }}
            />
            {tab === "partners" ? (
              <>
                <col className={css.mobileHide} style={{ width: "29%" }} />
                <col className={css.statusCol} style={{ width: 115 }} />
                <col className={css.clicksCol} style={{ width: 95 }} />
                <col className={css.mobileHide} />
              </>
            ) : (
              <>
                <col className={css.statsMetricCol} />
                <col className={css.statsMetricCol} />
                <col className={css.statsMetricCol} />
              </>
            )}
            <col className={css.actionsCol} style={{ width: 90 }} />
          </colgroup>
          <thead>
            <tr>
              {(tab === "partners"
                ? [
                    { label: "Partner", short: "Partner", hide: false },
                    { label: "Contatto", short: "Contatto", hide: true },
                    { label: "Stato", short: "Stato", hide: false },
                    { label: "Click", short: "Click", hide: false },
                    {
                      label: "Visitatori-giorno",
                      short: "Visite",
                      hide: true,
                    },
                    { label: "", short: "", hide: false },
                  ]
                : [
                    { label: "Partner", short: "Partner", hide: false },
                    { label: "Click totali", short: "Click", hide: false },
                    { label: "Visitatori-giorno", short: "Visite", hide: false },
                    { label: "Senza consenso", short: "Anon", hide: false },
                    { label: "", short: "", hide: false },
                  ]
              ).map((col, index) => (
                <th
                  key={index}
                  className={[
                    index > 1 && index < (tab === "partners" ? 5 : 4)
                      ? css.number
                      : undefined,
                    col.hide ? css.mobileHide : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.label ? (
                    <>
                      <span className={css.colFull}>{col.label}</span>
                      <span className={css.colShort}>{col.short}</span>
                    </>
                  ) : (
                    <span className="sr-only">Azioni</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab === "partners"
              ? partners.map((item) => {
                  const count = stats.find((row) => row.id === item.id);
                  return (
                    <tr
                      key={item.id}
                      className={css.clickable}
                      onClick={() => edit(item)}
                    >
                      <td>
                        <strong>{item.name}</strong>
                        <small>{item.website}</small>
                      </td>
                      <td className={css.mobileHide}>
                        {item.email || "—"}
                        <small>{item.phone || ""}</small>
                      </td>
                      <td className={css.number}>
                        <span
                          className={`${css.badge} ${css.statusPill} ${item.published ? css.done : ""}`}
                          title={item.published ? "Pubblicato" : "Bozza"}
                          aria-label={
                            item.published ? "Pubblicato" : "Bozza"
                          }
                        >
                          <span className={css.statusLabel}>
                            {item.published ? "Pubblicato" : "Bozza"}
                          </span>
                        </span>
                      </td>
                      <td className={css.number}>{count?.clicks || 0}</td>
                      <td className={`${css.number} ${css.mobileHide}`}>
                        {count?.uniqueVisitorDays || 0}
                      </td>
                      <td className={css.actions}>
                        <div>
                          <button
                            type="button"
                            className={css.icon}
                            aria-label={`Modifica ${item.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              edit(item);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            className={`${css.icon} ${css.danger}`}
                            aria-label={`Elimina ${item.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (
                                window.confirm(
                                  `Eliminare ${item.name}? Le statistiche rimangono disponibili.`,
                                )
                              )
                                void mutate(
                                  "partner",
                                  { id: item.id },
                                  "DELETE",
                                );
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : statistics.map((item) => (
                  <tr
                    key={item.id}
                    className={css.clickable}
                    onClick={() => setHistoryId(item.id)}
                  >
                    <td>
                      <strong>{item.name}</strong>
                      {item.deleted && <small>Partner eliminato</small>}
                    </td>
                    <td className={css.number}>{item.clicks}</td>
                    <td className={css.number}>{item.uniqueVisitorDays}</td>
                    <td className={css.number}>{item.unmeasuredClicks}</td>
                    <td className={css.actions}>
                      <button
                        type="button"
                        className={css.icon}
                        aria-label={`Storico ${item.name}`}
                        onClick={() => setHistoryId(item.id)}
                      >
                        <BarChart3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!(tab === "partners" ? partners.length : statistics.length) && (
          <p className={css.empty}>Nessun partner corrisponde ai filtri.</p>
        )}
      </div>
      {tab === "stats" && (
        <p className={`${css.caption} ${css.statsNote}`}>
          Un visitatore consenziente viene contato una volta per partner e
          giorno. I click senza consenso aumentano solo il totale; lo storico
          comprende anche i partner eliminati.
        </p>
      )}
      {notice && <AdminNotice key={notice} message={notice} />}
      {draft && (
        <RecordDrawer
          title={isNew ? "Nuovo partner" : draft.name}
          subtitle={isNew ? "Partner Europa" : "Modifica partner"}
          close={close}
          locked={busy || upload}
        >
          <form
            className={css.form}
            onInvalidCapture={(event) => {
              if (editorTab !== "data") {
                event.preventDefault();
                setEditorTab("data");
                const input = event.target as HTMLInputElement;
                requestAnimationFrame(() => input.reportValidity());
              }
            }}
            onSubmit={async (event) => {
              event.preventDefault();
              if (upload || busy) return;
              const result = await mutate("partner", draft, "PUT");
              if (result) setDraft(null);
            }}
          >
            <nav className={css.tabs} aria-label="Campi partner">
              <button
                type="button"
                aria-pressed={editorTab === "data"}
                onClick={() => setEditorTab("data")}
              >
                Dati partner
              </button>
              <button
                type="button"
                aria-pressed={editorTab === "media"}
                onClick={() => setEditorTab("media")}
              >
                Foto o logo
              </button>
            </nav>
            <div className={css.formGrid} hidden={editorTab !== "data"}>
              <label className={css.full}>
                Nome *
                <input
                  className="text-input"
                  required
                  value={draft.name}
                  onInvalid={() => setEditorTab("data")}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className={css.full}>
                Descrizione
                <textarea
                  className="text-input"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  className="text-input"
                  type="email"
                  value={draft.email}
                  onInvalid={() => setEditorTab("data")}
                  onChange={(e) =>
                    setDraft({ ...draft, email: e.target.value })
                  }
                />
              </label>
              <label>
                Telefono
                <input
                  className="text-input"
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft({ ...draft, phone: e.target.value })
                  }
                />
              </label>
              <label className={css.full}>
                Sito HTTPS *
                <input
                  className="text-input"
                  required
                  type="url"
                  value={draft.website}
                  onInvalid={() => setEditorTab("data")}
                  onChange={(e) =>
                    setDraft({ ...draft, website: e.target.value })
                  }
                />
              </label>
            </div>
            <div className={css.media} hidden={editorTab !== "media"}>
              <ImageSourceField
                label="Foto o logo"
                value={draft.imageUrl}
                onChange={(imageUrl) => setDraft({ ...draft, imageUrl })}
                onUploading={setUpload}
                onNotice={setNotice}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) =>
                  setDraft({ ...draft, published: e.target.checked })
                }
              />
              Pubblica sul sito
            </label>
            <footer className={css.drawerFooter}>
              <button
                type="button"
                className="button-secondary"
                onClick={close}
                disabled={upload || busy}
              >
                Annulla
              </button>
              <button className="button-primary" disabled={busy || upload}>
                Salva partner
              </button>
            </footer>
          </form>
        </RecordDrawer>
      )}
      {history && (
        <RecordDrawer
          title={history.name}
          subtitle="Storico giornaliero"
          close={close}
        >
          <p className={css.caption}>
            {periodFrom} — {periodTo} · {history.clicks} click ·{" "}
            {history.uniqueVisitorDays} visitatori-giorno
          </p>
          <div className={css.history}>
            <div className={css.tableArea}>
              <table className={css.table}>
                <thead>
                  <tr>
                    <th>Giorno</th>
                    <th>Click</th>
                    <th>Visitatori</th>
                  </tr>
                </thead>
                <tbody>
                  {history.daily.map((day) => (
                    <tr key={day.day}>
                      <td>{day.day.split("-").reverse().join("/")}</td>
                      <td>{day.clicks}</td>
                      <td>{day.uniqueVisitorDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!history.daily.length && (
                <p className={css.empty}>
                  Nessun click nel periodo selezionato.
                </p>
              )}
            </div>
          </div>
        </RecordDrawer>
      )}
    </section>
  );
}
