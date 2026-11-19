import { PrismaClient, Prisma } from "@prisma/client";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { tours } from "../data";
import {
  ensureWpAffiliates,
  wpAffiliatesSeed,
} from "./affiliates-wp";
import {
  defaultContentPages,
  defaultSiteContent,
  mergeContentPages,
  siteContent,
} from "./content";
import { generateScheduledSlots } from "./scheduling";
import type { PlatformState } from "./model";
const runtime = globalThis as unknown as {
  platformPrisma?: PrismaClient;
  platformQueue?: Promise<unknown>;
};
export function database() {
  return (runtime.platformPrisma ??= new PrismaClient());
}
export function hasProductionDatabase() {
  const url = process.env.DATABASE_URL || "";
  try {
    const parsed = new URL(url);
    return ["postgres:", "postgresql:"].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch { return false; }
}
export function localMode() {
  return (
    process.env.PLATFORM_STORAGE === "local" ||
    (!hasProductionDatabase() && process.env.NODE_ENV !== "production")
  );
}
export function initialState(): PlatformState {
  const content = defaultSiteContent();
  return {
    version: 1,
    siteContent: content,
    tours: structuredClone(tours).map((t) => ({
      ...t,
      published: true,
      adultMinAge: 12,
      childMinAge: 4,
      bookingCutoffHours: 2,
      guide: "",
      slots: t.slots.map((s) => ({ ...s, reserved: 0 })),
    })),
    bookings: [],
    orders: [],
    jobs: [],
    affiliates: structuredClone(wpAffiliatesSeed),
    pages: defaultContentPages(content),
    ota: [],
    inquiries: [],
    audit: [],
    events: [],
    rateLimits: {},
    settings: {
      multiTourPercent: 10,
      minimumTours: 2,
      cancellationHours: 24,
      lateRefundPercent: 0,
      retentionDays: 730,
      emailFooter: "FreeTourPraga · Assistenza tutti i giorni 9:00–19:00",
      reminderHours: 24,
      googleAdsId: "",
      googleAdsLabel: "",
    },
  };
}
const file = () =>
  resolve(process.env.PLATFORM_DATA_FILE || ".data/platform.json");
function hydrate(state: PlatformState, generateSlots = true) {
  ensureWpAffiliates(state);
  state.closedDates ??= [];
  for (const tour of state.tours) {
    // Retain every referenced slot so old confirmations and cancellations still resolve.
    tour.slots = tour.slots.filter((slot) => !slot.id.startsWith("schedule:") || Date.parse(slot.startsAt) >= Date.now() - 86400000 || state.bookings.some((b) => b.slotId === slot.id));
    if (generateSlots) generateScheduledSlots(tour);
  }
  const content = siteContent(state.siteContent, state.pages);
  if (!state.siteContent) state.siteContent = content;
  state.pages = mergeContentPages(state.pages, content);
  return state;
}
async function readLocal(generateSlots = true) {
  try {
    return hydrate(JSON.parse(await readFile(file(), "utf8")) as PlatformState, generateSlots);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return initialState();
  }
}
// All mutations, including inventory, outbox and deduplication, commit together.
// PostgreSQL row lock serializes requests across application instances and workers.
export async function transaction<T>(
  work: (state: PlatformState) => T | Promise<T>,
): Promise<T> {
  if (localMode()) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Archivio locale vietato in produzione");
    const pending = (runtime.platformQueue ?? Promise.resolve()).then(
      async () => {
        const state = await readLocal();
        const result = await work(state);
        await mkdir(dirname(file()), { recursive: true });
        const temp = `${file()}.${randomUUID()}.tmp`;
        await writeFile(temp, JSON.stringify(state), { mode: 0o600 });
        await rename(temp, file());
        return result;
      },
    );
    runtime.platformQueue = pending.catch(() => {});
    return pending;
  }
  if (!hasProductionDatabase()) throw new Error("DATABASE_URL richiesta");
  const db = database();
  await db.platformState.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      data: initialState() as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE`;
      const row = await tx.platformState.findUniqueOrThrow({
        where: { id: "main" },
      });
      const state = hydrate(row.data as unknown as PlatformState);
      const result = await work(state);
      await tx.platformState.update({
        where: { id: "main" },
        data: { data: state as unknown as Prisma.InputJsonValue },
      });
      return result;
    },
    { maxWait: 15000, timeout: 15000 },
  );
}
export async function readState({ generateSlots = true } = {}): Promise<PlatformState> {
  if (localMode()) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Archivio locale vietato in produzione");
    return readLocal(generateSlots);
  }
  if (!hasProductionDatabase()) throw new Error("DATABASE_URL PostgreSQL richiesta");
  const row = await database().platformState.findUnique({
    where: { id: "main" },
  });
  return row
    ? hydrate(row.data as unknown as PlatformState, generateSlots)
    : initialState();
}
export function audit(
  s: PlatformState,
  actor: string,
  action: string,
  target: string,
) {
  s.audit.unshift({
    id: randomUUID(),
    actor,
    action,
    target,
    at: new Date().toISOString(),
  });
  s.audit = s.audit.slice(0, 10000);
}
