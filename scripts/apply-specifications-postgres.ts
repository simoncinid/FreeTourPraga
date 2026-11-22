/** Scoped, backed-up and idempotent content migration for the known Railway preview or isolated tests. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { applySpecifications } from "../src/lib/platform/specifications";
import { mergeContentPages, siteContent } from "../src/lib/platform/content";
import type { PlatformState } from "../src/lib/platform/model";
const test =
  process.env.TEST_POSTGRES === "1" &&
  /^ftp_test_http_[a-z0-9_]+$/.test(
    new URL(process.env.DATABASE_URL!).pathname.slice(1),
  );
if (!test) {
  assert.equal(
    process.env.RAILWAY_PROJECT_ID,
    "7a0fae1d-ca22-4b6e-9030-483094639511",
  );
  assert.equal(process.env.RAILWAY_SERVICE_NAME, "web");
  assert.equal(process.env.SITE_PREVIEW, "true");
  assert.equal(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ""),
    "https://web-production-f3beeaff.up.railway.app",
  );
}
assert.equal(process.env.PLATFORM_STORAGE, "postgres");
const apply = process.argv.includes("--apply"),
  db = new PrismaClient();
try {
  await db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE`;
      const row = await tx.platformState.findUniqueOrThrow({
        where: { id: "main" },
      });
      const before = row.data as unknown as PlatformState;
      const next = structuredClone(before);
      const result = applySpecifications(next);
      next.siteContent = siteContent(next.siteContent, next.pages);
      next.pages = mergeContentPages(next.pages, next.siteContent);
      for (const field of [
        "bookings",
        "orders",
        "jobs",
        "affiliates",
        "inquiries",
      ] as const)
        assert.deepEqual(
          next[field],
          before[field],
          `Migration must preserve ${field}`,
        );
      const summary = {
        apply,
        ...result,
        tours: next.tours.length,
        articles: next.siteContent.gallery.length,
        preservedBookings: before.bookings.length,
        preservedOrders: before.orders.length,
      };
      if (!apply) {
        console.log(JSON.stringify(summary));
        return;
      }
      await mkdir("privato", { recursive: true, mode: 0o700 });
      const backupPath = `privato/before-specifications-railway-${Date.now()}-${randomUUID()}.json`;
      const backup = JSON.stringify(before);
      await writeFile(backupPath, backup, { mode: 0o600, flag: "wx" });
      next.audit = [
        {
          id: randomUUID(),
          actor: "deployment",
          action: "specifications.v2.complete",
          target: "2026-11-22",
          at: new Date().toISOString(),
        },
        ...(next.audit ?? []),
      ].slice(0, 10000);
      await tx.platformState.update({
        where: { id: "main" },
        data: { data: next as unknown as Prisma.InputJsonValue },
      });
      console.log(
        JSON.stringify({
          ...summary,
          backupPath,
          backupSha256: createHash("sha256").update(backup).digest("hex"),
        }),
      );
    },
    { maxWait: 30000, timeout: 60000 },
  );
} finally {
  await db.$disconnect();
}
