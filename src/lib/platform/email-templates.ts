import type { EmailKindTemplate, EmailTemplates, Settings } from "./model";

export const EMAIL_PLACEHOLDERS = [
  "kind",
  "nome",
  "pnr",
  "tour",
  "data",
  "persone",
  "totale",
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
  "email",
  "telefono",
  "note",
  "adulti",
  "minori",
] as const;

export function defaultEmailTemplates(): EmailTemplates {
  return {
    confirmed: {
      subject: "{kind} · {pnr} · {brand}",
      text: [
        "Prenotazione {pnr}: {kind}",
        "Ciao {nome},",
        "{tour}",
        "{data}",
        "{persone} · EUR {totale}",
        "Punto d'incontro: {incontro}, {indirizzo}",
        "{mappa}",
        "{pagamento}",
        "{nota}",
        "{cancellazione}",
        "Gestisci questa prenotazione: {manageUrl}",
        "Assistenza: {assistenza} · riferimento {pnr}.",
        "Calendario: {calendarUrl}",
        "{firma}",
      ].join("\n"),
      html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>Grazie per aver prenotato con noi.</p>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">{kind} · {pnr}</h3>
<ul>
<li style="margin-bottom:10px"><b>Nome:</b> {nome}</li>
<li style="margin-bottom:10px"><b>Tour:</b> {tour}</li>
<li style="margin-bottom:10px"><b>Data/ora:</b> {data}</li>
<li style="margin-bottom:10px"><b>Persone:</b> {persone}</li>
<li style="margin-bottom:10px"><b>Totale:</b> EUR {totale}</li>
<li style="margin-bottom:10px"><b>Lingua:</b> italiano</li>
</ul>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">Punto di partenza</h3>
<p>{incontro} · {indirizzo}<br/>
<a href="{mappa}">Mappa »</a></p>
<p><b>Telefono:</b> {telefonoContatto}</p>
<p>{pagamento}</p>
<p>{nota}</p>
<p>{cancellazione}</p>
<p><a href="{manageUrl}">Gestisci modifica o cancellazione</a> · <a href="{calendarUrl}">Aggiungi al calendario</a></p>
<p style="text-align:center;padding-top:20px">{firma}<br/>
<a href="{siteUrl}">{brand}</a></p>
</div>`,
    },
    modified: {
      subject: "{kind} · {pnr} · {brand}",
      text: [
        "Prenotazione {pnr}: {kind}",
        "Ciao {nome},",
        "La tua prenotazione è stata aggiornata.",
        "{tour}",
        "{data}",
        "{persone} · EUR {totale}",
        "Punto d'incontro: {incontro}, {indirizzo}",
        "{mappa}",
        "{cancellazione}",
        "Gestisci questa prenotazione: {manageUrl}",
        "Assistenza: {assistenza} · riferimento {pnr}.",
        "Calendario: {calendarUrl}",
        "{firma}",
      ].join("\n"),
      html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>La tua prenotazione è stata aggiornata.</p>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">{kind} · {pnr}</h3>
<ul>
<li style="margin-bottom:10px"><b>Nome:</b> {nome}</li>
<li style="margin-bottom:10px"><b>Tour:</b> {tour}</li>
<li style="margin-bottom:10px"><b>Data/ora:</b> {data}</li>
<li style="margin-bottom:10px"><b>Persone:</b> {persone}</li>
<li style="margin-bottom:10px"><b>Totale:</b> EUR {totale}</li>
</ul>
<p>{incontro} · {indirizzo}<br/><a href="{mappa}">Mappa »</a></p>
<p>{cancellazione}</p>
<p><a href="{manageUrl}">Gestisci modifica o cancellazione</a> · <a href="{calendarUrl}">Aggiungi al calendario</a></p>
<p style="text-align:center;padding-top:20px">{firma}</p>
</div>`,
    },
    cancelled: {
      subject: "{kind} · {pnr} · {brand}",
      text: [
        "Prenotazione {pnr}: {kind}",
        "Ciao {nome},",
        "La prenotazione per {tour} del {data} è stata cancellata.",
        "{persone} · EUR {totale}",
        "{pagamento}",
        "{cancellazione}",
        "Assistenza: {assistenza} · riferimento {pnr}.",
        "{firma}",
      ].join("\n"),
      html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>La prenotazione è stata cancellata.</p>
<h3 style="background-color:#167895;color:#ffffff;padding:5px">{kind} · {pnr}</h3>
<ul>
<li style="margin-bottom:10px"><b>Nome:</b> {nome}</li>
<li style="margin-bottom:10px"><b>Tour:</b> {tour}</li>
<li style="margin-bottom:10px"><b>Data/ora:</b> {data}</li>
<li style="margin-bottom:10px"><b>Totale:</b> EUR {totale}</li>
</ul>
<p>{pagamento}</p>
<p>{cancellazione}</p>
<p>Assistenza: {assistenza}</p>
<p style="text-align:center;padding-top:20px">{firma}</p>
</div>`,
    },
    admin: {
      subject: "Reserva freetourpraga.com italiano · {pnr} · {kind}",
      text: [
        "Tour: {tour}",
        "Stato: {kind}",
        "PNR: {pnr}",
        "De: {nome}",
        "Email: {email}",
        "Telefono: {telefono}",
        "Fecha: {data}",
        "Adulti: {adulti}",
        "Minori: {minori}",
        "Idioma del Tour: italiano",
        "Afiliado: {affiliate}",
        "Mensaje: {note}",
        "Totale: EUR {totale}",
        "Gestione: {manageUrl}",
        "--",
        "Email inviata dal sistema prenotazioni Free Tour Praga",
      ].join("\n"),
    },
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

function asTemplate(value: unknown, fallback: EmailKindTemplate): EmailKindTemplate {
  if (!value || typeof value !== "object") return { ...fallback };
  const row = value as Partial<EmailKindTemplate>;
  return {
    subject: typeof row.subject === "string" && row.subject.trim() ? row.subject : fallback.subject,
    text: typeof row.text === "string" && row.text.trim() ? row.text : fallback.text,
    html: typeof row.html === "string" && row.html.trim() ? row.html : fallback.html,
  };
}

export function normalizeEmailTemplates(raw: unknown): EmailTemplates {
  const defaults = defaultEmailTemplates();
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as Partial<EmailTemplates>;
  const adminRaw =
    value.admin && typeof value.admin === "object"
      ? (value.admin as { subject?: string; text?: string })
      : {};
  return {
    confirmed: asTemplate(value.confirmed, defaults.confirmed),
    modified: asTemplate(value.modified, defaults.modified),
    cancelled: asTemplate(value.cancelled, defaults.cancelled),
    admin: {
      subject:
        typeof adminRaw.subject === "string" && adminRaw.subject.trim()
          ? adminRaw.subject
          : defaults.admin.subject,
      text:
        typeof adminRaw.text === "string" && adminRaw.text.trim()
          ? adminRaw.text
          : defaults.admin.text,
    },
  };
}

export function normalizeSettings(settings: Partial<Settings> & Record<string, unknown>): Settings {
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
    lastMinuteHours: Math.min(168, Math.max(1, Number(settings.lastMinuteHours ?? 12))),
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
