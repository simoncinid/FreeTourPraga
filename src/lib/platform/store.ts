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
import { releaseExpired } from "./payment-holds";
import { normalizeSettings } from "./email-templates";
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
    settings: normalizeSettings({}),
  };
}
const file = () =>
  resolve(process.env.PLATFORM_DATA_FILE || ".data/platform.json");
function hydrate(state: PlatformState, generateSlots = true) {
  ensureWpAffiliates(state);
  state.closedDates ??= [];
  state.ota ??= [];
  state.settings = normalizeSettings(state.settings || {});
  releaseExpired(state);
  const bookedSlots = new Set(state.bookings.map(({ slotId }) => slotId));
  for (const tour of state.tours) {
    // Clausola tour vuota → usa la globale (tour esistenti e nuovi).
    if (typeof tour.cancellationClause !== "string") tour.cancellationClause = "";
    // Retain every referenced slot so old confirmations and cancellations still resolve.
    tour.slots = tour.slots.filter((slot) => !slot.id.startsWith("schedule:") || Date.parse(slot.startsAt) >= Date.now() - 86400000 || bookedSlots.has(slot.id));
    if (generateSlots && !tour.archivedAt) generateScheduledSlots(tour, undefined, bookedSlots);
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
  { generateSlots = true } = {},
): Promise<T> {
  if (localMode()) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Archivio locale vietato in produzione");
    const pending = (runtime.platformQueue ?? Promise.resolve()).then(
      async () => {
        const state = await readLocal(generateSlots);
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
      const state = hydrate(row.data as unknown as PlatformState, generateSlots);
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
  meta?: {
    before?: string;
    after?: string;
    tour?: string;
    when?: string;
    booking?: string;
  },
) {
  const clip = (value: string | undefined, max: number) =>
    value?.replace(/\s+/g, " ").trim().slice(0, max) || undefined;
  s.audit.unshift({
    id: randomUUID(),
    actor,
    action,
    target: target.slice(0, 500),
    at: new Date().toISOString(),
    ...(clip(meta?.before, 2000) ? { before: clip(meta?.before, 2000) } : {}),
    ...(clip(meta?.after, 2000) ? { after: clip(meta?.after, 2000) } : {}),
    ...(clip(meta?.tour, 300) ? { tour: clip(meta?.tour, 300) } : {}),
    ...(clip(meta?.when, 80) ? { when: clip(meta?.when, 80) } : {}),
    ...(clip(meta?.booking, 40) ? { booking: clip(meta?.booking, 40) } : {}),
  });
  s.audit = s.audit.slice(0, 10000);
}
