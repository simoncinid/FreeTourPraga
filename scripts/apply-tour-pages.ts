import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { applyTourPages } from "../src/lib/platform/tour-pages";
import {
  database,
  localMode,
  readState,
  transaction,
} from "../src/lib/platform/store";
import { tourSchema } from "../src/lib/platform/validation";
import type { PlatformState } from "../src/lib/platform/model";

const apply = process.argv.includes("--apply");
const backupDir = process.env.TOUR_PAGES_BACKUP_DIR || "privato";
const local = localMode();

function check(state: PlatformState, next: PlatformState, updated: string[]) {
  assert.deepEqual(next.bookings, state.bookings);
  assert.deepEqual(next.orders, state.orders);
  assert.deepEqual(next.jobs, state.jobs);
  const bookedSlots = new Set(state.bookings.map(({ slotId }) => slotId));
  for (const tour of state.tours) {
    const changed = next.tours.find(({ id }) => id === tour.id)!;
    for (const slot of tour.slots)
      if (bookedSlots.has(slot.id) || slot.reserved) {
        const current = changed.slots.find(({ id }) => id === slot.id)!;
        assert.equal(current.startsAt, slot.startsAt);
        assert.equal(current.endsAt, slot.endsAt);
        assert.equal(current.reserved, slot.reserved);
        assert.equal(current.closed, slot.closed);
      }
    if (updated.includes(changed.slug)) tourSchema.parse(changed);
  }
}

async function migrate(state: PlatformState) {
  const next = structuredClone(state);
  const result = applyTourPages(next);
  check(state, next, result.updated);
  const summary = {
    apply,
    ...result,
    preservedBookings: state.bookings.length,
    preservedOrders: state.orders.length,
    tours: next.tours
      .filter(({ slug }) => result.updated.includes(slug))
      .map((tour) => ({
        slug: tour.slug,
        path: tour.canonicalPath,
        priceCzk: tour.basePriceCents / 100,
        weekdays: tour.schedule?.weekdays,
        times: tour.schedule?.times,
        galleryPhotos: (tour.galleryImages?.length ?? 0) + 1,
        published: tour.published,
      })),
  };
  if (!apply || !result.applied) return summary;
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const backupPath = join(
    backupDir,
    `before-tour-pages-${new Date().toISOString().replace(/:/g, "-")}.json`,
  );
  const backup = JSON.stringify(state);
  await writeFile(backupPath, backup, { mode: 0o600, flag: "wx" });
  Object.assign(state, next);
  return {
    ...summary,
    backupPath,
    backupSha256: createHash("sha256").update(backup).digest("hex"),
  };
}

try {
  const databaseName = local
    ? ""
    : new URL(process.env.DATABASE_URL!).pathname.slice(1);
  if (apply && !local)
    assert.equal(
      process.env.TOUR_PAGES_CONFIRM_DATABASE,
      databaseName,
      "Conferma il nome del database con TOUR_PAGES_CONFIRM_DATABASE",
    );
  const state = await readState({ generateSlots: false });
  const trial = await (apply
    ? Promise.resolve(applyTourPages(structuredClone(state)))
    : migrate(state));
  const result =
    apply && trial.applied
      ? await transaction(migrate, { generateSlots: false })
      : trial;
  console.log(JSON.stringify(result));
} finally {
  if (!local) await database().$disconnect();
}
