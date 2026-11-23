"use client";
import { useState } from "react";
import { Search, Plus, Pencil, Trash2, BarChart3 } from "lucide-react";
import type { EuropeanPartner, PlatformState } from "@/lib/platform/model";
import { partnerStats } from "@/lib/partner-statistics";
import { ImageSourceField } from "./ImageSourceField";
import { AdminNotice } from "./AdminNotice";
import {
  recordsCss as css,
  RecordDrawer,
  RecordPager,
  useRecordPagination,
} from "./AdminRecords";
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
}: {
  data: PlatformState | Pick<PlatformState, "partners" | "partnerClicks">;
  busy: boolean;
  mutate: (route: string, body: unknown, method?: string) => Promise<unknown>;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  const [tab, setTab] = useState("partners"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const [draft, setDraft] = useState<EuropeanPartner | null>(null),
    [historyId, setHistoryId] = useState<string | null>(null),
    [editorTab, setEditorTab] = useState("data");
  const [upload, setUpload] = useState(false),
    [notice, setNotice] = useState("");
  const stats = partnerStats(data as PlatformState, from, to),
    history = stats.find((row) => row.id === historyId);
  const partners = (data.partners || []).filter(
    (item) =>
      !item.deleted &&
      (!status ||
        (status === "published" ? item.published : !item.published)) &&
      `${item.name} ${item.email}`
        .toLocaleLowerCase("it")
        .includes(search.toLocaleLowerCase("it")),
  );
  const statistics = stats.filter((item) =>
    item.name.toLocaleLowerCase("it").includes(search.toLocaleLowerCase("it")),
  );
  const paging = useRecordPagination(
      tab === "partners" ? partners.length : statistics.length,
    ),
    dailyPaging = useRecordPagination(history?.daily.length || 0);
  function edit(partner: EuropeanPartner) {
    setEditorTab("data");
    setNotice("");
    setDraft({ ...partner });
  }
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
        <div className={css.tabs} role="tablist" aria-label="Partner Europa">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "partners"}
            onClick={() => {
              setTab("partners");
              paging.setPage(0);
            }}
          >
            Partner
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "stats"}
            onClick={() => {
              setTab("stats");
              paging.setPage(0);
            }}
          >
            Statistiche
          </button>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={() => edit(emptyPartner())}
        >
          <Plus size={15} />
          Nuovo partner
        </button>
      </header>
      <div className={css.toolbar}>
        <div className={css.filters}>
          <label className={css.search}>
            <Search size={15} />
            <input
              className="text-input"
              aria-label="Cerca partner"
              placeholder="Cerca partner per nome o email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                paging.setPage(0);
              }}
            />
          </label>
          {tab === "partners" ? (
            <select
              className="text-input"
              aria-label="Stato partner"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                paging.setPage(0);
              }}
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
                  value={from}
                  onChange={(e) => onFromChange(e.target.value)}
                />
              </label>
              <label>
                Al
                <input
                  aria-label="Statistiche al"
                  className="text-input"
                  type="date"
                  min={from}
                  value={to}
                  onChange={(e) => onToChange(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      </div>
      <div ref={paging.area} className={css.tableArea}>
        <table className={css.table}>
          <colgroup>
            <col style={{ width: "28%" }} />
            {tab === "partners" ? (
              <>
                <col style={{ width: "29%" }} />
                <col style={{ width: 115 }} />
                <col style={{ width: 95 }} />
                <col />
              </>
            ) : (
              <>
                <col />
                <col />
                <col />
              </>
            )}
            <col style={{ width: 90 }} />
          </colgroup>
          <thead>
            <tr>
              {(tab === "partners"
                ? [
                    "Partner",
                    "Contatto",
                    "Stato",
                    "Click",
                    "Visitatori-giorno",
                    "",
                  ]
                : [
                    "Partner",
                    "Click totali",
                    "Visitatori-giorno",
                    "Senza consenso",
                    "",
                  ]
              ).map((label, index) => (
                <th
                  key={index}
                  className={
                    index > 1 && index < (tab === "partners" ? 5 : 4)
                      ? css.number
                      : undefined
                  }
                >
                  {label || <span className="sr-only">Azioni</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab === "partners"
              ? partners
                  .slice(paging.start, paging.start + paging.size)
                  .map((item) => {
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
                        <td>
                          {item.email || "—"}
                          <small>{item.phone || ""}</small>
                        </td>
                        <td className={css.number}>
                          <span
                            className={`${css.badge} ${item.published ? css.done : ""}`}
                          >
                            {item.published ? "Pubblicato" : "Bozza"}
                          </span>
                        </td>
                        <td className={css.number}>{count?.clicks || 0}</td>
                        <td className={css.number}>
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
              : statistics
                  .slice(paging.start, paging.start + paging.size)
                  .map((item) => (
                    <tr
                      key={item.id}
                      className={css.clickable}
                      onClick={() => {
                        setHistoryId(item.id);
                        dailyPaging.setPage(0);
                      }}
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
                          onClick={() => {
                            setHistoryId(item.id);
                            dailyPaging.setPage(0);
                          }}
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
        <p className={css.caption}>
          Un visitatore consenziente viene contato una volta per partner e
          giorno. I click senza consenso aumentano solo il totale; lo storico
          comprende anche i partner eliminati.
        </p>
      )}
      <RecordPager
        page={paging.page}
        pages={paging.pages}
        total={tab === "partners" ? partners.length : statistics.length}
        onChange={paging.setPage}
      />
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
                aria-selected={editorTab === "data"}
                onClick={() => setEditorTab("data")}
              >
                Dati partner
              </button>
              <button
                type="button"
                aria-selected={editorTab === "media"}
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
            {from} — {to} · {history.clicks} click · {history.uniqueVisitorDays}{" "}
            visitatori-giorno
          </p>
          <div className={css.history}>
            <div ref={dailyPaging.area} className={css.tableArea}>
              <table className={css.table}>
                <thead>
                  <tr>
                    <th>Giorno</th>
                    <th>Click</th>
                    <th>Visitatori</th>
                  </tr>
                </thead>
                <tbody>
                  {history.daily
                    .slice(
                      dailyPaging.start,
                      dailyPaging.start + dailyPaging.size,
                    )
                    .map((day) => (
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
            <RecordPager
              page={dailyPaging.page}
              pages={dailyPaging.pages}
              total={history.daily.length}
              onChange={dailyPaging.setPage}
            />
          </div>
        </RecordDrawer>
      )}
    </section>
  );
}
