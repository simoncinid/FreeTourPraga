/**
 * Scrive il template email «expired» nel PlatformState PostgreSQL
 * senza toccare gli altri template del gestionale.
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL || "";
if (!url.includes("postgres")) {
  throw new Error("DATABASE_URL PostgreSQL richiesta");
}

const expired = {
  subject: "Prenotazione scaduta · {pnr} · {tour}",
  text: [
    "Ciao {nome},",
    "",
    "la tua prenotazione {pnr} per {tour} del {fecha} alle {hora} è scaduta.",
    "",
    "Non abbiamo ricevuto il tuo messaggio WhatsApp entro i tempi indicati, quindi i posti riservati sono stati liberati e la prenotazione non è più attiva.",
    "",
    "Partecipanti: {persone}",
    "Importo della prenotazione: {totale}",
    "",
    "Se vuoi ancora partecipare, effettua una nuova prenotazione dal sito oppure scrivici per assistenza: {assistenza}",
    "",
    "Riferimento: {pnr}",
    "",
    "{firma}",
  ].join("\n"),
  html: `<div style="font-family:arial,sans-serif;margin:5px;color:#3c3c3c">
<p>Ciao {nome},</p>
<p>La tua prenotazione <b>{pnr}</b> per <b>{tour}</b> del <b>{fecha}</b> alle <b>{hora}</b> è scaduta.</p>
<p>Non abbiamo ricevuto il tuo messaggio WhatsApp entro i tempi indicati, quindi i posti riservati sono stati liberati e la prenotazione non è più attiva.</p>
<ul>
<li style="margin-bottom:10px"><b>Partecipanti:</b> {persone}</li>
<li style="margin-bottom:10px"><b>Importo:</b> {totale}</li>
</ul>
<p>Se vuoi ancora partecipare, effettua una nuova prenotazione dal sito oppure scrivici per assistenza: {assistenza}</p>
<p>Riferimento: {pnr}</p>
<p style="text-align:center;padding-top:20px">{firma}</p>
</div>`,
};

const db = new PrismaClient();
const row = await db.platformState.findUnique({ where: { id: "main" } });
if (!row) throw new Error("PlatformState main assente");

const state = row.data;
if (!state.settings) state.settings = {};
if (!state.settings.emailTemplates) state.settings.emailTemplates = {};
state.settings.emailTemplates.expired = expired;
if (
  state.settings.paymentHoldMinutes == null ||
  !Number.isFinite(Number(state.settings.paymentHoldMinutes))
) {
  state.settings.paymentHoldMinutes = 120;
}

await db.platformState.update({
  where: { id: "main" },
  data: { data: state },
});

const verify = await db.platformState.findUniqueOrThrow({
  where: { id: "main" },
});
const saved = verify.data.settings?.emailTemplates?.expired;
if (!saved?.text?.includes("posti riservati sono stati liberati")) {
  throw new Error("Verifica fallita: template expired non persistito");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      paymentHoldMinutes: verify.data.settings.paymentHoldMinutes,
      expiredSubject: saved.subject,
    },
    null,
    2,
  ),
);

await db.$disconnect();
