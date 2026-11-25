import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const base = process.env.TEST_URL || "http://localhost:3101";
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):3101$/);
const browser = await chromium.launch(),
  context = await browser.newContext({
    viewport: { width: 1500, height: 1050 },
  });
await context.addInitScript(() =>
  localStorage.setItem("ftp-consent", "essential"),
);
context.setDefaultTimeout(18000);
const page = await context.newPage(),
  errors = [],
  checks = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("VISUAL ERROR", page.url(), e.stack);
});
const pass = (s) => {
  checks.push(s);
  console.log("PASS VISUAL " + s);
};
async function call(
  path,
  body,
  method = body ? "POST" : "GET",
  status = 200,
  ctx = context,
) {
  const r = await ctx.request.fetch(`${base}/api/platform/${path}`, {
    method,
    data: body,
    headers: { Origin: base, "Idempotency-Key": randomUUID() },
  });
  const text = await r.text();
  assert.equal(r.status(), status, `${path}: ${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : null;
}
const binding = (scope, path, key) => ({
  scope,
  ...(key ? { key } : {}),
  path: path.split("."),
});
let frame;
const target = (b) =>
  frame.locator(`[data-cms='${JSON.stringify(b)}']`).first();
async function change(b, value) {
  await target(b).evaluate((el) => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement)
      if (parent instanceof HTMLDetailsElement) parent.open = true;
  });
  await target(b).dblclick();
  const dialog = page.getByRole("dialog");
  const editable = await target(b).getAttribute("data-cms-kind") === "html"
    ? dialog.getByRole("textbox", { name: "Testo formattato", exact: true })
    : dialog.getByLabel("Testo da modificare", { exact: true });
  await editable.fill(value);
  await page
    .getByRole("button", { name: "Applica alla bozza", exact: true })
    .click();
}
async function publish() {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/admin/visual-content") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: /^Salva \(\d+\)$/ }).click(),
  ]);
  assert.equal(response.status(), 200, await response.text());
  await expect(
    page.getByText("Modifiche salvate nella pagina pubblica.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Pagina da modificare", { exact: true }),
  ).toBeEnabled();
}
async function choose(path) {
  await page
    .getByLabel("Pagina da modificare", { exact: true })
    .selectOption(path);
  frame = page.frameLocator('iframe[title^="Pagina pubblica modificabile:"]');
  await frame.locator("h1").waitFor();
  await expect(
    page.getByLabel("Pagina da modificare", { exact: true }),
  ).toBeEnabled();
}
try {
  await mkdir("tmp/visual-cms-qa", { recursive: true });
  await call("login", {
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  });
  let state = await call("admin/state"),
    beforeTours = structuredClone(state.tours);
  // Seed existing sections, as if imported from the old site; the editor never creates or reorders them.
  const content = structuredClone(state.siteContent);
  content.home.contentBlocks = [
    {
      type: "text",
      heading: "Sezione fissa QA",
      text: "Testo esistente da modificare",
    },
  ];
  const article =
    content.gallery.find((a) => a.canonicalPath) || content.gallery[0];
  article.blocks = [
    {
      type: "text",
      heading: "Testo storico",
      text: "Testo originale formattato",
      html: '<p>Testo originale <strong>formattato</strong>.</p><figure><img src="/images/prague-currency.webp" alt="Foto storica" /><figcaption>Foto importata</figcaption></figure>',
    },
  ];
  await call("admin/site-content", content, "PUT");
  state = await call("admin/state");
  const originalTitle = state.siteContent.home.heroTitle;
  await call(
    "admin/partner",
    {
      id: "qa-visual-partner",
      name: "Partner visuale",
      description: "Descrizione modificabile",
      imageUrl: "/images/prague-currency.webp",
      email: "partner@example.com",
      phone: "+393331234567",
      website: "https://example.com/",
      published: true,
    },
    "PUT",
  );
  await page.goto(base + "/admin/contenuti/homepage");
  frame = page.frameLocator('iframe[title^="Pagina pubblica modificabile:"]');
  await target(binding("site", "home.heroTitle")).waitFor();
  await expect(
    page.getByLabel("Pagina da modificare", { exact: true }),
  ).toBeEnabled();
  assert.equal(
    await page
      .getByRole("button", { name: /Aggiungi|Sposta (su|giù)|Rimuovi blocco/ })
      .count(),
    0,
  );
  await expect
    .poll(() =>
      page.locator("iframe").evaluate((el) => el.contentWindow.innerWidth),
    )
    .toBe(1440);
  await expect(target(binding("site", "home.heroImageMobile"))).toBeHidden();
  await expect(target(binding("site", "home.heroImage"))).toBeVisible();
  assert.equal(
    await frame.locator("[data-cms-navigation] [data-cms]").count(),
    0,
  );
  assert.equal(
    await frame.locator('[data-cms-reference="article"] [data-cms]').count(),
    0,
  );
  await frame
    .locator('[data-cms-navigation] a[href^="/contatti"]')
    .first()
    .click();
  await expect(
    page.getByLabel("Pagina da modificare", { exact: true }),
  ).toHaveValue("/contatti");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await choose("/");
  const articleCard = frame.locator('[data-cms-reference="article"]').first();
  const linkedArticle = await articleCard.getAttribute("href");
  await articleCard.click();
  await expect(
    page.getByLabel("Pagina da modificare", { exact: true }),
  ).toHaveValue(linkedArticle);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await choose("/");
  pass(
    "Desktop reale a 1440 px; header solo navigabile; richiami blog non editabili e collegati all’articolo",
  );
  await change(
    binding("site", "home.heroTitle"),
    "QA homepage\nseconda riga\nterza riga",
  );
  await expect(target(binding("site", "home.heroTitle"))).toHaveText(
    "QA homepage\nseconda riga\nterza riga",
  );
  assert.equal(
    (await call("admin/state")).siteContent.home.heroTitle,
    originalTitle,
    "draft must not publish automatically",
  );
  await target(binding("site", "home.heroImage")).dblclick({
    force: true,
    position: { x: 30, y: 30 },
  });
  await page
    .getByRole("dialog")
    .getByLabel("URL Foto", { exact: true })
    .fill("/images/prague-currency.webp");
  await page
    .getByRole("button", { name: "Applica alla bozza", exact: true })
    .click();
  await change(
    binding("site", "home.contentBlocks.0.html"),
    "Contenuto cambiato nella sezione fissa",
  );
  await publish();
  state = await call("admin/state");
  assert.equal(
    state.siteContent.home.heroTitle,
    "QA homepage\nseconda riga\nterza riga",
  );
  assert.equal(
    state.siteContent.home.heroImage,
    "/images/prague-currency.webp",
    JSON.stringify({
      desktop: state.siteContent.home.heroImage,
      mobile: state.siteContent.home.heroImageMobile,
    }),
  );
  assert.equal(state.siteContent.home.contentBlocks.length, 1);
  await expect(target(binding("site", "home.heroTitle"))).toHaveCSS(
    "white-space",
    "pre-wrap",
  );
  assert.equal(
    await target(binding("site", "home.heroTitle")).textContent(),
    "QA homepage\nseconda riga\nterza riga",
  );
  const publicPage = await context.newPage();
  await publicPage.goto(base + "/");
  const publicTitle = publicPage.locator("h1");
  assert.equal(
    await publicTitle.textContent(),
    "QA homepage\nseconda riga\nterza riga",
  );
  await expect(publicTitle).toHaveCSS("white-space", "pre-wrap");
  const lines = await publicTitle.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return new Set(
      Array.from(range.getClientRects())
        .filter((r) => r.width > 1)
        .map((r) => Math.round(r.top)),
    ).size;
  });
  assert.equal(
    lines,
    3,
    "published heading must display all three manual lines",
  );
  await publicPage.close();
  pass(
    "A capo su tre righe conservati nella bozza, nel database e nella pagina pubblica",
  );

  pass(
    "Replica pubblica in iframe: doppio clic titolo/foto/sezione esistente, bozza separata dalla pubblicazione e struttura fissa",
  );
  for (const [key, path] of [
    ["chi-siamo", "/chi-siamo"],
    ["contatti", "/contatti"],
    ["informazioni-utili", "/informazioni-utili"],
    ["social", "/social"],
    ["agenzie-b2b", "/agenzie-b2b"],
    ["diventa-un-partner", "/diventa-un-partner"],
    ["lavora-con-noi", "/lavora-con-noi"],
    ["partner-europa", "/partner-europa"],
    ["aiuto", "/aiuto"],
    ["privacy", "/privacy"],
    ["termini", "/termini"],
    ["catalogo", "/tour"],
  ]) {
    await choose(path);
    await change(
      binding("page", "title", key),
      `QA visuale ${key}\nSeconda riga\n\nQuarta riga`,
    );
    await publish();
    await expect(frame.locator("h1")).toContainText(`QA visuale ${key}`);
    assert.equal(
      await target(binding("page", "title", key)).textContent(),
      `QA visuale ${key}\nSeconda riga\n\nQuarta riga`,
    );
    await expect(target(binding("page", "title", key))).toHaveCSS(
      "white-space",
      "pre-wrap",
    );
  }
  pass(
    "Titoli modificati sulle dodici pagine pubbliche usando il layout reale; salvataggio conserva i contenuti fallback delle pagine inizialmente in bozza",
  );
  await choose("/tour");
  await change(
    binding("site", "home.specialOffersTitle"),
    "Offerte QA\nservizio clienti",
  );
  await change(
    binding("site", "home.specialOffersNote"),
    "Prima condizione\nSeconda condizione\nTerza condizione",
  );
  await change(binding("site", "home.specialOffers.0.label"), "Coppia tour QA");
  await change(
    binding("site", "home.specialOffersCtaLabel"),
    "Chiedi le offerte QA",
  );
  await target(binding("site", "home.specialOffers.0.priceCents")).dblclick();
  await page
    .getByRole("dialog")
    .getByLabel("Prezzo offerta", { exact: true })
    .fill("712.34");
  await page
    .getByRole("button", { name: "Applica alla bozza", exact: true })
    .click();
  await expect(
    target(binding("site", "home.specialOffers.0.priceCents")),
  ).toContainText("712,34");
  await publish();
  state = await call("admin/state");
  assert.equal(state.siteContent.home.specialOffers[0].priceCents, 71234);
  assert.equal(
    state.siteContent.home.specialOffersNote,
    "Prima condizione\nSeconda condizione\nTerza condizione",
  );
  await expect(target(binding("site", "home.specialOffersNote"))).toHaveCSS(
    "white-space",
    "pre-wrap",
  );
  pass(
    "Offerte: titolo, condizioni multilinea, nomi, prezzi numerici e pulsante modificabili dal Catalogo tour",
  );
  await choose("/partner-europa");
  await change(
    binding("partner", "name", "qa-visual-partner"),
    "Partner modificato con doppio clic",
  );
  await publish();
  state = await call("admin/state");
  assert.equal(
    state.partners.find((p) => p.id === "qa-visual-partner").name,
    "Partner modificato con doppio clic",
  );
  pass(
    "Schede partner modificabili sulla pagina pubblica senza attivare click o cambiare statistiche",
  );
  await choose("/blog");
  await change(binding("site", "home.galleryTitle"), "QA blog visuale");
  await publish();
  await choose("/faq");
  await change(
    binding("site", "faqs.0.answerHtml"),
    "Risposta modificata direttamente sulla FAQ",
  );
  await publish();
  const articleKey = article.id;
  const articlePath = article.canonicalPath || `/blog/${article.slug}`;
  await choose(articlePath);
  await change(binding("article", "title", articleKey), "QA articolo visuale");
  await publish();
  await target(binding("article", "imageUrl", articleKey)).dblclick();
  await page
    .getByRole("dialog")
    .getByLabel("URL Foto", { exact: true })
    .fill("/images/hero-prague-dusk.png");
  await page
    .getByRole("dialog")
    .getByLabel("Testo alternativo", { exact: true })
    .fill("Copertina modificata");
  await page
    .getByRole("button", { name: "Applica alla bozza", exact: true })
    .click();
  await publish();
  const rich = target(binding("article", "blocks.0.html", articleKey));
  await rich.locator("p").first().dblclick();
  const richInput = page.getByRole("textbox", {
    name: "Testo formattato",
    exact: true,
  });
  await richInput.evaluate((el) => {
    el.querySelector("p").firstChild.textContent = "Testo aggiornato ";
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  await page
    .getByRole("button", { name: "Applica alla bozza", exact: true })
    .click();
  await publish();
  await frame.locator('[data-cms-rich-image="0"]').first().dblclick();
  await page
    .getByRole("dialog")
    .getByLabel("URL Foto", { exact: true })
    .fill("/images/hero-prague-dusk.png");
  await page
    .getByRole("dialog")
    .getByLabel("Testo alternativo", { exact: true })
    .fill("Immagine nel testo storico");
  await page
    .getByRole("button", { name: "Applica alla bozza", exact: true })
    .click();
  await publish();
  state = await call("admin/state");
  const edited = state.siteContent.gallery.find((a) => a.id === articleKey);
  assert.equal(edited.title, "QA articolo visuale");
  assert.equal(edited.canonicalPath, article.canonicalPath);
  assert.equal(edited.imageAlt, "Copertina modificata");
  assert.match(edited.blocks[0].html, /<strong>formattato<\/strong>/);
  assert.match(edited.blocks[0].html, /Immagine nel testo storico/);
  assert.match(edited.blocks[0].html, /hero-prague-dusk.png/);
  pass(
    "Blog e articoli: titolo, copertina, alt, testo ricco e foto interne all’HTML storico; formattazione, identità e URL conservati",
  );
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await expect
    .poll(() =>
      page.locator("iframe").evaluate((el) => el.contentWindow.innerWidth),
    )
    .toBe(390);
  await page.screenshot({
    path: "tmp/visual-cms-qa/article-mobile-editor.png",
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
  await page.getByRole("button", { name: "Desktop", exact: true }).click();
  const historical = Object.entries(state.pages).find(
    ([key, p]) =>
      key.startsWith("legacy:") &&
      p.published &&
      p.canonicalPath &&
      !state.siteContent.gallery.some(
        (a) => a.canonicalPath === p.canonicalPath,
      ) &&
      !state.tours.some((t) => t.canonicalPath === p.canonicalPath),
  );
  assert.ok(historical);
  await choose(historical[1].canonicalPath);
  await change(
    binding("page", "title", historical[0]),
    "QA pagina storica visuale",
  );
  await publish();
  await expect(frame.locator("h1")).toHaveText("QA pagina storica visuale");
  await choose("/");
  await page.screenshot({
    path: "tmp/visual-cms-qa/home-editor-desktop.png",
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
  state = await call("admin/state");
  assert.deepEqual(
    state.tours,
    beforeTours,
    "visual editing must not alter any tour or its inventory",
  );
  const hero = binding("site", "home.heroTitle");
  await change(hero, "Bozza da conservare in conflitto");
  const changed = structuredClone(state.siteContent);
  changed.home.heroTitle = "Modifica di un’altra sessione";
  await call("admin/site-content", changed, "PUT");
  const [conflict] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/admin/visual-content") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: /^Salva \(\d+\)$/ }).click(),
  ]);
  assert.equal(conflict.status(), 409);
  await expect(target(hero)).toHaveText("Bozza da conservare in conflitto");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Tour e orari", exact: true }).click();
  await expect(target(hero)).toHaveText("Bozza da conservare in conflitto");
  assert.ok(page.url().includes("/admin/contenuti/"));
  pass(
    "Conflitti concorrenti: salvataggio rifiutato senza perdere la bozza; nessuna modifica ai tour",
  );
  const anonymous = await browser.newContext();
  await call(
    "admin/visual-content",
    { patches: [{ binding: hero, expected: "x", value: "y" }] },
    "POST",
    401,
    anonymous,
  );
  await call(
    "login",
    { email: "operator@freetourpraga.local", password: "PragaLocale!2026" },
    "POST",
    200,
    anonymous,
  );
  await call(
    "admin/visual-content",
    { patches: [{ binding: hero, expected: "x", value: "y" }] },
    "POST",
    403,
    anonymous,
  );
  await anonymous.close();
  pass("Permessi: pubblicazione visuale riservata agli amministratori");
  assert.deepEqual(errors, []);
  await writeFile(
    "tmp/visual-cms-qa/results.json",
    JSON.stringify(
      { checks, errors, toursUnchanged: true, sectionStructureEnabled: false },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
