import type { EmailKindTemplate, EmailTemplates, Settings } from "./model";
import { UWT_ADMIN_SUBJECT } from "./cf7-mail-map";

export const EMAIL_PLACEHOLDERS = [
  "kind",
  "nome",
  "pnr",
  "tour",
  "uwtTour",
  "customerSubject",
  "data",
  "fecha",
  "hora",
  "persone",
  "cantidad",
  "ninos",
  "totale",
  "totalPagar",
  "incontro",
  "indirizzo",
  "mappa",
  "pagamento",
  "nota",
  "cancellazione",
  "manageUrl",
  "calendarUrl",
  "assistenza",
  "telefonoContatto",
  "firma",
  "brand",
  "affiliate",
  "afiliado",
  "email",
  "telefono",
  "note",
  "adulti",
  "minori",
] as const;

/** Corpo admin identico a CF7 mail 1: UWT fa parsing riga per riga. */
export function defaultAdminEmailTemplate(): {
  subject: string;
  text: string;
} {
  return {
    subject: UWT_ADMIN_SUBJECT,
    text: [
      "Tour: {uwtTour}",
      "",
      "De: {nome}",
      "",
      "Email: {email}",
      "",
      "Teléfono: {telefono}",
      "",
      "Fecha: {fecha}",
      "",
      "Hora: {hora}",
      "",
      "Cantidad de personas: {cantidad}",
      "",
      "Niños: {ninos}",
      "",
      "Total a pagar: {totalPagar}",
      "",
      "Idioma del Tour: italiano",
      "",
      "Afiliado: {afiliado}",
      "",
      "Mensaje:",
      "{note}",
      "",
      "--",
      "Este e-mail se ha enviado vía FORMULARIO DE RESERVAS desde Free Tour Praga https://freetourpraga.com",
    ].join("\n"),
  };
}

