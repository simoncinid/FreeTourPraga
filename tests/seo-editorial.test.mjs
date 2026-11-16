import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mergeSeoEditorial } from '../scripts/seo-editorial-merge.mjs';
const patch = JSON.parse(await readFile(new URL('../src/content/seo-editorial.json', import.meta.url), 'utf8'));
const initial = () => ({
  siteContent: { home: { heroTitle: 'Titolo precedente', heroImage: '/original.jpg', primaryHref: '/tour', primaryLabel: 'I nostri tour', stats: [{ value: 'Originale' }], groups: [{ title: 'Originale' }] }, globals: { navigation: ['same'] }, gallery: ['same'], answers: [{ question: 'old', answer: 'old' }] },
  tours: [{ id: 'castle', slug: 'castello-praga-mala-strana', canonicalPath: '/tour/castello/', title: 'Titolo scelto', basePriceCents: 3900, meetingPoint: 'Punto configurato', slots: [{ id: 'sold', reserved: 4 }] }],
  bookings: [{ pnr: 'existing' }], orders: [{ id: 'existing' }], jobs: ['existing'], settings: { retained: true },
});
test('editorial completion changes only existing text fields and castle descriptive content', () => {
  const before = initial();const result = mergeSeoEditorial(before, patch);const after = result.state;
  assert.equal(result.applied, true);
  assert.match(after.siteContent.home.heroTitle, /Free Tour Praga/);
  assert.equal(after.siteContent.answers.length, 6);
  assert.equal(after.siteContent.home.primaryHref, before.siteContent.home.primaryHref);
  assert.equal(after.siteContent.home.primaryLabel, before.siteContent.home.primaryLabel);
  assert.deepEqual(after.siteContent.home.stats, before.siteContent.home.stats);
  assert.deepEqual(after.siteContent.home.groups, before.siteContent.home.groups);
  for (const key of ['globals', 'gallery']) assert.deepEqual(after.siteContent[key], before.siteContent[key]);
  for (const key of ['bookings', 'orders', 'jobs', 'settings']) assert.deepEqual(after[key], before[key]);
  for (const key of ['id','slug','title','basePriceCents','meetingPoint','slots']) assert.deepEqual(after.tours[0][key], before.tours[0][key]);
  assert.match(after.tours[0].descriptionHtml, /Porta Mattia/);
  assert.match(after.tours[0].descriptionHtml, /Bigliett|bigliett/);
  assert.doesNotMatch(after.tours[0].descriptionHtml, /400 CZK|16 €|14:30/);
  assert.equal(after.tours[0].operationalReviewRequired, true);
});
test('reapplying a reviewed revision preserves later CMS copy edits', () => {
  const first=mergeSeoEditorial(initial(),patch).state;first.siteContent.home.heroTitle='Modifica successiva';first.tours[0].description='Descrizione successiva';
  const second=mergeSeoEditorial(first,patch);assert.equal(second.applied,false);assert.deepEqual(second.state,first);
});
test('legacy published page overrides are normalized once and cannot hide the new home copy', () => {
 const state=initial();state.pages={homepage:{published:true,title:'Vecchio titolo',subtitle:'Vecchio soprattitolo',body:'Vecchia descrizione'},blog:{published:true,title:'Titolo blog personalizzato',subtitle:'Blog personale',body:'Testo blog personale'}};
 const result=mergeSeoEditorial(state,patch).state;
 assert.equal(result.siteContent.contentVersion,2);assert.equal(result.siteContent.home.heroTitle,patch.home.heroTitle);assert.equal(result.siteContent.home.galleryTitle,'Titolo blog personalizzato');
});
