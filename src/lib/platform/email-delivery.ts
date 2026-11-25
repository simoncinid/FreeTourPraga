import { createHash } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import type { Job } from "./model";

type Email = Pick<Job, "id" | "to" | "bcc" | "subject" | "text" | "html" | "calendar" | "bookingPnr"> & {
  replyTo?: string;
};

let smtp: Transporter | undefined;

export function emailProvider() {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.SMTP_HOST?.trim()) return "smtp";
  return null;
}

async function sendWithResend(email: Email, from: string, apiKey: string) {
  const recipients = (addresses: string) =>
    addresses.split(",").map((address) => address.trim()).filter(Boolean);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `freetourpraga/${createHash("sha256").update(email.id).digest("hex")}`,
    },
    body: JSON.stringify({
      from,
      to: recipients(email.to!),
      bcc: email.bcc ? recipients(email.bcc) : undefined,
      reply_to: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html || undefined,
      attachments: email.calendar ? [{
        filename: `${email.bookingPnr || "prenotazione"}.ics`,
        content: Buffer.from(email.calendar).toString("base64"),
        content_type: "text/calendar; charset=utf-8",
      }] : undefined,
    }),
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(`Resend HTTP ${response.status}: ${typeof body.name === "string" ? body.name : "invio rifiutato"}`);
  if (typeof body.id !== "string" || !body.id)
    throw new Error("Resend non ha restituito un identificativo");
  return body.id as string;
}

export async function deliverEmail(email: Email) {
  const provider = emailProvider();
  const from = (provider === "resend" ? process.env.RESEND_FROM : undefined)?.trim()
    || process.env.SMTP_FROM?.trim();
  if (!provider || !from) throw new Error("Provider email o mittente non configurato");
  if (!email.to?.trim() || !email.subject?.trim() || !(email.text || email.html))
    throw new Error("Email senza destinatario, oggetto o contenuto");
  if (provider === "resend")
    return sendWithResend(email, from, process.env.RESEND_API_KEY!.trim());

  const port = Number(process.env.SMTP_PORT || 587);
  smtp ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
  const result = await smtp.sendMail({
    from,
    to: email.to,
    bcc: email.bcc || undefined,
    replyTo: email.replyTo,
    subject: email.subject,
    text: email.text,
    html: email.html || undefined,
    attachments: email.calendar ? [{
      filename: `${email.bookingPnr || "prenotazione"}.ics`,
      content: email.calendar,
      contentType: "text/calendar; charset=utf-8",
    }] : undefined,
    messageId: `<${email.id}@freetourpraga.com>`,
  });
  if (result.rejected?.length) throw new Error("Uno o più destinatari SMTP sono stati rifiutati");
  return String(result.messageId);
}
