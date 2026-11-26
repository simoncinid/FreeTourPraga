"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { commissionMatured } from "@/lib/platform/commissions";
import type { Affiliate, CatalogTour, Reservation } from "@/lib/platform/model";
import { formatMoney } from "@/lib/format";
import { blockEnterSubmit } from "@/lib/form-guards";

const PAGE_SIZE = 6;

const emptyAffiliate = (): Affiliate => ({
  code: "",
  name: "",
  email: "",
  type: "hotel",
  commissionPercent: 0,
  active: true,
});

export function AffiliatesSection({
  tours,
  busy,
  affiliates,
  bookings,
  save,
  pay,
  toggleActive,
  modal,
  onModalChange,
}: {
  busy: boolean;
  tours: CatalogTour[];
  affiliates: Affiliate[];
  bookings: Reservation[];
  save: (a: Affiliate) => Promise<unknown>;
  pay: (code: string) => Promise<unknown>;
  toggleActive: (a: Affiliate) => Promise<unknown>;
  modal: "new" | Affiliate | null;
  onModalChange: (value: "new" | Affiliate | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return affiliates;
    return affiliates.filter((a) =>
      [a.name, a.code, a.email, a.type, a.wpId != null ? String(a.wpId) : ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [affiliates, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = mobile
    ? filtered
    : filtered.slice(
        currentPage * PAGE_SIZE,
        currentPage * PAGE_SIZE + PAGE_SIZE,
      );

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
    if (modal) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [modal]);

  const draft: Affiliate | null =
    modal === "new" ? emptyAffiliate() : modal ? { ...modal } : null;

  return (
    <div className="affiliates-workspace">
      <div className="affiliates-toolbar">
        <label className="affiliates-search admin-search">
          <Search size={16} aria-hidden />
          <input
            className="text-input"
            value={search}
            aria-label="Cerca affiliato"
            placeholder="Nome, codice, email, tipologia…"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <p className="affiliates-count" role="status">
          {filtered.length} affiliat{filtered.length === 1 ? "o" : "i"}
        </p>
      </div>
      <div className="affiliates-grid">
        {visible.map((a) => {
          const rows = bookings.filter((b) => b.affiliateCode === a.code);
          const payable = rows.filter(
            (b) => commissionMatured({ tours }, b) && !b.commissionPaid,
          );
          const currencies = [...new Set(rows.map((b) => b.currency ?? "EUR"))];
          const open = !mobile || expanded === a.code;
          return (
            <article
              className={`affiliate-card${open ? " is-open" : ""}`}
              key={a.code}
            >
              <div className="affiliate-card-top">
                <button
                  type="button"
                  className="affiliate-card-toggle"
                  aria-expanded={open}
                  onClick={() =>
                    setExpanded((code) => (code === a.code ? null : a.code))
                  }
                >
                  <span className="affiliate-card-name-row">
                    <h2 className="table-cell-line" title={a.name}>
                      {a.name}
                    </h2>
                    <span
                      className={`affiliate-status-dot${a.active ? " is-active" : ""}`}
                      title={a.active ? "Attivo" : "Sospeso"}
                      aria-label={a.active ? "Attivo" : "Sospeso"}
                    />
                  </span>
                  <ChevronDown size={16} aria-hidden />
                </button>
                <div className="affiliate-card-desktop-head min-w-0">
                  <div className="affiliate-card-name-row">
                    <h2 className="table-cell-line" title={a.name}>
                      {a.name}
                    </h2>
                    <span
                      className={`affiliate-status-dot${a.active ? " is-active" : ""}`}
                      title={a.active ? "Attivo" : "Sospeso"}
                      aria-label={a.active ? "Attivo" : "Sospeso"}
                    />
                  </div>
                  <p className="table-cell-line affiliate-card-meta">
                    {a.type} · {a.code}
                    {a.wpId != null ? ` · WP #${a.wpId}` : ""} ·{" "}
                    {a.commissionPercent}%
                  </p>
                  <span
                    className={`status-chip affiliate-status-chip${a.active ? " status-success" : ""}`}
                  >
                    {a.active ? "Attivo" : "Sospeso"}
                  </span>
                </div>
                <a
                  href={`/api/platform/admin/affiliate/qr?code=${encodeURIComponent(a.code)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary affiliate-card-qr"
                >
                  QR
                </a>
              </div>
              <div className="affiliate-card-body">
                <p className="table-cell-line affiliate-card-meta affiliate-card-meta-mobile">
                  {a.type} · {a.code}
                  {a.wpId != null ? ` · WP #${a.wpId}` : ""} ·{" "}
                  {a.commissionPercent}%
                </p>
                <Link
                  className="affiliate-bookings-link"
                  href={`/admin/prenotazioni?affiliate=${encodeURIComponent(a.code)}`}
                >
                  {rows.length} prenotazion{rows.length === 1 ? "e" : "i"}
                </Link>
                {currencies.map((currency) => (
                  <p
                    key={currency}
                    className="affiliate-card-money"
                    style={{ fontSize: 10, lineHeight: 1.2 }}
                  >
                    <span>
                      Previste{" "}
                      {formatMoney(
                        rows
                          .filter(
                            (b) =>
                              (b.currency ?? "EUR") === currency &&
                              !b.commissionPaid &&
                              ["confirmed", "present"].includes(b.status) &&
                              !commissionMatured({ tours }, b),
                          )
                          .reduce((n, b) => n + b.commissionCents, 0),
                        currency,
                      )}
                    </span>
                    <span className="affiliate-card-money-sep" aria-hidden>
                      ·
                    </span>
                    <span>
                      Da liquidare{" "}
                      {formatMoney(
                        payable
                          .filter((b) => (b.currency ?? "EUR") === currency)
                          .reduce((n, b) => n + b.commissionCents, 0),
                        currency,
                      )}
                    </span>
                    <span className="affiliate-card-money-sep" aria-hidden>
                      ·
                    </span>
                    <span>
                      Liquidate{" "}
                      {formatMoney(
                        rows
                          .filter(
                            (b) =>
                              (b.currency ?? "EUR") === currency &&
                              b.commissionPaid &&
                              b.status !== "cancelled",
                          )
                          .reduce((n, b) => n + b.commissionCents, 0),
                        currency,
                      )}
                    </span>
                  </p>
                ))}
                <a
                  className="affiliate-card-link table-cell-line"
                  href={
                    a.wpId != null
                      ? `/?affiliates=${a.wpId}`
                      : `/?ref=${a.code}`
                  }
                  title={
                    a.wpId != null
                      ? `/?affiliates=${a.wpId}`
                      : `/?ref=${a.code}`
                  }
                >
                  {a.wpId != null
                    ? `/?affiliates=${a.wpId}`
                    : `/?ref=${a.code}`}
                </a>
                <div className="affiliate-card-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busy}
                    onClick={() => onModalChange(a)}
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busy}
                    onClick={() => void toggleActive(a)}
                  >
                    {a.active ? "Sospendi" : "Riprendi"}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busy || !payable.length}
                    onClick={() => void pay(a.code)}
                  >
                    Liquida
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {!visible.length && (
          <p className="affiliates-empty">Nessun affiliato trovato.</p>
        )}
      </div>
      {!mobile && filtered.length > PAGE_SIZE && (
        <div className="admin-pagination">
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina precedente"
            disabled={currentPage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {currentPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="button-secondary"
            aria-label="Pagina successiva"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="affiliate-modal"
        onClose={() => onModalChange(null)}
        onCancel={(e) => {
          e.preventDefault();
          onModalChange(null);
        }}
      >
        {draft && (
          <AffiliateEditor
            key={modal === "new" ? "new" : draft.code}
            busy={busy}
            initial={modal === "new" ? null : draft}
            onCancel={() => onModalChange(null)}
            save={async (a) => {
              const result = await save(a);
              if (result) onModalChange(null);
              return result;
            }}
          />
        )}
      </dialog>
    </div>
  );
}

function AffiliateEditor({
  busy,
  save,
  initial,
  onCancel,
}: {
  busy: boolean;
  save: (a: Affiliate) => Promise<unknown>;
  initial?: Affiliate | null;
  onCancel?: () => void;
}) {
  const editing = Boolean(initial?.code);
  const [a, setA] = useState<Affiliate>(initial ?? emptyAffiliate());
  return (
    <form
      className="affiliate-modal-form"
      onKeyDown={blockEnterSubmit}
      onSubmit={(e) => {
        e.preventDefault();
        void save({
          ...a,
          code:
            a.code ||
            `PARTNER-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        });
      }}
    >
      <div className="affiliate-modal-head">
        <h2>{editing ? `Modifica ${initial!.name}` : "Nuovo affiliato"}</h2>
        <button
          type="button"
          className="admin-modal-close"
          disabled={busy}
          aria-label="Chiudi"
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>
      <div className="affiliate-modal-grid">
        <label>
          {editing
            ? "Codice univoco (non modificabile)"
            : "Codice univoco (opzionale)"}
          <input
            className="text-input"
            value={a.code}
            disabled={editing}
            onChange={(e) => setA({ ...a, code: e.target.value.toUpperCase() })}
          />
        </label>
        <label>
          Nome
          <input
            className="text-input"
            required
            value={a.name}
            onChange={(e) => setA({ ...a, name: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            className="text-input"
            type="email"
            required
            value={a.email}
            onChange={(e) => setA({ ...a, email: e.target.value })}
          />
        </label>
        <label>
          Commissione (%)
          <input
            className="text-input"
            type="number"
            min={0}
            max={100}
            value={a.commissionPercent}
            onChange={(e) =>
              setA({ ...a, commissionPercent: Number(e.target.value) })
            }
          />
        </label>
        <label>
          ID WordPress Affiliates (opzionale)
          <input
            className="text-input"
            type="number"
            min={1}
            value={a.wpId ?? ""}
            onChange={(e) =>
              setA({
                ...a,
                wpId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </label>
        <label>
          Tipologia
          <input
            className="text-input"
            list="affiliate-types"
            value={a.type}
            maxLength={80}
            required
            onChange={(e) => setA({ ...a, type: e.target.value })}
          />
          <datalist id="affiliate-types">
            {["hotel", "guide", "promoter", "agency"].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </label>
      </div>
      <p className="affiliate-modal-hint">
        Link WP: <code>/?affiliates=ID</code>. Commissione 0 = solo
        attribuzione. Le % valgono per le prenotazioni future.
      </p>
      <div className="affiliate-modal-actions">
        <button
          type="button"
          className="button-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Annulla
        </button>
        <button type="submit" disabled={busy} className="button-primary">
          {editing ? "Salva modifiche" : "Crea affiliato"}
        </button>
      </div>
    </form>
  );
}
