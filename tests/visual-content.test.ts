import { test } from "node:test";
import assert from "node:assert/strict";
import { tourSchema } from "../src/lib/platform/validation";
import { initialState } from "../src/lib/platform/store";
import {
  applyVisualPatches,
  visualPatchSchema,
} from "../src/lib/platform/visual-content";
import { siteContent } from "../src/lib/platform/content";
import { CONTENT_SECTION_STRUCTURE_ENABLED } from "../src/lib/content-policy";
import { sanitizeRichText } from "../src/lib/rich-text";
test("visual patches update only selected fields and preserve operational inventory", () => {
  const s = initialState(),
    before = structuredClone(s.tours),
    title = s.siteContent!.home.heroTitle;
  applyVisualPatches(s, {
    patches: [
      {
        binding: { scope: "site", path: ["home", "heroTitle"] },
        expected: title,
        value: "Titolo modificato",
      },
    ],
  });
  assert.equal(s.siteContent!.home.heroTitle, "Titolo modificato");
  assert.deepEqual(s.tours, before);
});
test("visual conflicts reject the entire draft without partial saves", () => {
  const s = initialState(),
    before = structuredClone(s);
  assert.throws(
    () =>
      applyVisualPatches(s, {
        patches: [
          {
            binding: { scope: "site", path: ["home", "heroTitle"] },
            expected: s.siteContent!.home.heroTitle,
            value: "Prima",
          },
          {
            binding: { scope: "site", path: ["home", "heroBody"] },
            expected: "Valore vecchio",
            value: "Seconda",
          },
        ],
      }),
    /altra sessione|un’altra sessione/,
  );
  assert.deepEqual(s, before);
});
test("fixed sections reject append, remove, reorder and type changes", () => {
  assert.equal(CONTENT_SECTION_STRUCTURE_ENABLED, false);
  const s = initialState();
  s.siteContent!.home.contentBlocks = [
    { type: "text", heading: "Esistente", text: "Testo" },
  ];
  for (const [path, value] of [
    [["home", "contentBlocks"], []],
    [["home", "contentBlocks", "1", "heading"], "Nuovo"],
    [["home", "contentBlocks", "0", "type"], "image"],
  ] as [string[], unknown][]) {
    assert.throws(
      () =>
        applyVisualPatches(s, {
          patches: [
            { binding: { scope: "site", path }, expected: undefined, value },
          ],
        }),
      /struttura/,
    );
  }
  applyVisualPatches(s, {
    patches: [
      {
        binding: {
          scope: "site",
          path: ["home", "contentBlocks", "0", "text"],
        },
        expected: "Testo",
        value: "Testo nuovo",
      },
    ],
  });
  assert.equal(s.siteContent!.home.contentBlocks![0].type, "text");
});
test("visual paths cannot alter tour data, identifiers or prototypes", () => {
  const s = initialState();
  for (const path of [
    ["__proto__", "evil"],
    ["home", "constructor", "evil"],
  ])
    assert.equal(
      visualPatchSchema.safeParse({
        patches: [{ binding: { scope: "site", path }, value: true }],
      }).success,
      false,
    );
  assert.throws(
    () =>
      applyVisualPatches(s, {
        patches: [
          {
            binding: {
              scope: "page",
              key: "chi-siamo",
              path: ["canonicalPath"],
            },
            value: "/nuovo",
          },
        ],
      }),
    /non modificabile/,
  );
  assert.throws(
    () =>
      applyVisualPatches(s, {
        patches: [{ binding: { scope: "site", path: ["tours"] }, value: [] }],
      }),
    /non modificabile/,
  );
});
test("article visual edits retain canonical URLs and rich formatting; images accept controlled uploads", () => {
  const s = initialState();
  s.siteContent = siteContent(s.siteContent, s.pages);
  const a = s.siteContent.gallery[0];
  a.canonicalPath = "/articolo-storico/";
  a.blocks = [
    {
      type: "text",
      heading: "",
      text: "Testo",
      html: "<p>Testo <strong>formattato</strong></p>",
    },
  ];
  const before = a.canonicalPath;
  applyVisualPatches(s, {
    patches: [
      {
        binding: { scope: "article", key: a.id, path: ["blocks", "0", "html"] },
        expected: a.blocks[0].type === "text" ? a.blocks[0].html : undefined,
        value:
          '<p>Nuovo <strong>formattato</strong></p><img src="/api/media/00000000-0000-0000-0000-000000000001.webp" alt="Foto" onerror="alert(1)" />',
      },
    ],
  });
  const next = s.siteContent!.gallery[0];
  assert.equal(next.canonicalPath, before);
  assert.match(
    next.blocks![0].type === "text" ? next.blocks![0].html! : "",
    /<strong>formattato<\/strong>/,
  );
  assert.match(JSON.stringify(next), /api\/media/);
  assert.doesNotMatch(JSON.stringify(next), /onerror/);
  assert.equal(sanitizeRichText('<img src="javascript:alert(1)"/>'), "");
});

