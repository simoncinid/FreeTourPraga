import { setDefaultResultOrder } from "node:dns";
import { randomUUID } from "node:crypto";
import { transaction } from "./store";
import { releaseExpired } from "./booking";
import { deliverEmail, emailProvider } from "./email-delivery";

setDefaultResultOrder("ipv4first");

export async function sendEmailTest(to: string) {
  const provider = emailProvider();
  const started = Date.now();
  try {
    const messageId = await deliverEmail({
      id: randomUUID(),
      to,
      subject: "[TEST] FreeTourPraga · invio email",
      text: "Email tecnica di collaudo FreeTourPraga. Nessuna prenotazione reale.",
    });
    return { ok: true as const, provider, messageId, ms: Date.now() - started };
  } catch (error) {
    return {
      ok: false as const,
      provider,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : "Errore provider",
    };
  }
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
      const providerId = await deliverEmail(job);
      await transaction((s) => {
        const j = s.jobs.find((j) => j.id === job.id)!;
        j.status = "sent";
        j.providerId = providerId;
        j.error = undefined;
      });
      results.push({ id: job.id, status: "sent" });
    } catch (e) {
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
