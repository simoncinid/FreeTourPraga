"use client";

import { X } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

export type ChangeEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  before?: string;
  after?: string;
  tour?: string;
  when?: string;
  booking?: string;
};

function whenLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ChangeHistory({
  entries,
  open,
  onClose,
  title = "Storico modifiche",
}: {
  entries: ChangeEntry[];
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const el = dialog.current;
    if (!open || !el) return;
    el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      className="history-modal"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="history-modal-body">
        <header className="history-modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="admin-modal-close"
            aria-label="Chiudi storico"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="history-list">
          {entries.length ? (
            entries.map((entry) => (
              <article key={entry.id} className="history-entry">
                <p className="history-entry-meta">
                  <time dateTime={entry.at}>{whenLabel(entry.at)}</time>
                  <span>{entry.actor}</span>
                </p>
                <p className="history-entry-where">
                  {[entry.tour, entry.when, entry.booking]
                    .filter(Boolean)
                    .join(" · ") || entry.action}
                </p>
                <p className="history-entry-action">{entry.action}</p>
                {entry.before || entry.after ? (
                  <div className="history-diff">
                    <p>
                      <strong>Prima</strong> {entry.before || "—"}
                    </p>
                    <p>
                      <strong>Dopo</strong> {entry.after || "—"}
                    </p>
                  </div>
                ) : (
                  <p className="history-entry-target">{entry.target}</p>
                )}
              </article>
            ))
          ) : (
            <p className="history-empty">Nessuna modifica registrata.</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