test("visual content preserves manual newlines and numeric offer prices", () => {
  const s = initialState();
  s.siteContent!.home.specialOffers = [
    { label: "Due tour", priceCents: 70000 },
  ];
  applyVisualPatches(s, {
    patches: [
      {
        binding: { scope: "site", path: ["home", "heroTitle"] },
        expected: s.siteContent!.home.heroTitle,
        value: "TOUR GUIDATI\nIN ITALIANO\nA PRAGA",
      },
      {
        binding: {
          scope: "site",
          path: ["home", "specialOffers", "0", "priceCents"],
        },
        expected: 70000,
        value: 71234,
      },
      {
        binding: { scope: "site", path: ["home", "specialOffersTitle"] },
        expected: s.siteContent!.home.specialOffersTitle,
        value: "Offerte\nservizio clienti",
      },
    ],
  });
  assert.equal(
    s.siteContent!.home.heroTitle,
    "TOUR GUIDATI\nIN ITALIANO\nA PRAGA",
  );
  assert.equal(s.siteContent!.home.specialOffers![0].priceCents, 71234);
  assert.equal(
    s.siteContent!.home.specialOffersTitle,
    "Offerte\nservizio clienti",
  );
});

test("editorial formatting survives publication independently of plain titles", () => {
  const state = initialState();
  const site = siteContent(state.siteContent, state.pages);
  state.siteContent = site;
  const article = site.gallery[0];
  const page = state.pages["chi-siamo"];
  const initialTitle = site.home.heroTitle;
  const styledTitle = '<span style="font-family:Georgia;color:#334455">T</span>OUR GUIDATI';
  const styledBody = '<h2 style="text-align:center">Titolo</h2><ol><li>Voce</li></ol>';
  applyVisualPatches(state, {
    patches: [
      { binding: { scope: "site", path: ["formattedText", "home-heroTitle"] }, value: styledTitle },
      { binding: { scope: "site", path: ["home", "heroTitle"] }, expected: initialTitle, value: "TOUR GUIDATI" },
      { binding: { scope: "article", key: article.id, path: ["titleHtml"] }, value: styledTitle },
      { binding: { scope: "page", key: "chi-siamo", path: ["titleHtml"] }, value: styledTitle },
      { binding: { scope: "page", key: "chi-siamo", path: ["bodyHtml"] }, expected: page.bodyHtml, value: styledBody },
    ],
  });
  assert.equal(state.siteContent!.home.heroTitle, "TOUR GUIDATI");
  assert.equal(state.siteContent!.formattedText?.["home-heroTitle"], styledTitle);
  assert.equal(state.siteContent!.gallery[0].titleHtml, styledTitle);
  assert.equal(state.pages["chi-siamo"].titleHtml, styledTitle);
  assert.equal(state.pages["chi-siamo"].bodyHtml, styledBody);
});

test("style on previously plain labels persists alongside the operational text", () => {
  const state = initialState();
  state.siteContent = siteContent(state.siteContent, state.pages);
  const article = state.siteContent.gallery[0];
  const styled = '<span style="color:#1847bc">Selezione</span>';
  const partner = {
    id: "formatting-partner", name: "Partner", description: "Descrizione",
    imageUrl: "", email: "partner@example.com", phone: "", website: "https://example.com",
    published: true,
  };
  state.partners = [partner];
  applyVisualPatches(state, {
    patches: [
      { binding: { scope: "site", path: ["formattedText", "home-primaryLabel"] }, value: styled },
      { binding: { scope: "article", key: article.id, path: ["formattedText", "kicker"] }, value: styled },
      { binding: { scope: "partner", key: partner.id, path: ["formattedText", "email"] }, value: styled },
    ],
  });
  assert.equal(state.siteContent.formattedText?.["home-primaryLabel"], styled);
  assert.equal(state.siteContent.gallery[0].formattedText?.kicker, styled);
  assert.equal(state.partners[0].formattedText?.email, styled);
  assert.equal(state.partners[0].email, partner.email);

  const tour = tourSchema.parse({
    ...state.tours[0],
    detailCopy: { headingEscluso: "Non incluso" },
    hiddenText: ["detailCopy.headingEscluso"],
    formattedCopy: { labels: { "detailCopy-headingEscluso": styled } },
  });
  assert.equal(tour.detailCopy?.headingEscluso, "Non incluso");
  assert.deepEqual(tour.hiddenText, ["detailCopy.headingEscluso"]);
  assert.equal(tour.formattedCopy?.labels?.["detailCopy-headingEscluso"], styled);
});
