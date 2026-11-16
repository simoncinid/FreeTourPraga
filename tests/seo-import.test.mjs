import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mergeSeoContent } from '../scripts/seo-content-merge.mjs';
const payload = JSON.parse(await readFile(new URL('../src/content/seo-import.json', import.meta.url), 'utf8'));
const current = () => ({
  version: 1, tours: [{ id: 'castle', slug: 'castello-praga-mala-strana', title: 'Scheda esistente', basePriceCents: 3900, slots: [{ id: 'sold', reserved: 3, capacity: 10 }] }],
  siteContent: { globals: { navigation: [{ label: 'Tour', href: '/tour' }] }, home: { heroTitle: 'Il mio titolo', groups: ['mine'] }, gallery: [{ id: 'my-article', title: 'Il mio articolo', blocks: [{ type: 'text', text: 'Contenuto già scritto' }] }] },
  pages: { homepage: { published: false, title: 'Homepage' } },
  bookings: [{ pnr: 'booking-existing' }], orders: [{ id: 'order-existing' }], jobs: [{ id: 'job-existing' }], settings: { payment: 'unchanged' }, affiliates: [{ code: 'HOTEL' }], inquiries: [{ id: 'inquiry-existing' }],
});
test('import adds missing records while preserving the existing design and all operational data', () => {
  const before = current();
  const { state, summary } = mergeSeoContent(before, payload);
  assert.deepEqual(summary, { toursAdded: 9, toursLinked: 1, articlesAdded: 24, pagesAdded: 26 });
  for (const key of ['bookings', 'orders', 'jobs', 'settings', 'affiliates', 'inquiries']) assert.deepEqual(state[key], before[key]);
  assert.deepEqual(state.siteContent.home, before.siteContent.home);
  assert.deepEqual(state.siteContent.globals, before.siteContent.globals);
  assert.deepEqual(state.siteContent.gallery[0], before.siteContent.gallery[0]);
  assert.deepEqual(state.tours[0].slots, before.tours[0].slots);
  assert.equal(state.tours[0].basePriceCents, before.tours[0].basePriceCents);
  assert.equal(state.tours[0].title, before.tours[0].title);
  assert.equal(state.tours[0].canonicalPath, '/tour/castello/');
  assert.equal(before.tours.length, 1, 'Original object must not be mutated');
});
test('re-import is idempotent and preserves later edits to imported articles and tours', () => {
  const first = mergeSeoContent(current(), payload).state;
  first.tours[1].title = 'Titolo aggiornato dal gestore';
  first.siteContent.gallery[1].title = 'Articolo aggiornato dal gestore';
  const second = mergeSeoContent(first, payload);
  assert.deepEqual(second.state, first);
  assert.equal(second.summary.toursAdded + second.summary.articlesAdded + second.summary.pagesAdded, 0);
});
