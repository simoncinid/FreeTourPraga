import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { mergeSeoContent } from './seo-content-merge.mjs';
import { mergeSeoEditorial } from './seo-editorial-merge.mjs';
try { process.loadEnvFile('.env.development.local'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const apply = process.argv.includes('--apply');
const postgres = process.argv.includes('--postgres');
const payload = JSON.parse(await readFile('src/content/seo-import.json', 'utf8'));
const editorial = process.argv.includes('--editorial') ? JSON.parse(await readFile('src/content/seo-editorial.json', 'utf8')) : null;
function merge(current) {
  const result = mergeSeoContent(current, payload);
  if (editorial) {
    const edit = mergeSeoEditorial(result.state, editorial);
    result.state = edit.state;
    result.summary.editorialApplied = edit.applied;
  }
  return result;
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
async function backup(state) {
  await mkdir('privato', { recursive: true, mode: 0o700 });
  await writeFile(`privato/seo-before-${stamp}.json`, JSON.stringify(state), { mode: 0o600, flag: 'wx' });
}
if (postgres) {
  const url = new URL(process.env.DATABASE_URL || 'http://missing');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw Error('Importazione consentita soltanto su PostgreSQL locale. Nessuna operazione Railway è prevista.');
  const db = new PrismaClient();
  try {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE`;
      const row = await tx.platformState.findUniqueOrThrow({ where: { id: 'main' } });
      const { state, summary } = merge(row.data);
      console.log(JSON.stringify({ storage: 'postgres-locale', apply, ...summary }));
      if (!apply) return;
      await backup(row.data);
      await tx.platformState.update({ where: { id: 'main' }, data: { data: state } });
    });
  } finally { await db.$disconnect(); }
} else {
  if (process.env.PLATFORM_STORAGE !== 'local') throw Error('Selezionare esplicitamente l’archivio locale oppure --postgres con un database locale.');
  const file = resolve(process.env.PLATFORM_DATA_FILE || '.data/platform.json');
  const current = JSON.parse(await readFile(file, 'utf8'));
  const { state, summary } = merge(current);
  console.log(JSON.stringify({ storage: 'archivio-app-locale', apply, ...summary }));
  if (apply) {
    await backup(current);
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.seo-${stamp}.tmp`;
    await writeFile(temporary, JSON.stringify(state), { mode: 0o600, flag: 'wx' });
    await rename(temporary, file);
  }
}
