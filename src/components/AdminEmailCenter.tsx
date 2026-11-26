"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Eye,
  Search,
  RefreshCw,
} from "lucide-react";
import type { Job, Settings } from "@/lib/platform/model";
import { EMAIL_PLACEHOLDERS } from "@/lib/platform/email-templates";
import { formatMoney } from "@/lib/format";
import css from "./admin-email-center.module.css";
import { blockEnterSubmit } from "@/lib/form-guards";

type TemplateKey = keyof Settings["emailTemplates"];
type EditKey = TemplateKey | "footer";
const templates: { key: EditKey; name: string; description: string }[] = [
  {
    key: "confirmed",
    name: "Conferma cliente",
    description: "Conferma della prenotazione",
  },
  {
    key: "modified",
    name: "Modifica cliente",
    description: "Aggiornamento della prenotazione",
  },
  {
    key: "cancelled",
    name: "Cancellazione cliente",
    description: "Conferma di cancellazione",
  },
  {
    key: "expired",
    name: "Prenotazione scaduta",
    description: "Avviso di prenotazione persa per mancato messaggio WhatsApp",
  },
  {
    key: "refunded",
    name: "Rimborso cliente",
    description: "Conferma del rimborso registrato",
  },
  {
    key: "admin",
    name: "Avviso operativo · UWT",
    description: "Comunicazione a staff e portali",
  },
  {
    key: "footer",
    name: "Firma email",
    description: "Firma condivisa dei messaggi",
  },
];
const statuses = {
  queued: "In coda",
  running: "In elaborazione",
  sent: "Inviata",
  failed: "Da verificare",
};
const date = (value: string) =>
  new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "short",
    timeStyle: "short",
  });
