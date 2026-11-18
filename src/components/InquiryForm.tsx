"use client";

import ui from "./public-ui.module.css";
import { useState } from "react";
import Link from "next/link";

export type InquiryVariant =
  | "contact"
  | "partner"
  | "agency"
  | "jobs"
  | "affiliate";

const VARIANT = {
  contact: {
    title: "Come possiamo aiutarti?",
    typeFixed: "Contatto",
    showTypeSelect: false,
    typeOptions: [] as string[],
    showSchedule: false,
    showCompany: false,
    showLanguages: false,
    showPortfolio: false,
    messageLabel: "Il tuo messaggio",
    messageHint: undefined as string | undefined,
  },
  partner: {
    title: "Parliamo del tuo gruppo.",
    typeFixed: "",
    showTypeSelect: true,
    typeOptions: [
      "Tour privato",
      "Scuola o gruppo",
      "Hotel partner",
      "Agenzia di viaggio",
      "Affiliazione",
    ],
    showSchedule: true,
    showCompany: false,
    showLanguages: false,
    showPortfolio: false,
    messageLabel: "Il tuo messaggio",
    messageHint: undefined as string | undefined,
  },
  agency: {
    title: "Parliamo della tua richiesta B2B.",
    typeFixed: "Agenzia di viaggio",
    showTypeSelect: true,
    typeOptions: [
      "Agenzia di viaggio",
      "Tour operator",
      "Scuola o gruppo",
      "Tour privato",
    ],
    showSchedule: true,
    showCompany: true,
    showLanguages: false,
    showPortfolio: false,
    messageLabel: "Dettagli della richiesta",
    messageHint: "Programma, esigenze del gruppo, lingue o vincoli operativi.",
  },
  jobs: {
    title: "Presentati al team.",
    typeFixed: "Candidatura",
    showTypeSelect: false,
    typeOptions: [] as string[],
    showSchedule: false,
    showCompany: false,
    showLanguages: true,
    showPortfolio: true,
    messageLabel: "Messaggio di presentazione",
    messageHint: "Esperienza, disponibilità e perché vorresti lavorare con noi.",
  },
  affiliate: {
    title: "Proponi una collaborazione.",
    typeFixed: "",
    showTypeSelect: true,
    typeOptions: [
      "Hotel partner",
      "Affiliazione",
      "Attività turistica",
      "Community / creator",
    ],
    showSchedule: false,
    showCompany: true,
    showLanguages: false,
    showPortfolio: false,
    messageLabel: "La tua proposta",
    messageHint: "Come vorresti collaborare e a chi ti rivolgi.",
  },
} as const;

export function InquiryForm({
  partner = false,
  variant,
}: {
  partner?: boolean;
  variant?: InquiryVariant;
}) {
  const kind: InquiryVariant = variant ?? (partner ? "partner" : "contact");
  const config = VARIANT[kind];
  const cardClass = kind !== "contact";
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const shell = `${ui.inquiry} ${cardClass ? ui.partnerForm : ""} card grid gap-5 p-8`;

  if (sent) {
    return (
      <div className={shell}>
        <h2 className="display-md">Richiesta ricevuta.</h2>
        <p>Il team ti risponderà all’indirizzo indicato.</p>
        <button className="button-secondary" onClick={() => setSent(false)}>
          Invia un’altra richiesta
        </button>
      </div>
    );
  }

  return (
    <form
      className={shell}
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          const extras = [
            f.get("company") ? `Azienda/attività: ${f.get("company")}` : "",
            f.get("date") ? `Data: ${f.get("date")}` : "",
            f.get("guests") ? `Partecipanti: ${f.get("guests")}` : "",
            f.get("languages") ? `Lingue: ${f.get("languages")}` : "",
            f.get("portfolio") ? `Curriculum/portfolio: ${f.get("portfolio")}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          const r = await fetch("/api/platform/inquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: f.get("name"),
              email: f.get("email"),
              type: config.showTypeSelect
                ? f.get("type")
                : config.typeFixed || "Contatto",
              message:
                String(f.get("message")) + (extras ? `\n${extras}` : ""),
              privacy: f.get("privacy") === "on",
              website: f.get("website"),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setSent(true);
        } catch (e) {
          setMessage(
            e instanceof Error ? e.message : "Connessione non disponibile",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="display-md">{config.title}</h2>
      <label>
        Nome e cognome
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          placeholder="Es. Mario Rossi"
          className="text-input"
        />
      </label>
      <label>
        Email
        <input
          name="email"
          required
          type="email"
          autoComplete="email"
          placeholder="nome@esempio.it"
          className="text-input"
        />
      </label>
      {config.showCompany && (
        <label>
          Azienda o attività
          <input
            name="company"
            required
            maxLength={160}
            autoComplete="organization"
            placeholder="Es. Hotel / agenzia / brand"
            className="text-input"
          />
        </label>
      )}
      {config.showTypeSelect && (
        <label>
          Tipo di richiesta
          <select name="type" className="text-input" defaultValue={config.typeOptions[0]}>
            {config.typeOptions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      )}
      {config.showSchedule && (
        <div className="form-grid">
          <label>
            Data indicativa
            <input type="date" name="date" className="text-input" />
          </label>
          <label>
            Partecipanti
            <input
              type="number"
              name="guests"
              min={1}
              className="text-input"
            />
          </label>
        </div>
      )}
      {config.showLanguages && (
        <label>
          Lingue
          <input
            name="languages"
            required
            maxLength={160}
            placeholder="Es. Italiano, inglese, spagnolo"
            className="text-input"
          />
        </label>
      )}
      {config.showPortfolio && (
        <label>
          Link curriculum o portfolio
          <input
            name="portfolio"
            type="url"
            maxLength={400}
            placeholder="https://"
            className="text-input"
          />
        </label>
      )}
      <label>
        {config.messageLabel}
        {config.messageHint ? (
          <span className="block text-sm font-normal text-muted mb-1">
            {config.messageHint}
          </span>
        ) : null}
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4500}
          className="text-input min-h-32"
        />
      </label>
      <label className="hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="privacy" required />
        <span>
          Ho letto l’
          <Link href="/privacy" className="underline">
            informativa privacy
          </Link>
          .
        </span>
      </label>
      {message && <p role="alert">{message}</p>}
      <button disabled={busy} className="button-primary">
        {busy ? "Invio…" : "Invia richiesta"}
      </button>
    </form>
  );
}
