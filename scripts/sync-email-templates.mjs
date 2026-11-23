/**
 * Persiste i template email CF7/UWT nelle settings Railway e verifica
 * che una modifica dal gestionale non venga sovrascritta.
 */
import {
  defaultEmailTemplates,
  normalizeSettings,
  renderEmailTemplate,
} from "../src/lib/platform/email-templates.ts";

const base =
  process.env.PLATFORM_URL ||
  "https://web-production-f3beeaff.up.railway.app";
const staffEmail = process.env.STAFF_EMAIL || "diego.simoncini@webbitz.it";
const staffPassword = process.env.STAFF_PASSWORD;
if (!staffPassword) throw new Error("STAFF_PASSWORD richiesto");

let cookie = "";
async function call(path, body, method = body ? "POST" : "GET") {
  const r = await fetch(`${base}/api/platform/${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const c of r.headers.getSetCookie?.() || []) {
    const part = c.split(";")[0];
    if (part.startsWith("ftp_session=")) cookie = part;
  }
  const text = await r.text();
  const json = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(`${path} ${r.status} ${text.slice(0, 400)}`);
  return json;
}

await call("login", { email: staffEmail, password: staffPassword });
const state = await call("admin/state", undefined, "GET");
const next = normalizeSettings({
  ...state.settings,
  emailTemplates: defaultEmailTemplates(),
});
await call("admin/settings", next, "PUT");
const after = await call("admin/state", undefined, "GET");
const t = after.settings.emailTemplates;

const checks = {
  adminSubject: t.admin.subject,
  adminHasUwtTour: t.admin.text.includes("{uwtTour}"),
  adminHasTelefono: t.admin.text.includes("Teléfono:"),
  confirmedSubject: t.confirmed.subject,
  confirmedHasFecha: t.confirmed.text.includes("{fecha}"),
  cancelledSubject: t.cancelled.subject,
};

const renderedAdmin = renderEmailTemplate(t.admin.text, {
  uwtTour: "Tour del Castillo en italiano",
  nome: "Prova Gestionale",
  email: "simoncinidiego10@gmail.com",
  telefono: "+393331111111",
  fecha: "01/12/2026",
  hora: "11:00",
  cantidad: "2",
  ninos: "0",
  totalPagar: "800 CZK",
  afiliado: "",
  note: "Salvato dal gestionale",
});

if (checks.adminSubject !== "Reserva freetourpraga.com italiano") {
  throw new Error(`admin subject unexpected: ${checks.adminSubject}`);
}
if (!checks.adminHasUwtTour || !checks.confirmedHasFecha) {
  throw new Error("templates incomplete after save");
}

next.emailTemplates.confirmed.text =
  "Ciao {nome}, EDIT GESTIONALE {fecha} {hora} · {pnr}";
await call("admin/settings", next, "PUT");
const edited = await call("admin/state", undefined, "GET");
if (!edited.settings.emailTemplates.confirmed.text.includes("EDIT GESTIONALE")) {
  throw new Error("gestionale edit was wiped on reload");
}

next.emailTemplates = defaultEmailTemplates();
await call("admin/settings", next, "PUT");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks,
      renderedAdminHead: renderedAdmin.split("\n").slice(0, 14),
      editPreserved: true,
    },
    null,
    2,
  ),
);