function formatKind(key: EditKey) {
  return key === "footer" || key === "admin" ? "Testo" : "HTML";
}
function formatDotClass(key: EditKey) {
  return key === "footer" || key === "admin" ? "" : css.dotHtml;
}
function statusDotClass(status: Job["status"]) {
  if (status === "sent") return css.dotSent;
  if (status === "failed") return css.dotFailed;
  if (status === "running") return css.dotRunning;
  return "";
}
export function AdminEmailCenter({
  settings,
  jobs,
  busy,
  save,
  runQueue,
  retry,
}: {
  settings: Settings;
  jobs: Job[];
  busy: boolean;
  save: (settings: Settings) => Promise<unknown>;
  runQueue: () => Promise<unknown>;
  retry: (id: string) => Promise<unknown>;
}) {
  const [tab, setTab] = useState<"templates" | "queue">("templates");
  const [page, setPage] = useState(0),
    [size, setSize] = useState(6),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const [mobile, setMobile] = useState(false),
    [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditKey | null>(null),
    [jobId, setJobId] = useState<string | null>(null),
    [draft, setDraft] = useState(settings);
  const [editorTab, setEditorTab] = useState("text");
  const tableArea = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
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
  useEffect(() => {
    if (mobile) return;
    const el = tableArea.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize(Math.max(1, Math.floor((entry.contentRect.height - 42) / 56))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mobile, tab]);
  const open = editing !== null || jobId !== null;
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  const close = () => {
    if (!busy) {
      setEditing(null);
      setJobId(null);
    }
  };
  const query = search.trim().toLocaleLowerCase("it");
  const queue = useMemo(
    () =>
      jobs
        .slice()
        .reverse()
        .filter(
          (job) =>
            (!status || job.status === status) &&
            `${job.bookingPnr || ""} ${job.to || ""} ${job.subject || ""}`
              .toLocaleLowerCase("it")
              .includes(query),
        ),
    [jobs, status, query],
  );
  const total = tab === "templates" ? templates.length : queue.length,
    pages = Math.max(1, Math.ceil(total / size)),
    current = Math.min(page, pages - 1);
  const visibleTemplates = mobile
    ? templates
    : templates.slice(current * size, (current + 1) * size);
  const visibleQueue = mobile
    ? queue
    : queue.slice(current * size, (current + 1) * size);
  const job = jobs.find((item) => item.id === jobId),
    template = templates.find((item) => item.key === editing);
  function edit(key: EditKey) {
    setDraft(structuredClone(settings));
    setEditing(key);
    setJobId(null);
    setEditorTab("text");
  }
  function update(field: "subject" | "text" | "html", value: string) {
    if (!editing) return;
    if (editing === "footer") {
      setDraft((p) => ({ ...p, emailFooter: value }));
      return;
    }
    setDraft((p) => ({
      ...p,
      emailTemplates: {
        ...p.emailTemplates,
        [editing]: { ...p.emailTemplates[editing], [field]: value },
      },
    }));
  }
  const selected =
    editing && editing !== "footer" ? draft.emailTemplates[editing] : null;
  return (
    <section className={css.center}>
      <header className={css.header}>
        <div
          className={`${css.tabs} ${css.tabsGrow}`}
          role="tablist"
          aria-label="Gestione email"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "templates"}
            onClick={() => {
              setTab("templates");
              setPage(0);
              setExpanded(null);
            }}
          >
            Template <span>{templates.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "queue"}
            onClick={() => {
              setTab("queue");
              setPage(0);
              setExpanded(null);
            }}
          >
            Coda <span>{jobs.length}</span>
          </button>
        </div>
        {tab === "queue" && !mobile && (
          <button
            type="button"
            className={`button-secondary ${css.queueAction}`}
            disabled={busy}
            aria-label="Elabora coda"
            onClick={() => void runQueue()}
          >
            <RefreshCw size={14} />
            <span className={css.queueActionLabel}>Elabora coda</span>
          </button>
        )}
      </header>
      <div className={css.toolbar}>
        {tab === "templates" ? (
          <p className={css.hint}>
            Scegli un modello per modificarlo. Le modifiche si applicano ai
            prossimi invii.
          </p>
        ) : (
          <div className={css.filters}>
            <label className={css.search}>
              <Search size={15} />
              <input
                className="text-input"
                aria-label="Cerca nella coda email"
                placeholder="Cerca PNR, destinatario o oggetto"
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  setPage(0);
                }}
                onInput={(e) => {
                  setSearch(e.currentTarget.value);
                  setPage(0);
                }}
              />
            </label>
            <select
              className="text-input"
              aria-label="Filtra stato email"
              value={status}
              onChange={(e) => {
                setStatus(e.currentTarget.value);
                setPage(0);
              }}
            >
              <option value="">Tutti gli stati</option>
              {Object.entries(statuses).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div ref={tableArea} className={css.tableArea}>
        {mobile ? (
          <div className={css.mobileList}>
            {tab === "templates"
              ? visibleTemplates.map((item) => {
                  const open = expanded === item.key;
                  return (
                    <article
                      key={item.key}
                      className={`${css.mobileItem}${open ? ` ${css.mobileOpen}` : ""}`}
                    >
                      <button
                        type="button"
                        className={css.mobileToggle}
                        aria-expanded={open}
                        onClick={() =>
                          setExpanded((key) =>
                            key === item.key ? null : item.key,
                          )
                        }
                      >
                        <span className={css.mobileNameRow}>
                          <span className={css.mobileName}>{item.name}</span>
                          <span
                            className={`${css.statusDot} ${formatDotClass(item.key)}`}
                            title={formatKind(item.key)}
                            aria-label={formatKind(item.key)}
                          />
                        </span>
                        <ChevronDown size={16} aria-hidden />
                      </button>
                      {open && (
                        <div className={css.mobileBody}>
                          <p className={css.mobileMeta}>{item.description}</p>
                          <p className={css.mobileSubject}>
                            {item.key === "footer"
                              ? settings.emailFooter
                              : settings.emailTemplates[item.key].subject}
                          </p>
                          <div className={css.mobileActions}>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => edit(item.key)}
                            >
                              <Pencil size={15} />
                              Modifica
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              : visibleQueue.map((item) => {
                  const open = expanded === item.id;
                  const label =
                    item.bookingPnr || item.subject || item.type || item.id;
                  return (
                    <article
                      key={item.id}
                      className={`${css.mobileItem}${open ? ` ${css.mobileOpen}` : ""}`}
                    >
                      <button
                        type="button"
                        className={css.mobileToggle}
                        aria-expanded={open}
                        onClick={() =>
                          setExpanded((id) => (id === item.id ? null : item.id))
                        }
                      >
                        <span className={css.mobileNameRow}>
                          <span className={css.mobileName}>{label}</span>
                          <span
                            className={`${css.statusDot} ${statusDotClass(item.status)}`}
                            title={statuses[item.status]}
                            aria-label={statuses[item.status]}
                          />
                        </span>
                        <ChevronDown size={16} aria-hidden />
                      </button>
                      {open && (
                        <div className={css.mobileBody}>
                          <p className={css.mobileMeta}>
                            {item.type} · {item.attempts} tentativi
                          </p>
                          <p className={css.mobileSubject}>{item.to || "—"}</p>
                          <p className={css.mobileMeta}>{date(item.runAt)}</p>
                          <div className={css.mobileActions}>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => {
                                setJobId(item.id);
                                setEditing(null);
                                setEditorTab("text");
                              }}
                            >
                              <Eye size={15} />
                              Dettagli
                            </button>
                            {item.status === "failed" && (
                              <button
                                type="button"
                                className="button-secondary"
                                disabled={busy}
                                onClick={() => void retry(item.id)}
                              >
                                Riprova
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
            {!total && (
              <p className={css.empty}>Nessun invio corrisponde ai filtri.</p>
            )}
          </div>
        ) : (
          <table className={css.table}>
            <thead>
              <tr>
                {(tab === "templates"
                  ? ["Modello", "Oggetto / contenuto", "Formato", ""]
                  : [
                      "Prenotazione / oggetto",
                      "Destinatario",
                      "Invio previsto",
                      "Stato",
                      "",
                    ]
                ).map((heading, i) => (
                  <th key={i}>
                    {heading || <span className="sr-only">Azioni</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === "templates"
                ? visibleTemplates.map((item) => (
                    <tr key={item.key} onClick={() => edit(item.key)}>
                      <td>
                        <button
                          type="button"
                          className={css.rowLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            edit(item.key);
                          }}
                        >
                          {item.name}
                        </button>
                        <small>{item.description}</small>
                      </td>
                      <td
                        title={
                          item.key === "footer"
                            ? settings.emailFooter
                            : settings.emailTemplates[item.key].subject
                        }
                      >
                        {item.key === "footer"
                          ? settings.emailFooter
                          : settings.emailTemplates[item.key].subject}
                      </td>
                      <td>
                        <span className={css.badge}>
                          {item.key === "footer" || item.key === "admin"
                            ? "Testo"
                            : "Testo + HTML"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={css.icon}
                          aria-label={`Modifica ${item.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            edit(item.key);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                : visibleQueue.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setJobId(item.id);
                        setEditing(null);
                        setEditorTab("text");
                      }}
                    >
                      <td>
                        <button
                          type="button"
                          className={css.rowLink}
                          onClick={() => {
                            setJobId(item.id);
                            setEditorTab("text");
                          }}
                        >
                          {item.bookingPnr || item.subject || item.type}
                        </button>
                        <small>
                          {item.type} · {item.attempts} tentativi
                        </small>
                      </td>
                      <td title={item.to}>{item.to || "—"}</td>
                      <td>{date(item.runAt)}</td>
                      <td>
                        <span
                          className={`${css.badge} ${item.status === "failed" ? css.failed : item.status === "sent" ? css.sent : ""}`}
                        >
                          {statuses[item.status]}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={css.icon}
                          aria-label={`Dettagli ${item.bookingPnr || item.subject || item.id}`}
                          onClick={() => setJobId(item.id)}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
        {!mobile && !total && (
          <p className={css.empty}>Nessun invio corrisponde ai filtri.</p>
        )}
      </div>
      {!mobile && (
        <footer className={css.pagination}>
          <span>
            {total} {tab === "templates" ? "modelli" : "invii"} · Pagina{" "}
            {current + 1} di {pages}
          </span>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina precedente"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina successiva"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </footer>
      )}
      {open && (
        <dialog
          ref={dialog}
          className={css.drawer}
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              event.clientX < event.currentTarget.getBoundingClientRect().left
            )
              close();
          }}
        >
          <form
            className={css.drawerForm}
            onKeyDown={blockEnterSubmit}
            onSubmit={async (event) => {
              event.preventDefault();
              if (editing && !busy) {
                const result = await save(draft);
                if (result) {
                  setEditing(null);
                  setJobId(null);
                }
              }
            }}
          >
            <header className={css.drawerHeader}>
              <div>
                <p>{editing ? "Modifica template" : "Dettaglio invio"}</p>
                <h2>
                  {template?.name || job?.bookingPnr || job?.subject || "Email"}
                </h2>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Chiudi pannello email"
                disabled={busy}
                onClick={close}
              >
                <X size={18} />
              </button>
            </header>
            {editing ? (
              <>
                {editing !== "footer" && (
                  <label className={css.field}>
                    Oggetto
                    <input
                      className="text-input"
                      value={selected?.subject || ""}
                      onChange={(event) =>
                        update("subject", event.target.value)
                      }
                      required
                    />
                  </label>
                )}
                <nav className={css.editorTabs} aria-label="Campi del modello">
                  {[
                    ["text", "Testo"],
                    ...(editing !== "admin" && editing !== "footer"
                      ? [["html", "HTML"]]
                      : []),
                    ["help", "Variabili"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={editorTab === key}
                      onClick={() => setEditorTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                {editorTab === "help" ? (
                  <div className={css.help}>
                    <p>
                      Inserisci le variabili tra parentesi graffe: saranno
                      sostituite durante l’invio.
                    </p>
                    <div>
                      {EMAIL_PLACEHOLDERS.map((key) => (
                        <code key={key}>{`{${key}}`}</code>
                      ))}
                    </div>
                    {editing === "admin" ? (
                      <p>
                        Questo è il messaggio operativo per UWT: conserva
                        l’oggetto{" "}
                        <strong>Reserva freetourpraga.com italiano</strong> e la
                        riga <code>Tour: {"{uwtTour}"}</code>.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <label
                    className={`${css.editor} ${editorTab === "html" ? css.code : ""}`}
                  >
                    <span>
                      {editorTab === "html"
                        ? "Contenuto HTML"
                        : "Contenuto del messaggio"}
                    </span>
                    <textarea
                      aria-label={
                        editorTab === "html"
                          ? "HTML del template"
                          : "Testo del template"
                      }
                      value={
                        editing === "footer"
                          ? draft.emailFooter
                          : editorTab === "html" && editing !== "admin"
                            ? draft.emailTemplates[editing].html
                            : selected?.text || ""
                      }
                      onChange={(event) =>
                        update(
                          editorTab === "html" ? "html" : "text",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                )}
                <footer className={css.drawerFooter}>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busy}
                    onClick={close}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={busy}
                  >
                    {busy ? "Salvataggio…" : "Salva template"}
                  </button>
                </footer>
              </>
            ) : job ? (
              <>
                <dl className={css.jobFacts}>
                  <div>
                    <dt>Destinatario</dt>
                    <dd>{job.to || "—"}</dd>
                  </div>
                  <div>
                    <dt>Stato</dt>
                    <dd>
                      {statuses[job.status]} · {job.attempts} tentativi
                    </dd>
                  </div>
                  <div>
                    <dt>Invio previsto</dt>
                    <dd>{date(job.runAt)}</dd>
                  </div>
                  <div>
                    <dt>Oggetto</dt>
                    <dd>{job.subject || "—"}</dd>
                  </div>
                </dl>
                {job.error && (
                  <p className={css.error} title={job.error}>
                    {job.error}
                  </p>
                )}
                <label className={css.editor}>
                  <span>Anteprima</span>
                  <textarea
                    readOnly
                    value={
                      (job.error ? `Errore: ${job.error}\n\n` : "") +
                      (job.text || `Rimborso ${formatMoney(job.amount || 0)}`)
                    }
                  />
                </label>
                <footer className={css.drawerFooter}>
                  {job.status === "failed" && (
                    <button
                      type="button"
                      className="button-primary"
                      disabled={busy}
                      onClick={() => void retry(job.id)}
                    >
                      Riprova invio
                    </button>
                  )}
                </footer>
              </>
            ) : null}
          </form>
        </dialog>
      )}
    </section>
  );
}
