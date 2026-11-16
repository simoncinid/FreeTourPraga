import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const origin = process.env.TEST_URL || 'http://localhost:3100';
const before = JSON.parse(await readFile('tmp/seo-phase2/layout-before.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const result = [];
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  const shape = await page.locator('main section').evaluateAll(nodes => nodes.map(n => ({ tag: n.tagName, id: n.id, class: n.className })));
  assert.deepEqual(shape, before[width], 'Section structure must stay unchanged');
  assert.match(await page.locator('h1').innerText(), /Free Tour Praga/);
  assert.equal(await page.locator('#informazioni-utili li').count(), 6);
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(homeOverflow, false, `Home overflow at ${width}px`);
  await page.screenshot({ path: `tmp/seo-phase2/home-after-${width}.png`, animations: 'disabled' });
  await page.goto(origin + '/tour/castello/', { waitUntil: 'networkidle' });
  assert.match(await page.locator('#esperienza').innerText(), /Porta Mattia/);
  assert.match(await page.locator('#esperienza').innerText(), /Malá Strana/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Castle overflow at ${width}px`);
  await page.screenshot({ path: `tmp/seo-phase2/castle-after-${width}.png`, animations: 'disabled' });
  assert.deepEqual(errors, []);
  result.push({ width, unchangedHomeSections: shape.length, answerCards: 6, overflow: false, jsErrors: errors });
  await page.close();
 }
} finally { await browser.close(); }
await writeFile('tmp/seo-phase2/browser-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
