"use client";
import { useState } from "react";
import type { StaffPublic } from "@/lib/platform/staff";

export function StaffAccounts({
  users,
  busy,
  save,
}: {
  users: StaffPublic[];
  busy: boolean;
  save: (body: unknown, method?: string) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selfPassword, setSelfPassword] = useState("");
  const [showSelfPassword, setShowSelfPassword] = useState(false);
  const self = users.find((u) => u.isSelf);

  return (
    <section className="grid gap-6">
      <div className="card grid gap-4 p-6">
        <h2 className="display-md">Account staff</h2>
        <p>
          Tutti i membri sono allo stesso livello: possono vedere gli account,
          crearne di nuovi e metterli in pausa. Chi è in pausa non può accedere.
          Ognuno vede e modifica solo la propria password.
        </p>
        <ul className="grid gap-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border p-4"
            >
              <div>
                <strong>{u.name}</strong>
                <p className="text-sm">{u.email}</p>
                <p className="text-sm">
                  {u.paused ? "In pausa" : "Attivo"}
                  {u.isSelf ? " · sei tu" : ""}
                </p>
              </div>
              {!u.isSelf && (
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
              )}
            </li>
          ))}
          {!users.length && <p>Nessun account ancora.</p>}
        </ul>
      </div>

      <div className="card grid gap-4 p-6">
        <h2 className="display-md">Crea account</h2>
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
          onClick={() => {
            void save(
              {
                email,
                password,
                name: name.trim() || undefined,
              },
              "POST",
            ).then((result) => {
              if (result) {
                setEmail("");
                setName("");
                setPassword("");
              }
            });
          }}
        >
          Crea account
        </button>
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
