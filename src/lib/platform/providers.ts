import nodemailer, { type Transporter } from "nodemailer";
import { transaction } from "./store";
import { releaseExpired } from "./booking";

let sharedTransport: Transporter | null = null;

function smtpTransport() {
  if (!process.env.SMTP_HOST) throw new Error("SMTP non configurato");
  if (sharedTransport) return sharedTransport;
  const port = Number(process.env.SMTP_PORT || 587);
  sharedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    connectionTimeout: 25000,
    greetingTimeout: 25000,
    socketTimeout: 30000,
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
  return sharedTransport;
}

export async function runJobs() {
  await transaction((s) => {
    releaseExpired(s);
  });
  const results = [];
  const deadline = Date.now() + 50000;
  for (let index = 0; index < 20 && Date.now() + 20000 < deadline; index++) {
    const job = await transaction((s) => {
      const j = s.jobs.find(
        (j) =>
          (j.status === "queued" ||
            (j.status === "running" &&
              new Date(j.leaseUntil || 0).getTime() < Date.now())) &&
          new Date(j.runAt).getTime() <= Date.now() &&
          j.type === "email",
      );
      if (!j) return null;
      j.status = "running";
      j.attempts++;
      j.leaseUntil = new Date(Date.now() + 300000).toISOString();
      return structuredClone(j);
    });
    if (!job) break;
    try {
      if (
        job.key.startsWith("reminder-email:") ||
        job.key.startsWith("wa:")
      )
        throw new Error("Reminder disattivati in Fase 1");
      const transport = smtpTransport();
      const { to, subject, text, html, bcc } = job;
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to,
        bcc: bcc || undefined,
        subject,
        text,
        html: html || undefined,
        attachments: job.calendar
          ? [
              {
                filename: `${job.bookingPnr}.ics`,
                content: job.calendar,
                contentType: "text/calendar; charset=utf-8",
              },
            ]
          : undefined,
        messageId: `<${job.id}@freetourpraga.com>`,
      });
      await transaction((s) => {
        const j = s.jobs.find((j) => j.id === job.id)!;
        j.status = "sent";
        j.error = undefined;
      });
      results.push({ id: job.id, status: "sent" });
    } catch (e) {
      sharedTransport = null;
      await transaction((s) => {
        const j = s.jobs.find((j) => j.id === job.id)!;
        j.status = j.attempts >= 5 ? "failed" : "queued";
        j.runAt = new Date(Date.now() + 2 ** j.attempts * 60000).toISOString();
        j.error = e instanceof Error ? e.message : "Errore provider";
      });
      results.push({ id: job.id, status: "retry" });
    }
  }
  // Mark leftover Stripe/WhatsApp jobs as failed without sending.
  await transaction((s) => {
    for (const j of s.jobs) {
      if (
        j.status === "queued" &&
        (j.type === "whatsapp" || j.type === "refund")
      ) {
        j.status = "failed";
        j.error = "Canale non attivo in Fase 1";
      }
    }
  });
  return results;
}
