import { test } from "node:test";
import assert from "node:assert/strict";
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