export function defaultEmailTemplates(): EmailTemplates {
  return {
    confirmed: {
      subject: "{customerSubject}",
      text: [
        "Ciao {nome},",
        "",
        "Grazie per aver prenotato con noi.",
        "",
        "Dettagli della prenotazione:",
        "- Nome: {nome}",
        "- Tour: {tour}",
        "- Data del tour: {fecha}",
        "- Ora: {hora}",
        "- Persone: {persone}",
        "- Lingua: italiano",
        "- Prezzo: {totale}",
        "- Riferimento: {pnr}",
        "",
        "Punto d'incontro: {incontro}, {indirizzo}",
        "Mappa: {mappa}",
        "",
        "{pagamento}",
        "{nota}",
        "{cancellazione}",
        "",
        "Gestisci modifica o cancellazione: {manageUrl}",
        "Aggiungi al calendario: {calendarUrl}",
        "",
        "Assistenza: {assistenza}",
        "{firma}",
      ].join("\n"),
      html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>Grazie per aver prenotato con noi.</p>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">Dettagli della prenotazione</h3>
<ul>
<li style="margin-bottom:10px"><b>Nome:</b> {nome}</li>
<li style="margin-bottom:10px"><b>Tour:</b> {tour}</li>
<li style="margin-bottom:10px"><b>Data del tour:</b> {fecha}</li>
<li style="margin-bottom:10px"><b>Ora:</b> {hora}</li>
<li style="margin-bottom:10px"><b>Persone:</b> {persone}</li>
<li style="margin-bottom:10px"><b>Lingua:</b> italiano</li>
<li style="margin-bottom:10px"><b>Prezzo:</b> {totale}</li>
<li style="margin-bottom:10px"><b>Riferimento:</b> {pnr}</li>
</ul>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">Punto di partenza</h3>
<p>{incontro} · {indirizzo}<br/>
<a href="{mappa}">Mappa »</a></p>
<p><b>Telefono assistenza:</b> {telefonoContatto}</p>
<p>{pagamento}</p>
<p>{nota}</p>
<p>{cancellazione}</p>
<p><a href="{manageUrl}">Gestisci modifica o cancellazione</a> · <a href="{calendarUrl}">Aggiungi al calendario</a></p>
<p style="text-align:center;padding-top:20px">{firma}<br/>
<a href="{siteUrl}">{brand}</a></p>
</div>`,
    },
    modified: {
      subject: "Prenotazione aggiornata · {pnr} · {tour}",
      text: [
        "Ciao {nome},",
        "",
        "La tua prenotazione {pnr} è stata aggiornata.",
        "",
        "- Tour: {tour}",
        "- Data del tour: {fecha}",
        "- Ora: {hora}",
        "- Persone: {persone}",
        "- Prezzo: {totale}",
        "",
        "Punto d'incontro: {incontro}, {indirizzo}",
        "Mappa: {mappa}",
        "",
        "{cancellazione}",
        "",
        "Gestisci questa prenotazione: {manageUrl}",
        "Calendario: {calendarUrl}",
        "Assistenza: {assistenza}",
        "{firma}",
      ].join("\n"),
      html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>La tua prenotazione è stata aggiornata.</p>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">Aggiornamento · {pnr}</h3>
<ul>
<li style="margin-bottom:10px"><b>Nome:</b> {nome}</li>
<li style="margin-bottom:10px"><b>Tour:</b> {tour}</li>
<li style="margin-bottom:10px"><b>Data del tour:</b> {fecha}</li>
<li style="margin-bottom:10px"><b>Ora:</b> {hora}</li>
<li style="margin-bottom:10px"><b>Persone:</b> {persone}</li>
<li style="margin-bottom:10px"><b>Totale:</b> {totale}</li>
</ul>
<p>{incontro} · {indirizzo}<br/><a href="{mappa}">Mappa »</a></p>
<p>{cancellazione}</p>
<p><a href="{manageUrl}">Gestisci modifica o cancellazione</a> · <a href="{calendarUrl}">Aggiungi al calendario</a></p>
<p style="text-align:center;padding-top:20px">{firma}</p>
</div>`,
    },
    cancelled: {
      subject: "Cancellazione prenotazione · {pnr} · {tour}",
      text: [
        "Ciao {nome},",
        "",
        "La prenotazione {pnr} per {tour} del {fecha} alle {hora} è stata cancellata.",
        "",
        "Partecipanti: {persone}",
        "Importo della prenotazione: {totale}",
        "",
        "{pagamento}",
        "",
        "Se è previsto un rimborso, il nostro team lo gestirà manualmente e ti aggiornerà via email. Non è richiesta alcuna azione da parte tua, salvo diversa indicazione.",
        "",
        "Per assistenza indica sempre il riferimento {pnr}: {assistenza}",
        "",
        "{firma}",
      ].join("\n"),
      html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>Ciao {nome},</p>
<p>La prenotazione <b>{pnr}</b> per <b>{tour}</b> del <b>{fecha}</b> alle <b>{hora}</b> è stata cancellata.</p>
<ul>
<li style="margin-bottom:10px"><b>Partecipanti:</b> {persone}</li>
<li style="margin-bottom:10px"><b>Importo:</b> {totale}</li>
</ul>
<p>{pagamento}</p>
<p>Se è previsto un rimborso, il nostro team lo gestirà manualmente e ti aggiornerà via email.</p>
<p>Assistenza (riferimento {pnr}): {assistenza}</p>
<p style="text-align:center;padding-top:20px">{firma}</p>
</div>`,
    },
    admin: defaultAdminEmailTemplate(),
  };
}

export function renderEmailTemplate(
  template: string,
  vars: Record<string, string>,
) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{${key}}`,
  );
}

function asTemplate(
  value: unknown,
  fallback: EmailKindTemplate,
): EmailKindTemplate {
  if (!value || typeof value !== "object") return { ...fallback };
  const row = value as Partial<EmailKindTemplate>;
  return {
    subject:
      typeof row.subject === "string" && row.subject.trim()
        ? row.subject
        : fallback.subject,
    text:
      typeof row.text === "string" && row.text.trim()
        ? row.text
        : fallback.text,
    html:
      typeof row.html === "string" && row.html.trim()
        ? row.html
        : fallback.html,
  };
}

function isLegacyUwtAdminTemplate(admin: {
  subject?: string;
  text?: string;
}): boolean {
  const subject = admin.subject || "";
  const text = admin.text || "";
  if (!subject.trim() || !text.trim()) return true;
  if (subject !== UWT_ADMIN_SUBJECT) return true;
  if (!text.includes("Teléfono:")) return true;
  if (!text.includes("Cantidad de personas:")) return true;
  if (!text.includes("Total a pagar:")) return true;
  if (!text.includes("{uwtTour}")) return true;
  if (text.includes("Stato:") || text.includes("PNR:")) return true;
  return false;
}

export function normalizeEmailTemplates(raw: unknown): EmailTemplates {
  const defaults = defaultEmailTemplates();
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as Partial<EmailTemplates>;
  const adminRaw =
    value.admin && typeof value.admin === "object"
      ? (value.admin as { subject?: string; text?: string })
      : {};
  const admin = isLegacyUwtAdminTemplate(adminRaw)
    ? defaults.admin
    : {
        subject: adminRaw.subject!.trim(),
        text: adminRaw.text!.trim(),
      };
  const confirmed = asTemplate(value.confirmed, defaults.confirmed);
  if (!confirmed.subject.includes("{customerSubject}")) {
    confirmed.subject = defaults.confirmed.subject;
  }
  const cancelled = asTemplate(value.cancelled, defaults.cancelled);
  if (
    cancelled.subject.includes("{kind}") ||
    !/cancell/i.test(cancelled.subject)
  ) {
    Object.assign(cancelled, defaults.cancelled);
  }
  return {
    confirmed,
    modified: asTemplate(value.modified, defaults.modified),
    cancelled,
    admin,
  };
}

export function normalizeSettings(
  settings: Partial<Settings> & Record<string, unknown>,
): Settings {
  const templates = normalizeEmailTemplates(settings.emailTemplates);
  return {
    multiTourPercent: Number(settings.multiTourPercent ?? 10),
    minimumTours: Number(settings.minimumTours ?? 2),
    cancellationHours: Number(settings.cancellationHours ?? 24),
    lateRefundPercent: Number(settings.lateRefundPercent ?? 0),
    retentionDays: Number(settings.retentionDays ?? 730),
    emailFooter:
      typeof settings.emailFooter === "string" && settings.emailFooter.trim()
        ? settings.emailFooter
        : "FreeTourPraga · Assistenza tutti i giorni 9:00–19:00",
    emailTemplates: templates,
    lastMinuteEnabled: Boolean(settings.lastMinuteEnabled),
    lastMinuteHours: Math.min(
      168,
      Math.max(1, Number(settings.lastMinuteHours ?? 12)),
    ),
    lastMinuteDiscountPercent: Math.min(
      100,
      Math.max(0, Number(settings.lastMinuteDiscountPercent ?? 0)),
    ),
  };
}

export function customerTemplateForKind(
  templates: EmailTemplates,
  kind: string,
): EmailKindTemplate {
  if (/cancell/i.test(kind)) return templates.cancelled;
  if (/modific|aggiorn/i.test(kind)) return templates.modified;
  return templates.confirmed;
}
