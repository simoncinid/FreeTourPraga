import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const origin = new URL(option('--url', 'http://localhost:3100')).origin;
const launch = args.includes('--launch');
const preview = args.includes('--preview');
const routes = JSON.parse(await readFile('src/content/wordpress-routes.json', 'utf8'));
const evidence = JSON.parse(await readFile('docs/evidenze/seo-audit-2026-11-16.json', 'utf8'));
const gone = new Set(routes.gone);
const results = [];
const failed = [];
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([a-zA-Z:-]+)=["']([^"']*)["']/g)].map((m) => [m[1].toLowerCase(), m[2]]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => attributes(m[0]));
const canonical = (html) => tags(html, 'link').find((tag) => tag.rel === 'canonical')?.href;
const noindex = (response, html) => /noindex/i.test(response.headers.get('x-robots-tag') || '') || tags(html, 'meta').some((tag) => ['robots', 'googlebot'].includes(tag.name?.toLowerCase()) && /noindex/i.test(tag.content || ''));
async function follow(path) {
  const chain = []; let url = new URL(path, origin);
  for (let hop = 0; hop < 5; hop++) {
    assert.equal(url.origin, origin, `Redirect esterno: ${url}`);
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
    chain.push({ path: url.pathname + url.search, status: response.status, location: response.headers.get('location') });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, html: await response.text(), chain, final: url };
    assert.equal(response.status, 301, `Redirect non 301: ${url}`);
    url = new URL(response.headers.get('location'), url);
  }
  throw Error(`Catena troppo lunga: ${path}`);
}
async function check(path) {
  try {
    const { response, html, chain, final } = await follow(path);
    const expected = gone.has(path) ? 410 : 200;
    assert.equal(response.status, expected, `${path}: stato finale`);
    assert.ok(chain.length <= 2, `${path}: più di un redirect`);
    if (expected === 200 && response.headers.get('content-type')?.includes('text/html')) {
      assert.ok(canonical(html), `${path}: canonical assente`);
      assert.equal(new URL(canonical(html)).pathname, final.pathname, `${path}: canonical non coincidente`);
      assert.equal(noindex(response, html), preview, `${path}: indicizzabilità`);
      assert.equal((html.match(/<h1\b/g) || []).length, 1, `${path}: numero H1`);
      if (launch) assert.equal(new URL(canonical(html)).origin, 'https://it.freetourpraga.com');
    }
    results.push({ path, final: final.pathname, status: response.status, chain });
  } catch (error) { failed.push({ path, error: error.message }); }
}
const paths = [...new Set([...evidence.legacy_checks.map((item) => item.old_path), ...Object.keys(routes.redirects)])];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < paths.length) await check(paths[next++]); }));
const robots = await (await fetch(origin + '/robots.txt')).text();
if (preview) assert.match(robots, /Disallow: \/\s*$/m);
else { assert.doesNotMatch(robots, /^Disallow: \/\s*$/m); assert.match(robots, /Allow: \/api\/media\//); }
const sitemapResponse = await fetch(origin + '/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (launch) for (const url of urls) assert.equal(new URL(url).origin, 'https://it.freetourpraga.com');
if (!preview) assert.ok(urls.length > 60, 'Sitemap incompleta');
if (!preview) assert.ok(urls.some((url) => new URL(url).pathname === '/'), 'Homepage assente dalla sitemap');
assert.equal(new Set(urls).size, urls.length, 'Sitemap duplicata');
if (!preview) {
  const sitemapPaths = urls.map((url) => new URL(url).pathname).filter((path) => !paths.includes(path));
  let item = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while(item < sitemapPaths.length) await check(sitemapPaths[item++]); }));
}
await check('/castello-di-praga/?utm_source=seo-check&affiliates=5');
const preserved = results.find((item) => item.path.startsWith('/castello-di-praga/?'));
if (preserved) assert.ok(preserved.chain.at(-1).path.includes('utm_source=seo-check&affiliates=5'));
const index = await fetch(origin + '/sitemap_index.xml', { redirect: 'manual' });
assert.equal(index.status, 200);
assert.equal((await fetch(origin + '/pagina-inesistente-test-seo', { redirect: 'manual' })).status, 404);
const report = { origin, launch, preview, checked: results.length + failed.length, passed: results.length, failed, sitemapUrls: urls.length, results };
await mkdir('tmp/seo-qa', { recursive: true });
await writeFile('tmp/seo-qa/http-results.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checked: report.checked, passed: report.passed, failed, sitemapUrls: urls.length }));
if (failed.length) process.exitCode = 1;
