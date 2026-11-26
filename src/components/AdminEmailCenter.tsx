"use client";
import { useEffect, useRef, useState } from "react";
import {
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
  const [editing, setEditing] = useState<EditKey | null>(null),
    [jobId, setJobId] = useState<string | null>(null),
    [draft, setDraft] = useState(settings);
  const [editorTab, setEditorTab] = useState("text");
  const tableArea = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = tableArea.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize(Math.max(1, Math.floor((entry.contentRect.height - 42) / 56))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
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
  const queue = jobs
    .slice()
    .reverse()
    .filter(
      (job) =>
        (!status || job.status === status) &&
        `${job.bookingPnr || ""} ${job.to || ""} ${job.subject || ""}`
          .toLocaleLowerCase("it")
          .includes(search.toLocaleLowerCase("it")),
    );
  const total = tab === "templates" ? templates.length : queue.length,
    pages = Math.max(1, Math.ceil(total / size)),
    current = Math.min(page, pages - 1);
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
        <div className={css.tabs} role="tablist" aria-label="Gestione email">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "templates"}
            onClick={() => {
              setTab("templates");
              setPage(0);
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
            }}
          >
            Coda <span>{jobs.length}</span>
          </button>
        </div>
        {tab === "queue" && (
          <button
            type="button"
            className="button-secondary"
            disabled={busy}
            onClick={() => void runQueue()}
          >
            <RefreshCw size={14} />
            Elabora coda
          </button>
        )}
      </header>
      <div className={css.toolbar}>
        {tab === "templates" ? (
          <p>
            Scegli un modello per modificarlo. Le modifiche si applicano ai
            prossimi invii.
          </p>
        ) : (
          <>
            <label className={css.search}>
              <Search size={15} />
              <input
                className="text-input"
                aria-label="Cerca nella coda email"
                placeholder="Cerca PNR, destinatario o oggetto"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <select
              className="text-input"
              aria-label="Filtra stato email"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
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
          </>
        )}
      </div>
      <div ref={tableArea} className={css.tableArea}>
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
              ? templates
                  .slice(current * size, (current + 1) * size)
                  .map((item) => (
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
              : queue
                  .slice(current * size, (current + 1) * size)
                  .map((item) => (
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
        {!total && (
          <p className={css.empty}>Nessun invio corrisponde ai filtri.</p>
        )}
      </div>
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
                  <button className="button-primary" disabled={busy}>
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
