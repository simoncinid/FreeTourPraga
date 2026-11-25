/**
 * Aggiunge/aggiorna il template email «expired» nelle settings di produzione
 * senza sovrascrivere gli altri testi del gestionale.
 */
import {
  defaultEmailTemplates,
  normalizeSettings,
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
const defaults = defaultEmailTemplates();
const next = normalizeSettings({
  ...state.settings,
  emailTemplates: {
    ...state.settings.emailTemplates,
    expired: defaults.expired,
  },
});
await call("admin/settings", next, "PUT");
const after = await call("admin/state", undefined, "GET");
const expired = after.settings.emailTemplates.expired;
if (!expired?.subject?.includes("scaduta") && !/scaduta/i.test(expired?.subject || "")) {
  throw new Error(`expired template missing: ${JSON.stringify(expired)}`);
}
if (!/posti riservati sono stati liberati/i.test(expired.text || "")) {
  throw new Error("expired template text incomplete");
}
console.log(
  JSON.stringify(
    {
      ok: true,
      paymentHoldMinutes: after.settings.paymentHoldMinutes,
      expiredSubject: expired.subject,
    },
    null,
    2,
  ),
);
