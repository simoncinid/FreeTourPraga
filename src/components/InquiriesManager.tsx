"use client";
import { useState } from "react";
import { Search, Eye } from "lucide-react";
import type { PlatformState } from "@/lib/platform/model";
import {
  recordsCss as css,
  RecordDrawer,
  RecordPager,
  useRecordPagination,
} from "./AdminRecords";
const date = (value: string) =>
  new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "short",
    timeStyle: "short",
  });
export function InquiriesManager({
  inquiries,
  busy,
  update,
}: {
  inquiries: PlatformState["inquiries"];
  busy: boolean;
  update: (id: string, status: string) => Promise<unknown>;
}) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const rows = inquiries
    .filter(
      (item) =>
        (!status || item.status === status) &&
        `${item.name} ${item.email} ${item.type} ${item.message}`
          .toLocaleLowerCase("it")
          .includes(search.toLocaleLowerCase("it")),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { area: pagingArea, ...paging } = useRecordPagination(rows.length),
    item = inquiries.find((row) => row.id === selected);
  return (
    <section className={css.center}>
      <div className={css.toolbar}>
        <div className={css.filters}>
          <label className={css.search}>
            <Search size={15} />
            <input
              className="text-input"
              aria-label="Cerca richieste"
              placeholder="Cerca nome, email o messaggio"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                paging.setPage(0);
              }}
            />
          </label>
          <select
            className="text-input"
            aria-label="Stato richieste"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              paging.setPage(0);
            }}
          >
            <option value="">Tutte</option>
            <option value="new">Da gestire</option>
            <option value="handled">Gestite</option>
          </select>
        </div>
        <span className={css.badge}>
          {inquiries.filter((item) => item.status === "new").length} da gestire
        </span>
      </div>
      <div ref={pagingArea} className={css.tableArea}>
        <table className={css.table}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
            <col />
            <col style={{ width: 140 }} />
            <col style={{ width: 105 }} />
            <col style={{ width: 54 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Richiedente</th>
              <th>Tipologia</th>
              <th>Messaggio</th>
              <th>Ricevuta</th>
              <th>Stato</th>
              <th>
                <span className="sr-only">Dettagli</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(paging.start, paging.start + paging.size).map((row) => (
              <tr
                key={row.id}
                className={css.clickable}
                onClick={() => setSelected(row.id)}
              >
                <td>
                  <strong>{row.name}</strong>
                  <small>{row.email}</small>
                </td>
                <td>{row.type}</td>
                <td title={row.message}>{row.message}</td>
                <td>{date(row.createdAt)}</td>
                <td>
                  <span
                    className={`${css.badge} ${row.status === "new" ? css.new : css.done}`}
                  >
                    {row.status === "new" ? "Da gestire" : "Gestita"}
                  </span>
                </td>
                <td style={{ padding: 6 }}>
                  <button
                    type="button"
                    className={css.icon}
                    aria-label={`Apri richiesta di ${row.name}`}
                    onClick={() => setSelected(row.id)}
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className={css.empty}>Nessuna richiesta corrisponde ai filtri.</p>
        )}
      </div>
      <RecordPager
        page={paging.page}
        pages={paging.pages}
        total={rows.length}
        onChange={paging.setPage}
      />
      {item && (
        <RecordDrawer
          title={item.name}
          subtitle="Dettaglio richiesta"
          close={() => setSelected(null)}
          locked={busy}
        >
          <dl className={css.facts}>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${item.email}`}>{item.email}</a>
              </dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>
                {item.phone ? (
                  <a href={`tel:${item.phone}`}>{item.phone}</a>
                ) : (
                  "Non indicato"
                )}
              </dd>
            </div>
            <div>
              <dt>Tipologia</dt>
              <dd>{item.type}</dd>
            </div>
            <div>
              <dt>Ricevuta</dt>
              <dd>{date(item.createdAt)}</dd>
            </div>
          </dl>
          <label className={css.message}>
            Messaggio
            <textarea readOnly value={item.message} />
          </label>
          <footer className={css.drawerFooter}>
            <span
              className={`${css.badge} ${item.status === "new" ? css.new : css.done}`}
            >
              {item.status === "new" ? "Da gestire" : "Gestita"}
            </span>
            <button
              type="button"
              className="button-secondary"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Chiudi
            </button>
            <button
              type="button"
              className="button-primary"
              disabled={busy}
              onClick={() =>
                void update(item.id, item.status === "new" ? "handled" : "new")
              }
            >
              {item.status === "new"
                ? "Segna come gestita"
                : "Riapri richiesta"}
            </button>
          </footer>
        </RecordDrawer>
      )}
    </section>
  );
}
