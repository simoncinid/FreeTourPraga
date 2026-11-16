import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import data from '../src/content/seo-import.json';
import snapshot from '../src/content/wordpress.json';
import routes from '../src/content/wordpress-routes.json';
import { tourSchema, pageSchema } from '../src/lib/platform/validation';
import { blogArticleSchema, siteContentSchema } from '../src/lib/platform/content-validation';
import { prepareArticles } from '../src/lib/article-urls';
import { sanitizeRichText } from '../src/lib/rich-text';
import { guidePath } from '../src/lib/public-paths';
import { defaultSiteContent, siteContent } from '../src/lib/platform/content';

test('WordPress records fit native editable tour, article and page models', () => {
  assert.equal(data.tours.length, 10);
  assert.equal(data.articles.length, 24);
  for (const tour of data.tours) {
    assert.equal(tourSchema.parse(tour).slots.length, 0, 'Do not invent capacity or departures');
    assert.ok(tour.canonicalPath.startsWith('/'));
  }
  for (const item of [...data.tours, ...data.articles]) assert.ok(existsSync(resolve('public', decodeURIComponent(item.imageUrl).replace(/^\//, ''))), `Missing cover: ${item.title}`);
  for (const article of data.articles) blogArticleSchema.parse(article);
  for (const page of Object.values(data.pages)) pageSchema.parse(page);
  siteContentSchema.parse({ ...defaultSiteContent(), gallery: [...defaultSiteContent().gallery, ...data.articles] });
});

test('all copied media exist and preserve their bytes, including downloadable PDF files', () => {
  const assets = snapshot.assets.filter((asset) => 'path' in asset);
  assert.ok(assets.length > 150);
  assert.ok(assets.some((asset) => asset.path?.endsWith('.pdf')));
  for (const asset of assets) {
    if (!('path' in asset)) continue;
    const file = resolve('public', decodeURIComponent(asset.path!).replace(/^\//, '')).normalize();
    assert.ok(existsSync(file), asset.path);
    assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), asset.sha256);
  }
});

test('published article titles can change and reorder without changing URLs', () => {
  const old = siteContent(defaultSiteContent()).gallery;
  const renamed = prepareArticles(old, [...old].reverse().map((article) => ({ ...article, title: article.title + ' aggiornato' })));
  for (const article of old) assert.equal(guidePath(renamed.find((item) => item.id === article.id)!), guidePath(article));
  const historic = blogArticleSchema.parse(data.articles[0]);
  assert.throws(() => prepareArticles([historic], [{ ...historic, canonicalPath: '/altro/' }]), /indirizzo storico/);
  assert.throws(() => prepareArticles([], [{ ...historic }, { ...historic, id: 'other' }]), /già in uso/);
});

test('rich content preserves internal links and removes executable markup and WordPress layout styling', () => {
  const html = sanitizeRichText('<p class="old-theme" style="position:fixed">Test <a href="/tour/castello/">Castello</a><script>alert(1)</script><img src="/wp-content/uploads/photo.jpg" onerror="alert(1)"><iframe src="https://evil.example"></iframe><a href="javascript:alert(1)">Bad</a></p>');
  assert.match(html, /href="\/tour\/castello\/"/);
  assert.doesNotMatch(html, /old-theme|position:fixed|script|onerror|iframe|javascript:/);
});

test('historical redirect map is flattened and excludes removed attachment pages from active content', () => {
  const redirects = routes.redirects as Record<string, string>;
  for (const [source, target] of Object.entries(redirects)) {
    assert.notEqual(source, target);
    assert.ok(target.startsWith('/') && !target.startsWith('//'));
    assert.ok(!(target in redirects), `${source} still has a redirect chain`);
  }
  assert.equal(routes.gone.length, 76);
  assert.equal(redirects['/castello-di-praga/'], '/tour/castello/');
});

test('preview blocks crawling while the technical production host redirects in one 301 with query intact', async () => {
  const { default: robots } = await import('../src/app/robots');
  const { proxy } = await import('../src/proxy');
  const { NextRequest } = await import('next/server');
  const beforePreview = process.env.SITE_PREVIEW;
  const beforeOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://it.freetourpraga.com';
    process.env.SITE_PREVIEW = 'true';
    assert.deepEqual(robots().rules, { userAgent: '*', disallow: '/' });
    const preview = proxy(new NextRequest('https://preview.up.railway.app/dove-mangiare-a-praga/', { headers: { host: 'preview.up.railway.app' } }));
    assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(preview.headers.get('location'), null);
    process.env.SITE_PREVIEW = 'false';
    const result = proxy(new NextRequest('https://preview.up.railway.app/castello-di-praga/?utm_source=qa&affiliates=5', { headers: { host: 'preview.up.railway.app' } }));
    assert.equal(result.status, 301);
    assert.equal(result.headers.get('location'), 'https://it.freetourpraga.com/tour/castello/?utm_source=qa&affiliates=5');
  } finally {
    if (beforePreview === undefined) delete process.env.SITE_PREVIEW; else process.env.SITE_PREVIEW = beforePreview;
    if (beforeOrigin === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = beforeOrigin;
  }
});
