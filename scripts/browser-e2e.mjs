import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const base = process.env.TEST_URL || 'http://localhost:3101';
if (!/^http:\/\/(localhost|127\.0\.0\.1):3101$/.test(base)) throw Error('Browser mutations allowed only on isolated localhost:3101');
await mkdir('tmp/browser-qa', { recursive: true });
const browser = await chromium.launch();
async function screenshot(page, path) {
 await page.evaluate(async () => { await Promise.all(Array.from(document.images, image => { image.loading = 'eager'; return image.decode().catch(() => {}); })); window.scrollTo(0, 0); });
 await page.screenshot({ path, fullPage: true });
}
try {
 for (const [name, viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
  const context = await browser.newContext({ viewport, timezoneId: 'America/Los_Angeles' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const path of ['/', '/tour', '/partner-europa', '/faq', '/contatti', '/chi-siamo', '/informazioni-utili', '/blog']) {
   await page.goto(base + path);
   const consent = page.getByRole('button', { name: 'Solo necessari', exact: true });
   if (await consent.isVisible()) await consent.click();
   await page.evaluate(() => document.fonts.ready);
   assert.equal(await page.locator('h1').count(), 1, `${name} ${path}: one h1`);
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} ${path}: overflow`);
   await screenshot(page, `tmp/browser-qa/${name}-${path.replaceAll('/','') || 'home'}.png`);
  }
  const catalog = await (await page.request.get(base + '/api/platform/catalog')).json();
  const tour = catalog.tours.find(t => t.slots.some(s => s.capacity > s.reserved));
  const slot = tour.slots.find(s => s.capacity > s.reserved);
  await page.goto(`${base}/tour/${tour.slug}`);
  const date = new Date(slot.startsAt).toLocaleDateString('en-CA',{timeZone:'Europe/Prague'});
  await page.getByRole('button',{name:`Seleziona il ${date}`,exact:true}).click();
  const hour = new Date(slot.startsAt).toLocaleTimeString('it-IT',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'});
  await page.getByRole('button',{name:new RegExp(hour.replace(':','\\:')+'.*posti')}).first().click();
  await page.getByRole('button',{name:'Aggiungi al carrello'}).click();
  await page.waitForURL('**/carrello');
  await page.getByRole('link',{name:'Continua la prenotazione'}).click();
  await page.waitForURL('**/checkout');
  await page.getByLabel('Nome e cognome',{exact:true}).fill('QA Browser');
  await page.getByLabel('Email',{exact:true}).fill('qa-browser@example.com');
  await page.getByLabel('Telefono con prefisso internazionale',{exact:true}).fill('+393331234567');
  await page.locator('input[name="terms"]').check();
  await screenshot(page, `tmp/browser-qa/${name}-checkout.png`);
  await page.getByRole('button',{name:'Conferma prenotazione',exact:true}).click();
  await page.waitForURL('**/prenotazione/confermata');
  await page.getByText('Confermata',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Aggiungi al calendario'}).waitFor();
  await screenshot(page, `tmp/browser-qa/${name}-confirmation.png`);
  assert.equal(errors.length,0,errors.join('\n'));
  await context.close();
  console.log(`PASS browser ${name}: public pages, no overflow, Prague dates from US timezone, cart, cash checkout, confirmation and calendar`);
 }
 const context = await browser.newContext({viewport:{width:1440,height:1000}});
 const page = await context.newPage();
 await page.goto(base+'/accesso');
 await page.getByRole('button',{name:'Solo necessari',exact:true}).click();
 await page.getByLabel('Email',{exact:true}).fill('admin@freetourpraga.local');
 await page.getByLabel('Password',{exact:true}).fill('PragaLocale!2026');
 await page.getByRole('button',{name:'Accedi',exact:true}).click();
 await page.waitForURL('**/admin');
 for (const section of ['tour','calendario','sito','impostazioni']) {
  await page.goto(base+'/admin/'+section);
  await page.locator('.admin-main').waitFor();
  await screenshot(page, `tmp/browser-qa/admin-${section}.png`);
 }
 await context.close();
 console.log('PASS browser staff login and tour/calendar/CMS/settings pages');
} finally { await browser.close(); }
