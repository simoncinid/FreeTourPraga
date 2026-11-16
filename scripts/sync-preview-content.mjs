/** Import a private local CMS snapshot into the linked Railway preview. Never copies operational records. */
import { readFile } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

export function mergePreviewContent(current, snapshot) {
  const tours = [...(current.tours || [])];
  for (const incoming of snapshot.tours) {
    const index = tours.findIndex((tour) => tour.id === incoming.id);
    if (index < 0) {
      tours.push({
        ...incoming,
        slots: incoming.slots.map((slot) => ({ ...slot, reserved: 0 })),
      });
      continue;
    }
    const existing = tours[index];
    const slots = incoming.slots.map((slot) => {
      const booked = existing.slots.find((previous) => previous.id === slot.id);
      // A sold departure keeps its time, capacity and reservation count.
      if (booked?.reserved > 0) return booked;
      return { ...slot, reserved: booked?.reserved || 0 };
    });
    for (const slot of existing.slots)
      if (!slots.some((next) => next.id === slot.id)) slots.push(slot);
    tours[index] = { ...existing, ...incoming, slots };
  }
  return {
    ...current,
    tours,
    siteContent: snapshot.siteContent,
    pages: { ...current.pages, ...snapshot.pages },
    settings: { ...current.settings, ...snapshot.settings },
    audit: [
      {
        id: randomUUID(),
        actor: "deployment",
        action: "content.snapshot.import",
        target: snapshot.id,
        at: new Date().toISOString(),
      },
      ...(current.audit || []),
    ].slice(0, 10000),
  };
}

async function main() {
  if (process.argv.includes("--self-test")) {
    const sold = {
      id: "sold",
      startsAt: "original",
      capacity: 10,
      reserved: 3,
    };
    const current = {
      version: 1,
      bookings: [{ id: "real-booking" }],
      orders: [{ id: "real-order" }],
      jobs: [{ id: "existing-job" }],
      inquiries: [{ id: "existing-inquiry" }],
      affiliates: [{ id: "existing-affiliate" }],
      tours: [
        {
          id: "tour",
          title: "Old",
          slots: [sold, { id: "retained", reserved: 0 }],
        },
        { id: "remote-only", slots: [] },
      ],
      pages: { privacy: { title: "Remote legal page" } },
      settings: { retained: true },
      audit: [],
    };
    const snapshot = {
      id: "test",
      tours: [
        {
          id: "tour",
          title: "New",
          slots: [
            { id: "sold", startsAt: "changed", capacity: 2, reserved: 0 },
            { id: "new", reserved: 8 },
          ],
        },
      ],
      siteContent: { gallery: [] },
      pages: { blog: { title: "Blog" } },
      settings: { changed: true },
    };
    const merged = mergePreviewContent(current, snapshot);
    for (const key of ["bookings", "orders", "jobs", "inquiries", "affiliates"])
      assert.deepEqual(merged[key], current[key]);
    assert.deepEqual(merged.tours[0].slots[0], sold);
    assert.equal(merged.tours[0].slots[1].reserved, 0);
    assert.equal(merged.tours[0].slots[2].id, "retained");
    assert.equal(merged.tours[1].id, "remote-only");
    assert.equal(merged.pages.privacy.title, "Remote legal page");
    assert.equal(merged.settings.retained, true);
    assert.equal(merged.audit[0].target, "test");
    console.log(
      "PASS: content import preserves reservations, sold departures, remote-only tours, jobs, inquiries and unrelated settings",
    );
    return;
  }
  const index = process.argv.indexOf("--snapshot");
  if (index < 0 || !process.argv[index + 1])
    throw Error(
      "Usage: node scripts/sync-preview-content.mjs --snapshot /private/path/snapshot.json [--apply]",
    );
  if (
    process.env.SITE_PREVIEW !== "true" ||
    process.env.PLATFORM_STORAGE !== "postgres" ||
    process.env.RAILWAY_PROJECT_ID !== "7a0fae1d-ca22-4b6e-9030-483094639511"
  )
    throw Error(
      "Content import is restricted to the configured Railway preview",
    );
  const path = resolve(process.argv[index + 1]);
  const root = dirname(path);
  const snapshot = JSON.parse(await readFile(path, "utf8"));
  assert.equal(snapshot.formatVersion, 1);
  assert.ok(snapshot.id);
  assert.ok(Array.isArray(snapshot.tours));
  assert.ok(snapshot.siteContent);
  assert.ok(snapshot.pages);
  assert.ok(Array.isArray(snapshot.media));
  for (const key of [
    "bookings",
    "orders",
    "jobs",
    "inquiries",
    "affiliates",
    "users",
    "secrets",
  ])
    assert.equal(key in snapshot, false, `Snapshot cannot contain ${key}`);
  const media = [];
  for (const asset of snapshot.media) {
    assert.match(asset.id, /^[a-f0-9-]{36}\.webp$/);
    const file = resolve(root, asset.file);
    assert.ok(file.startsWith(resolve(root, "media") + sep));
    const data = await readFile(file);
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.sha256);
    media.push({ id: asset.id, data });
  }
  const prisma = new PrismaClient();
  try {
    const row = await prisma.platformState.findUniqueOrThrow({
      where: { id: "main" },
    });
    const current = row.data;
    if (
      current.audit?.some(
        (entry) =>
          entry.action === "content.snapshot.import" &&
          entry.target === snapshot.id,
      )
    ) {
      console.log(
        JSON.stringify({ alreadyImported: true, snapshot: snapshot.id }),
      );
      return;
    }
    const summary = {
      snapshot: snapshot.id,
      tours: snapshot.tours.length,
      articles: snapshot.siteContent.gallery.length,
      media: media.length,
      preservedBookings: current.bookings?.length || 0,
      preservedOrders: current.orders?.length || 0,
      apply: process.argv.includes("--apply"),
    };
    if (!summary.apply) {
      console.log(JSON.stringify(summary));
      return;
    }
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE`;
        const latest = await tx.platformState.findUniqueOrThrow({
          where: { id: "main" },
        });
        if (
          latest.data.audit?.some(
            (entry) =>
              entry.action === "content.snapshot.import" &&
              entry.target === snapshot.id,
          )
        )
          return;
        for (const asset of media) {
          const existing = await tx.mediaAsset.findUnique({
            where: { id: asset.id },
          });
          if (existing)
            assert.ok(
              Buffer.from(existing.data).equals(asset.data),
              "A media UUID already contains different bytes",
            );
          else
            await tx.mediaAsset.create({
              data: { id: asset.id, data: new Uint8Array(asset.data) },
            });
        }
        await tx.platformState.update({
          where: { id: "main" },
          data: { data: mergePreviewContent(latest.data, snapshot) },
        });
      },
      { maxWait: 30000, timeout: 90000 },
    );
    console.log(JSON.stringify(summary));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
