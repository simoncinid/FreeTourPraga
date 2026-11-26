"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Eye } from "lucide-react";
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
    [status, setStatus] = useState("new"),
    [selected, setSelected] = useState<string | null>(null),
    [mobile, setMobile] = useState(false),
    [expanded, setExpanded] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase("it");
  const rows = useMemo(
    () =>
      inquiries
        .filter(
          (item) =>
            (!status || item.status === status) &&
            `${item.name} ${item.email} ${item.type} ${item.message}`
              .toLocaleLowerCase("it")
              .includes(query),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [inquiries, status, query],
  );
  const { area: pagingArea, ...paging } = useRecordPagination(
    mobile ? 0 : rows.length,
  );
  const item = inquiries.find((row) => row.id === selected);
  const visible = mobile
    ? rows
    : rows.slice(paging.start, paging.start + paging.size);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setMobile(mq.matches);
      if (!mq.matches) setExpanded(null);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <section className={css.center}>
      <div className={`${css.toolbar} ${css.inquiryToolbar}`}>
        <div className={`${css.filters} ${css.inquiryFilters}`}>
          <label className={css.search}>
            <Search size={15} />
            <input
              className="text-input"
              aria-label="Cerca richieste"
              placeholder="Cerca nome, email o messaggio"
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                paging.setPage(0);
              }}
              onInput={(event) => {
                setSearch(event.currentTarget.value);
                paging.setPage(0);
              }}
            />
          </label>
          <select
            className="text-input"
            aria-label="Stato richieste"
            value={status}
            onChange={(event) => {
              setStatus(event.currentTarget.value);
              paging.setPage(0);
            }}
          >
            <option value="">Tutte</option>
            <option value="new">Da gestire</option>
            <option value="handled">Gestite</option>
          </select>
        </div>
      </div>
      <div ref={mobile ? undefined : pagingArea} className={css.tableArea}>
        {mobile ? (
          <div className={css.inquiryList}>
            {visible.map((row) => {
              const open = expanded === row.id;
              return (
                <article
                  key={row.id}
                  className={`${css.inquiryItem}${open ? ` ${css.inquiryOpen}` : ""}`}
                >
                  <button
                    type="button"
                    className={css.inquiryToggle}
                    aria-expanded={open}
                    onClick={() =>
                      setExpanded((id) => (id === row.id ? null : row.id))
                    }
                  >
                    <span className={css.inquiryNameRow}>
                      <span className={css.inquiryName}>{row.name}</span>
                      <span
                        className={`${css.inquiryDot}${row.status === "new" ? ` ${css.inquiryDotNew}` : ` ${css.inquiryDotDone}`}`}
                        title={
                          row.status === "new" ? "Da gestire" : "Gestita"
                        }
                        aria-label={
                          row.status === "new" ? "Da gestire" : "Gestita"
                        }
                      />
                    </span>
                    <ChevronDown size={16} aria-hidden />
                  </button>
                  {open && (
                    <div className={css.inquiryBody}>
                      <p className={css.inquiryMeta}>{row.email}</p>
                      <p className={css.inquiryMeta}>
                        {row.type} · {date(row.createdAt)}
                      </p>
                      <p className={css.inquiryMessage}>{row.message}</p>
                      <div className={css.inquiryActions}>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => setSelected(row.id)}
                        >
                          <Eye size={15} />
                          Dettagli
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={busy}
                          onClick={() =>
                            void update(
                              row.id,
                              row.status === "new" ? "handled" : "new",
                            )
                          }
                        >
                          {row.status === "new" ? "Gestita" : "Riapri"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {!rows.length && (
              <p className={css.empty}>
                Nessuna richiesta corrisponde ai filtri.
              </p>
            )}
          </div>
        ) : (
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
              {visible.map((row) => (
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
        )}
        {!mobile && !rows.length && (
          <p className={css.empty}>Nessuna richiesta corrisponde ai filtri.</p>
        )}
      </div>
      {!mobile && (
        <RecordPager
          page={paging.page}
          pages={paging.pages}
          total={rows.length}
          onChange={paging.setPage}
        />
      )}
      {item && (
        <RecordDrawer
          title={
            <span className={css.inquiryDrawerTitle}>
              {item.name}
              <span
                className={`${css.inquiryDot} ${css.inquiryDrawerTitleDot}${item.status === "new" ? ` ${css.inquiryDotNew}` : ` ${css.inquiryDotDone}`}`}
                title={item.status === "new" ? "Da gestire" : "Gestita"}
                aria-label={
                  item.status === "new" ? "Da gestire" : "Gestita"
                }
              />
            </span>
          }
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
          <footer
            className={`${css.drawerFooter} ${css.inquiryDrawerFooter}`}
          >
            <span
              className={`${css.badge} ${css.inquiryDrawerStatus} ${item.status === "new" ? css.new : css.done}`}
            >
              {item.status === "new" ? "Da gestire" : "Gestita"}
            </span>
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
