/** Content-only update of the known Railway review site. Never configures domains or DNS. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { mergeSeoContent } from './seo-content-merge.mjs';
import { mergeSeoEditorial } from './seo-editorial-merge.mjs';
const project = '7a0fae1d-ca22-4b6e-9030-483094639511';
const origin = 'https://web-production-f3beeaff.up.railway.app';
if (process.env.RAILWAY_PROJECT_ID !== project || process.env.RAILWAY_SERVICE_NAME !== 'web' || process.env.SITE_PREVIEW !== 'true' || process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') !== origin || process.env.PLATFORM_STORAGE !== 'postgres') throw Error('Importazione riservata esclusivamente all’anteprima Railway configurata.');
const payload = JSON.parse(await readFile(new URL('../src/content/seo-import.json', import.meta.url), 'utf8'));
const patch = JSON.parse(await readFile(new URL('../src/content/seo-editorial.json', import.meta.url), 'utf8'));
const revision = createHash('sha256').update(JSON.stringify({ payload, patch })).digest('hex');
const apply = process.argv.includes('--apply');
const db = new PrismaClient();
try {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE`;
    const row = await tx.platformState.findUniqueOrThrow({ where: { id: 'main' } });
    const current = row.data;
    if (current.audit?.some((entry) => entry.action === 'seo.preview.import' && entry.target === revision)) {
      console.log(JSON.stringify({ apply, alreadyApplied: true, revision })); return;
    }
    const imported = mergeSeoContent(current, payload);
    const edited = mergeSeoEditorial(imported.state, patch);
    const next = edited.state;
    const summary = { apply, revision, ...imported.summary, editorialApplied: edited.applied, tours: next.tours.length, articles: next.siteContent.gallery.length, preservedBookings: current.bookings.length, preservedOrders: current.orders.length };
    if (!apply) { console.log(JSON.stringify(summary)); return; }
    const backupPath = `/tmp/seo-preview-before-${randomUUID()}.json`;
    const backup = JSON.stringify(current);
    await writeFile(backupPath, backup, { mode: 0o600, flag: 'wx' });
    next.audit = [{ id: randomUUID(), actor: 'deployment', action: 'seo.preview.import', target: revision, at: new Date().toISOString() }, ...(current.audit || [])].slice(0, 10000);
    await tx.platformState.update({ where: { id: 'main' }, data: { data: next } });
    console.log(JSON.stringify({ ...summary, backupPath, backupSha256: createHash('sha256').update(backup).digest('hex') }));
  }, { maxWait: 30000, timeout: 30000 });
} finally { await db.$disconnect(); }
