import { test } from "node:test";
import assert from "node:assert/strict";
import { contentFields, pageLabels } from "../src/lib/content-sections";
import { defaultSiteContent, siteContent } from "../src/lib/platform/content";
import { siteContentSchema } from "../src/lib/platform/content-validation";

const page = (
  title: string,
  subtitle: string,
  body: string,
  published = true,
) => ({
  title,
  subtitle,
  body,
  published,
  seoTitle: "SEO",
  seoDescription: "Descrizione SEO",
});

test("every structured content field has exactly one editor owner", () => {
  const seen = new Set<string>();
  for (const groups of Object.values(contentFields)) {
    for (const [group, keys] of Object.entries(groups)) {
      for (const key of keys) {
        const path = `${group}.${key}`;
        assert.equal(seen.has(path), false, `Duplicate editor for ${path}`);
        seen.add(path);
      }
    }
  }
  const content = defaultSiteContent();
  for (const group of ["home", "globals"] as const) {
    for (const [key, value] of Object.entries(content[group])) {
      if (typeof value === "string" && key !== "secondaryLabel")
        assert.ok(
          seen.has(`${group}.${key}`),
          `${group}.${key} needs an owner`,
        );
    }
  }
  for (const key of [
    "homepage",
    "blog",
    "faq",
    "informazioni-utili",
    "tour-privati",
  ])
    assert.equal(key in pageLabels, false);
});

test("published legacy page overrides migrate to their canonical structured fields without losing SEO or source pages", () => {
  const base = { ...defaultSiteContent(), contentVersion: undefined };
  const pages = {
    homepage: page("Home personalizzata", "Sopratitolo home", "Testo home"),
    blog: page("Blog personalizzato", "Sopratitolo blog", "Testo blog"),
    faq: page("FAQ personalizzate", "Sopratitolo FAQ", "Introduzione FAQ"),
  };
  const before = structuredClone(pages);
  const migrated = siteContent(base, pages);
  assert.equal(migrated.home.heroTitle, pages.homepage.title);
  assert.equal(migrated.home.heroBody, pages.homepage.body);
  assert.equal(migrated.home.galleryTitle, pages.blog.title);
  assert.equal(migrated.home.galleryBody, pages.blog.body);
  assert.equal(migrated.home.faqTitle, pages.faq.title);
  assert.equal(migrated.home.faqBody, pages.faq.body);
  assert.deepEqual(pages, before);
  assert.deepEqual(migrated.gallery, siteContent(base).gallery);
  assert.equal(migrated.contentVersion, 2);
  const saved = siteContentSchema.parse({
    ...migrated,
    home: { ...migrated.home, heroTitle: "Nuovo titolo canonico" },
  });
  assert.equal(
    siteContent(saved, pages).home.heroTitle,
    "Nuovo titolo canonico",
  );
});

test("draft overrides remain drafts and blank legacy fields cannot erase structured content", () => {
  const base = { ...defaultSiteContent(), contentVersion: undefined };
  const normalized = siteContent(base, {
    homepage: page("Bozza", "Bozza", "Bozza", false),
    blog: page("Blog pubblicato", "", ""),
  });
  assert.equal(normalized.home.heroTitle, base.home.heroTitle);
  assert.equal(normalized.home.galleryTitle, "Blog pubblicato");
  assert.equal(normalized.home.galleryBody, base.home.galleryBody);
});
