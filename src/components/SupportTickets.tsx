"use client";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import type { PlatformState } from "@/lib/platform/model";

const labels = { open: "Aperto", working: "In lavorazione", done: "Risolto" };
const statusOptions = ["open", "working", "done"] as const;

function statusDotClass(status: string) {
  if (status === "done") return "is-done";
  if (status === "working") return "is-working";
  return "is-open";
}

function statusChipClass(status: string) {
  if (status === "done") return "status-chip status-success";
  if (status === "working") return "status-chip status-warning";
  return "status-chip status-muted";
}

function SupportStatusMenu({
  value,
  busy,
  onChange,
}: {
  value: string;
  busy?: boolean;
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const label = labels[value as keyof typeof labels] || value;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const width = 180;
      const left = Math.min(
        Math.max(8, r.right - width),
        window.innerWidth - width - 8,
      );
      setPos({ top: r.bottom + 6, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={`status-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`${statusChipClass(value)} status-menu-trigger support-status-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setOpen((v) => !v);
        }}
      >
        <span>{label}</span>
        {!busy && <ChevronDown size={12} className="status-menu-caret" />}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className="status-menu-panel"
            role="listbox"
            style={{ top: pos.top, left: pos.left }}
          >
            {statusOptions.map((opt) => (
              <button
                type="button"
                key={opt}
                role="option"
                aria-selected={opt === value}
                className={opt === value ? "is-active" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  if (opt !== value) onChange(opt);
                }}
              >
                {labels[opt]}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function SupportTickets({
  tickets,
  busy,
  save,
  composeOpen = false,
  onComposeChange,
}: {
  tickets: NonNullable<PlatformState["tickets"]>;
  busy: boolean;
  save: (body: unknown, method?: string) => Promise<unknown>;
  composeOpen?: boolean;
  onComposeChange?: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("it");
    return tickets.filter((ticket) => {
      if (statusFilter && ticket.status !== statusFilter) return false;
      if (!q) return true;
      return `${ticket.title} ${ticket.body}`
        .toLocaleLowerCase("it")
        .includes(q);
    });
  }, [tickets, search, statusFilter]);

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
    const el = dialog.current;
    if (!el) return;
    if (composeOpen && !el.open) el.showModal();
    if (!composeOpen && el.open) el.close();
  }, [composeOpen]);

  function submitTicket() {
    void save({ title, body }, "POST").then((result) => {
      if (result) {
        setTitle("");
        setBody("");
        onComposeChange?.(false);
      }
    });
  }

  return (
    <section className="support-workspace">
      <p className="support-intro">
        Apri una richiesta per il web developer. Lo stato resta visibile qui.
      </p>

      <div className="support-toolbar">
        <label className="support-search admin-search">
          <Search size={16} aria-hidden />
          <input
            className="text-input"
            aria-label="Cerca ticket"
            placeholder="Cerca oggetto o descrizione…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="text-input support-status-filter"
          aria-label="Filtra per stato"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tutti gli stati</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="support-list">
        {filtered.map((ticket) => {
          const open = !mobile || expanded === ticket.id;
          const statusLabel =
            labels[ticket.status as keyof typeof labels] || ticket.status;
          return (
            <article
              className={`support-item${open ? " is-open" : ""}`}
              key={ticket.id}
            >
              {mobile ? (
                <button
                  type="button"
                  className="support-item-toggle"
                  aria-expanded={open}
                  onClick={() =>
                    setExpanded((id) => (id === ticket.id ? null : ticket.id))
                  }
                >
                  <span className="support-item-name-row">
                    <strong className="support-item-title">{ticket.title}</strong>
                    <span
                      className={`support-status-dot ${statusDotClass(ticket.status)}`}
                      title={statusLabel}
                      aria-label={statusLabel}
                    />
                  </span>
                  <ChevronDown size={16} aria-hidden />
                </button>
              ) : (
                <div className="support-item-head">
                  <strong className="support-item-title">{ticket.title}</strong>
                  <SupportStatusMenu
                    value={ticket.status}
                    busy={busy}
                    onChange={(status) =>
                      void save({ id: ticket.id, status }, "PATCH")
                    }
                  />
                </div>
              )}
              {open && (
                <div className="support-item-body">
                  <p>{ticket.body}</p>
                  {mobile && (
                    <label>
                      Stato
                      <select
                        className="text-input"
                        value={ticket.status}
                        disabled={busy}
                        onChange={(e) =>
                          void save(
                            { id: ticket.id, status: e.target.value },
                            "PATCH",
                          )
                        }
                      >
                        {Object.entries(labels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {!filtered.length && (
          <p className="support-empty">
            {tickets.length
              ? "Nessun ticket corrisponde ai filtri."
              : "Nessun ticket ancora."}
          </p>
        )}
      </div>

      <dialog
        ref={dialog}
        className="support-compose-modal"
        onClose={() => onComposeChange?.(false)}
        onCancel={(e) => {
          e.preventDefault();
          onComposeChange?.(false);
        }}
      >
        <div className="support-compose-modal-form grid gap-4">
          <div className="support-compose-modal-head">
            <h2>Nuovo ticket</h2>
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Chiudi"
              disabled={busy}
              onClick={() => onComposeChange?.(false)}
            >
              <X size={18} />
            </button>
          </div>
          <label>
            Oggetto
            <input
              className="text-input"
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label>
            Descrizione
            <textarea
              className="text-input"
              value={body}
              maxLength={5000}
              rows={4}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="button-primary"
            disabled={
              busy || title.trim().length < 3 || body.trim().length < 3
            }
            onClick={submitTicket}
          >
            Apri ticket
          </button>
        </div>
      </dialog>
    </section>
  );
}
