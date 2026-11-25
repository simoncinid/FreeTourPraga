import assert from "node:assert/strict";
import { test } from "node:test";
import { deliverEmail, emailProvider } from "../src/lib/platform/email-delivery";
import {
  customerTemplateForKind,
  defaultEmailTemplates,
  normalizeSettings,
  renderEmailTemplate,
} from "../src/lib/platform/email-templates";

test("Resend preserves recipients, reply-to, HTML, text and the ICS attachment across retries", async (t) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  t.after(() => {
    if (apiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = apiKey;
    if (from === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = from;
  });
  process.env.RESEND_API_KEY = "fake-resend-test-key";
  process.env.RESEND_FROM = "FreeTourPraga <sender@example.com>";
  const send = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ id: "resend-test-id" }),
  );
  const email = {
    id: "qa-outbox-job",
    to: "staff@example.com, uwt@example.com",
    bcc: "archive@example.com",
    replyTo: "guest@example.com",
    subject: "Conferma QA",
    text: "Conferma",
    html: "<p>Conferma</p>",
    bookingPnr: "FTP-TEST",
    calendar: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
  };
  assert.equal(emailProvider(), "resend");
  assert.equal(await deliverEmail(email), "resend-test-id");
  assert.equal(await deliverEmail(email), "resend-test-id");
  const [[url, first], [, second]] = send.mock.calls.map((call) =>
    call.arguments as unknown as [string, RequestInit],
  );
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(
    new Headers(first.headers).get("Idempotency-Key"),
    new Headers(second.headers).get("Idempotency-Key"),
  );
  assert.deepEqual(JSON.parse(String(first.body)), {
    from: process.env.RESEND_FROM,
    to: ["staff@example.com", "uwt@example.com"],
    bcc: ["archive@example.com"],
    reply_to: "guest@example.com",
    subject: email.subject,
    text: email.text,
    html: email.html,
    attachments: [{
      filename: "FTP-TEST.ics",
      content: Buffer.from(email.calendar).toString("base64"),
      content_type: "text/calendar; charset=utf-8",
    }],
  });

  send.mock.mockImplementationOnce(async () => Response.json(
    { name: "validation_error", message: "Domain is not verified" }, { status: 403 },
  ));
  await assert.rejects(deliverEmail(email), /Resend HTTP 403: validation_error/);
});

test("refund email uses the actual refund amount and existing settings receive the new template", () => {
  const { refunded: _, ...existing } = defaultEmailTemplates();
  const templates = normalizeSettings({ emailTemplates: existing }).emailTemplates;
  const template = customerTemplateForKind(templates, "Rimborso effettuato");
  assert.match(renderEmailTemplate(template.text, { rimborso: "12,00 €" }), /rimborso di 12,00 €/);
  assert.match(template.subject, /^Rimborso effettuato/);
});
