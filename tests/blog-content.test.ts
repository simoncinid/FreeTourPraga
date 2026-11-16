import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultSiteContent,
  siteContent,
  type SiteContent,
} from "../src/lib/platform/content";
import {
  blogArticleSchema,
  siteContentSchema,
} from "../src/lib/platform/content-validation";
import { findGuide, guideCta } from "../src/lib/guides";

const article = () => ({ ...defaultSiteContent().gallery[0] });

test("new and legacy blog articles never receive an automatic CTA", () => {
  const base = defaultSiteContent();
  assert.ok(base.gallery.every((item) => guideCta(item) === null));
  const { ctaEnabled: omitted, ...legacy } = {
    ...article(),
    ctaLabel: "Scopri il tour",
    ctaHref: "/tour",
  };
  assert.equal(omitted, false);
  const normalized = siteContent({ ...base, gallery: [legacy] });
  assert.equal(normalized.gallery[0].ctaEnabled, false);
  assert.equal(guideCta(normalized.gallery[0]), null);
  const parsed = blogArticleSchema.parse({
    title: "Articolo",
    caption: "Sintesi",
    imageUrl: article().imageUrl,
  });
  assert.equal(parsed.ctaEnabled, false);
  assert.equal(parsed.ctaHref, "");
  assert.deepEqual(parsed.blocks, []);
});

test("CTA requires explicit activation, text and a safe admin-selected destination", () => {
  for (const href of [
    "/contatti",
    "/#informazioni-utili",
    "https://example.com/risorsa?lingua=it",
  ]) {
    const input = {
      ...article(),
      ctaEnabled: true,
      ctaLabel: " Leggi di più ",
      ctaHref: href,
    };
    const parsed = blogArticleSchema.parse(input);
    assert.deepEqual(guideCta(parsed), { label: "Leggi di più", href });
    assert.equal(guideCta({ ...parsed, ctaEnabled: false }), null);
  }
  for (const href of [
    "javascript:alert(1)",
    "//evil.example",
    "http://example.com",
    "/\\evil.example",
    "data:text/html,hello",
  ]) {
    const input = {
      ...article(),
      ctaEnabled: true,
      ctaLabel: "Apri",
      ctaHref: href,
    };
    assert.equal(blogArticleSchema.safeParse(input).success, false);
    assert.equal(guideCta(input), null);
  }
  assert.equal(
    blogArticleSchema.safeParse({ ...article(), ctaEnabled: true }).success,
    false,
  );
  assert.equal(
    blogArticleSchema.safeParse({
      ...article(),
      ctaEnabled: true,
      ctaHref: "/contatti",
      ctaLabel: "",
    }).success,
    false,
  );
});

test("CMS validation and normalization preserve ordered text, images, side placement and paragraphs", () => {
  const content = defaultSiteContent();
  const item: SiteContent["gallery"][number] = {
    ...article(),
    imageAlt: "Vista del centro",
    intro: "Introduzione scelta dall’admin.",
    blocks: [
      {
        type: "text",
        heading: "Prima sezione",
        text: "Primo paragrafo.\n\nSecondo paragrafo.",
      },
      {
        type: "image",
        imageUrl: "/api/media/12345678-abcd-abcd-abcd-123456789012.webp",
        alt: "Monete ceche",
        caption: "Didascalia scelta",
      },
      {
        type: "split",
        heading: "Foto a sinistra",
        text: "Testo affiancato.",
        imageUrl: article().imageUrl,
        alt: "Praga",
        caption: "",
        imagePosition: "left",
      },
    ],
  };
  const parsed = siteContentSchema.parse({ ...content, gallery: [item] });
  const normalized = siteContent(JSON.parse(JSON.stringify(parsed)));
  assert.deepEqual(normalized.gallery[0].blocks, item.blocks);
  assert.equal(normalized.gallery[0].intro, item.intro);
  assert.equal(normalized.gallery[0].imageAlt, item.imageAlt);
  assert.equal(
    findGuide(normalized.gallery, "citta-vecchia-e-ponte-carlo")?.title,
    item.title,
  );
  assert.deepEqual(
    siteContent({ ...content, gallery: [{ ...item, blocks: [], intro: "" }] })
      .gallery[0].blocks,
    [],
  );
});

test("blog blocks reject unsafe image sources and incomplete or oversized content", () => {
  const make = (blocks: unknown[]) => ({ ...article(), blocks });
  assert.equal(
    blogArticleSchema.safeParse(
      make([{ type: "text", heading: "Titolo", text: "" }]),
    ).success,
    false,
  );
  assert.equal(
    blogArticleSchema.safeParse(
      make([
        {
          type: "image",
          imageUrl: "https://evil.example/image.jpg",
          alt: "",
          caption: "",
        },
      ]),
    ).success,
    false,
  );
  assert.equal(
    blogArticleSchema.safeParse(
      make([
        {
          type: "image",
          imageUrl: "javascript:alert(1)",
          alt: "",
          caption: "",
        },
      ]),
    ).success,
    false,
  );
  assert.equal(
    blogArticleSchema.safeParse(
      make(Array(41).fill({ type: "text", heading: "", text: "Paragrafo" })),
    ).success,
    false,
  );
});
