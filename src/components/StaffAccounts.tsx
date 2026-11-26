"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play, X } from "lucide-react";
import type { StaffPublic } from "@/lib/platform/staff";

export function StaffAccounts({
  users,
  busy,
  save,
  composeOpen = false,
  onComposeChange,
}: {
  users: StaffPublic[];
  busy: boolean;
  save: (body: unknown, method?: string) => Promise<unknown>;
  composeOpen?: boolean;
  onComposeChange?: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selfPassword, setSelfPassword] = useState("");
  const [showSelfPassword, setShowSelfPassword] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const self = users.find((u) => u.isSelf);

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

  function resetCompose() {
    setEmail("");
    setName("");
    setPassword("");
  }

  function createAccount() {
    void save(
      {
        email,
        password,
        name: name.trim() || undefined,
      },
      "POST",
    ).then((result) => {
      if (result) {
        resetCompose();
        onComposeChange?.(false);
      }
    });
  }

  const createFields = (
    <>
      <label>
        Nome
        <input
          className="text-input"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome visualizzato"
        />
      </label>
      <label>
        Email
        <input
          className="text-input"
          type="email"
          value={email}
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Password
        <input
          className="text-input"
          type="text"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      <button
        type="button"
        className="button-primary"
        disabled={busy || email.trim().length < 5 || password.length < 8}
        onClick={createAccount}
      >
        Crea account
      </button>
    </>
  );

  if (!mobile) {
    return (
      <section className="grid gap-6">
        <div className="card grid gap-4 p-6">
          <h2 className="display-md">Account staff</h2>
          <p>
            Tutti i membri sono allo stesso livello: possono vedere gli account,
            crearne di nuovi e metterli in pausa. Chi è in pausa non può
            accedere. Ognuno vede e modifica solo la propria password.
          </p>
          <ul className="grid gap-3">
            {users.map((u) => (
              <li key={u.id} className="grid gap-1 rounded border p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>{u.name}</strong>
                  {!u.isSelf && (
                    <button
                      type="button"
                      className="staff-pause-icon"
                      disabled={busy}
                      aria-label={u.paused ? "Riattiva" : "Metti in pausa"}
                      title={u.paused ? "Riattiva" : "Metti in pausa"}
                      onClick={() =>
                        void save({ id: u.id, paused: !u.paused }, "PATCH")
                      }
                    >
                      {u.paused ? (
                        <Play aria-hidden strokeWidth={2.25} />
                      ) : (
                        <Pause aria-hidden strokeWidth={2.25} />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-sm">{u.email}</p>
                <p className="text-sm">
                  {u.paused ? "In pausa" : "Attivo"}
                  {u.isSelf ? " · sei tu" : ""}
                </p>
              </li>
            ))}
            {!users.length && <p>Nessun account ancora.</p>}
          </ul>
        </div>

        <div className="card grid gap-4 p-6">
          <h2 className="display-md">Crea account</h2>
          {createFields}
        </div>

        {self && (
          <div className="card grid gap-4 p-6">
            <h2 className="display-md">La tua password</h2>
            <p className="text-sm">
              {self.passwordVisible
                ? "Password attuale (visibile solo a te):"
                : "Password impostata fuori dal gestionale: non è recuperabile. Impostane una nuova qui."}
            </p>
            {self.passwordVisible && (
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded border px-3 py-2 text-sm">
                  {showSelfPassword ? self.password : "••••••••••••"}
                </code>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowSelfPassword((v) => !v)}
                >
                  {showSelfPassword ? "Nascondi" : "Mostra"}
                </button>
              </div>
            )}
            <label>
              Nuova password
              <input
                className="text-input"
                type="text"
                value={selfPassword}
                autoComplete="new-password"
                onChange={(e) => setSelfPassword(e.target.value)}
                minLength={8}
              />
            </label>
            <button
              type="button"
              className="button-primary"
              disabled={busy || selfPassword.length < 8}
              onClick={() => {
                void save(
                  { id: self.id, password: selfPassword },
                  "PATCH",
                ).then((result) => {
                  if (result) {
                    setSelfPassword("");
                    setShowSelfPassword(true);
                  }
                });
              }}
            >
              Aggiorna la mia password
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="staff-workspace">
      <p className="staff-intro">
        Tutti i membri sono allo stesso livello. Chi è in pausa non può
        accedere.
      </p>

      <div className="staff-list">
        {users.map((u) => {
          const open = expanded === u.id;
          return (
            <article
              className={`staff-item${open ? " is-open" : ""}`}
              key={u.id}
            >
              <button
                type="button"
                className="staff-item-toggle"
                aria-expanded={open}
                onClick={() =>
                  setExpanded((id) => (id === u.id ? null : u.id))
                }
              >
                <span className="staff-item-name-row">
                  <strong className="staff-item-name">{u.name}</strong>
                  <span
                    className={`staff-status-dot${u.paused ? " is-paused" : " is-active"}`}
                    title={u.paused ? "In pausa" : "Attivo"}
                    aria-label={u.paused ? "In pausa" : "Attivo"}
                  />
                </span>
                <ChevronDown size={16} aria-hidden />
              </button>
              {open && (
                <div className="staff-item-body">
                  <p className="text-sm">{u.email}</p>
                  <p className="text-sm">
                    {u.paused ? "In pausa" : "Attivo"}
                    {u.isSelf ? " · sei tu" : ""}
                  </p>
                  {!u.isSelf && (
                    <div className="staff-item-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={busy}
                        onClick={() =>
                          void save({ id: u.id, paused: !u.paused }, "PATCH")
                        }
                      >
                        {u.paused ? "Riattiva" : "Metti in pausa"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {!users.length && <p>Nessun account ancora.</p>}
      </div>

      {self && (
        <details className="staff-password-panel">
          <summary className="staff-panel-summary">
            <span>La tua password</span>
            <ChevronDown size={16} aria-hidden />
          </summary>
          <div className="staff-panel-body grid gap-4">
            <p className="text-sm">
              {self.passwordVisible
                ? "Password attuale (visibile solo a te):"
                : "Password impostata fuori dal gestionale: non è recuperabile. Impostane una nuova qui."}
            </p>
            {self.passwordVisible && (
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded border px-3 py-2 text-sm">
                  {showSelfPassword ? self.password : "••••••••••••"}
                </code>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowSelfPassword((v) => !v)}
                >
                  {showSelfPassword ? "Nascondi" : "Mostra"}
                </button>
              </div>
            )}
            <label>
              Nuova password
              <input
                className="text-input"
                type="text"
                value={selfPassword}
                autoComplete="new-password"
                onChange={(e) => setSelfPassword(e.target.value)}
                minLength={8}
              />
            </label>
            <button
              type="button"
              className="button-primary"
              disabled={busy || selfPassword.length < 8}
              onClick={() => {
                void save(
                  { id: self.id, password: selfPassword },
                  "PATCH",
                ).then((result) => {
                  if (result) {
                    setSelfPassword("");
                    setShowSelfPassword(true);
                  }
                });
              }}
            >
              Aggiorna la mia password
            </button>
          </div>
        </details>
      )}

      <dialog
        ref={dialog}
        className="staff-compose-modal"
        onClose={() => onComposeChange?.(false)}
        onCancel={(e) => {
          e.preventDefault();
          onComposeChange?.(false);
        }}
      >
        <div className="staff-compose-modal-form grid gap-4">
          <div className="staff-compose-modal-head">
            <h2>Crea account</h2>
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
          {createFields}
        </div>
      </dialog>
    </section>
  );
}
