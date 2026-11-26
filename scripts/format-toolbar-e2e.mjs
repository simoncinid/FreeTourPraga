import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_URL || "http://localhost:3101";
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):3101$/);
const browser = await chromium.launch();
const runId = randomUUID().slice(0, 8);
try {
  const context = await browser.newContext({
    viewport: { width: 1540, height: 1050 },
  });
  await context.addInitScript(() =>
    localStorage.setItem("ftp-consent", "essential"),
  );
  const login = await context.request.post(base + "/api/platform/login", {
    headers: { Origin: base },
    data: { email: "admin@freetourpraga.local", password: "PragaLocale!2026" },
  });
  assert.equal(login.status(), 200);
  const response = await context.request.get(
    base + "/api/platform/admin/state",
  );
  const state = await response.json();
  const tour = state.tours.find((item) => item.published) ?? state.tours[0];
  const article = state.siteContent.gallery[0];
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const toolbar = page.getByRole("toolbar", { name: "Formattazione testo" });
  const bold = toolbar.getByRole("button", { name: "Grassetto" });
  const cursive = toolbar.getByRole("button", { name: "Corsivo" });
  const font = toolbar.getByRole("combobox", { name: "Font", exact: true });
  const size = toolbar.getByRole("combobox", { name: "Dimensione testo" });
  const highlight = toolbar.getByLabel("Evidenzia", { exact: true });
  const foreground = toolbar.getByLabel("Colore testo", { exact: true });
  const modal = page
    .locator("dialog[open]")
    .filter({
      has: page.getByRole("heading", { name: /^Modifica (?:testo|contenuto)/ }),
    })
    .last();
  const editable = modal.locator("[contenteditable]");
  const apply = modal.getByRole("button", { name: "Applica alla bozza" });
  const cancel = modal.getByRole("button", { name: "Annulla" });

  async function selectWord(word) {
    await editable.evaluate((el, word) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const start = node.data.indexOf(word);
        if (start < 0) continue;
        const selection = window.getSelection();
        selection.setBaseAndExtent(node, start + word.length, node, start);
        return;
      }
      throw Error("Missing text " + word);
    }, word);
  }

  async function color(control, hex) {
    await control.focus();
    await control.fill(hex);
  }

  async function exercise(target, title, { block = false, drag = false } = {}) {
    const word = "Selezione";
    await target.dblclick();
    await expect(editable).toBeFocused();
    await editable.fill(`${word} seguito ${runId}`);
    await toolbar
      .getByRole("button", { name: "Reimposta stile selezione" })
      .click();
    await selectWord(word);
    // Act immediately after the selection changes, before waiting on toolbar state.
    await bold.click();
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await cursive.click();
    await expect(cursive).toHaveAttribute("aria-pressed", "true");
    await font.focus();
    await font.selectOption("Georgia");
    await size.selectOption("5");
    await color(highlight, "#e4b357");
    await color(foreground, "#1847bc");
    if (block) {
      await toolbar
        .getByRole("combobox", { name: "Paragrafo o titolo" })
        .selectOption("h3");
      await toolbar
        .getByRole("combobox", { name: "Allineamento" })
        .selectOption("justifyCenter");
    }
    if (drag) {
      const handle = toolbar.getByRole("button", {
        name: "Trascina barra formattazione",
      });
      const before = await handle.boundingBox();
      await page.mouse.move(before.x + 10, before.y + 10);
      await page.mouse.down();
      await page.mouse.move(before.x - 140, before.y + 70, { steps: 8 });
      await page.mouse.up();
      await expect
        .poll(async () => (await handle.boundingBox()).x)
        .toBeLessThan(before.x - 100);
    }
    await apply.click();
    await expect(modal).toHaveCount(0);
    const formatted = target.getByText(word, { exact: true }).first();
    await expect(formatted).toHaveCSS("font-family", /Georgia/);
    await expect
      .poll(() =>
        formatted.evaluate((el) => Number(getComputedStyle(el).fontWeight)),
      )
      .toBeGreaterThanOrEqual(700);
    const unselectedStyle = await target.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.data.includes("seguito")) {
          const style = getComputedStyle(node.parentElement);
          return { font: style.fontFamily, weight: style.fontWeight };
        }
      }
      throw Error("Missing unselected text");
    });
    assert.doesNotMatch(unselectedStyle.font, /Georgia/);
    await expect(formatted).toHaveCSS("color", "rgb(24, 71, 188)");
    await expect
      .poll(() =>
        formatted.evaluate((el) => {
          for (let node = el; node; node = node.parentElement) {
            const color = getComputedStyle(node).backgroundColor;
            if (color !== "rgba(0, 0, 0, 0)") return color;
          }
        }),
      )
      .toBe("rgb(228, 179, 87)");
    await target.dblclick();
    await expect(editable).toBeFocused();
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await expect(cursive).toHaveAttribute("aria-pressed", "true");
    await expect(font).toHaveValue("Georgia");
    await expect(size).toHaveValue("5");
    await expect(highlight).toHaveValue("#e4b357");
    await expect(foreground).toHaveValue("#1847bc");
    if (block) {
      await expect(
        toolbar.getByRole("combobox", { name: "Paragrafo o titolo" }),
      ).toHaveValue("h3");
      await expect(
        toolbar.getByRole("combobox", { name: "Allineamento" }),
      ).toHaveValue("justifyCenter");
    }

    await selectWord(word);
    await bold.click();
    await expect(bold).toHaveAttribute("aria-pressed", "false");
    await expect(cursive).toHaveAttribute("aria-pressed", "true");
    await apply.click();
    await expect(formatted).toHaveCSS("font-style", "italic");
    await expect(formatted).toHaveCSS("font-weight", unselectedStyle.weight);
    await target.dblclick();
    await expect(bold).toHaveAttribute("aria-pressed", "false");
    await expect(cursive).toHaveAttribute("aria-pressed", "true");
    if (title === "modal articolo") {
      await page.keyboard.press("Escape");
      await expect(modal).toHaveCount(0);
      await expect(target).toBeVisible();
    } else {
      await cancel.click();
    }
    console.log("PASS FORMAT " + title);
  }

  await page.goto(base + "/admin/tour/" + tour.slug);
  await expect(
    page.locator('iframe[title="Contenuto pubblico del tour modificabile"]'),
  ).toHaveCSS("pointer-events", "auto", { timeout: 25000 });
  const tourPreview = page.frameLocator(
    'iframe[title="Contenuto pubblico del tour modificabile"]',
  );
  await exercise(
    tourPreview.locator('[data-tour-field="descriptionHtml"]').first(),
    "modal tour",
    { block: true, drag: true },
  );
  const excludedHeading = tourPreview.locator(
    '[data-tour-field="detailCopy.headingEscluso"]',
  );
  if (!(await excludedHeading.count())) {
    await page
      .getByRole("combobox", { name: "Tipo di voce da aggiungere" })
      .selectOption("exclusions");
    await page
      .getByRole("button", { name: "Aggiungi voce", exact: true })
      .click();
  }
  await exercise(excludedHeading, "titolo Non incluso");
  await excludedHeading.dblclick();
  await editable.fill("");
  await apply.click();
  await expect(excludedHeading).toHaveAttribute("data-cms-removed", "");
  await excludedHeading.dblclick();
  await expect(editable).toBeEmpty();
  await editable.fill("Non incluso");
  await apply.click();
  await expect(excludedHeading).not.toHaveAttribute("data-cms-removed", "");
  await page.getByRole("button", { name: "Card visuale", exact: true }).click();
  const card = page.frameLocator('iframe[title="Card del tour modificabile"]');
  await exercise(
    card.locator('[data-tour-field="cardPreview.title"]'),
    "campi tour nella card",
  );

  await page.goto(base + "/admin/contenuti/articoli");
  await page
    .getByRole("button", { name: "Modifica " + article.title, exact: true })
    .first()
    .click();
  const articlePreview = page.frameLocator(
    'iframe[title^="Pagina pubblica modificabile:"]',
  );
  await exercise(
    articlePreview.locator("h1[data-cms]").first(),
    "modal articolo",
  );

  await exercise(
    articlePreview.locator('[data-cms*="kicker"]').first(),
    "etichetta articolo",
  );
  const articleLabel = articlePreview.locator('[data-cms*="kicker"]').first();
  await articleLabel.dblclick();
  await editable.fill("");
  await apply.click();
  await expect(articleLabel).toHaveAttribute("data-cms-removed", "");
  await articleLabel.dblclick();
  await expect(editable).toBeEmpty();
  await cancel.click();
  await page.getByRole("button", { name: "Chiudi pannello" }).click();

  await page.goto(base + "/admin/contenuti/homepage");
  await expect(page.getByLabel("Pagina da modificare")).toBeEnabled({
    timeout: 25000,
  });
  const publicPreview = page.frameLocator(
    'iframe[title^="Pagina pubblica modificabile:"]',
  );
  await exercise(
    publicPreview.locator("h1[data-cms]").first(),
    "modal contenuto pubblico",
  );
  await page.getByRole("button", { name: "Annulla bozza" }).click();
  await expect(page.getByLabel("Pagina da modificare")).toBeEnabled({
    timeout: 25000,
  });
  const cta = publicPreview.locator('[data-cms*="primaryLabel"]').first();
  await exercise(cta, "etichetta pulsante della homepage");

  async function publish() {
    const [saved] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().endsWith("/admin/visual-content") &&
          r.request().method() === "POST",
      ),
      page.getByRole("button", { name: /^Salva \(\d+\)$/ }).click(),
    ]);
    assert.equal(saved.status(), 200, await saved.text());
    await expect(page.getByLabel("Pagina da modificare")).toBeEnabled({
      timeout: 25000,
    });
  }
  await publish();
  await page.reload();
  await expect(page.getByLabel("Pagina da modificare")).toBeEnabled({
    timeout: 25000,
  });
  await expect(cta.getByText("Selezione", { exact: true })).toHaveCSS(
    "font-family",
    /Georgia/,
  );
  await cta.dblclick();
  await expect(font).toHaveValue("Georgia");
  await expect(cursive).toHaveAttribute("aria-pressed", "true");
  await cancel.click();

  const whatsappSelector = '[data-cms*="home-secondaryLabel"]';
  const whatsapp = publicPreview.locator(whatsappSelector);
  const subtitle = publicPreview.locator('[data-cms*="home-toursTitle"]');
  const publicPage = await context.newPage();
  for (const [target, selector] of [
    [whatsapp, whatsappSelector],
    [subtitle, '[data-cms*="home-toursTitle"]'],
  ]) {
    const original = await target.innerText();
    await target.dblclick();
    await selectWord(original);
    await color(foreground, "#1847bc");
    await apply.click();
    await expect(target.getByText(original, { exact: true })).toHaveCSS(
      "color",
      "rgb(24, 71, 188)",
    );
    await target.dblclick();
    await selectWord(original);
    await toolbar
      .getByRole("button", { name: "Reimposta stile selezione" })
      .click();
    await apply.click();
    await expect(target.locator(".rich-inline")).toHaveCount(0);
    await target.dblclick();
    await selectWord(original);
    await color(foreground, "#1847bc");
    await apply.click();
    await expect(target.getByText(original, { exact: true })).toHaveCSS(
      "color",
      "rgb(24, 71, 188)",
    );
    await publish();

    await target.dblclick();
    await selectWord(original);
    await toolbar
      .getByRole("button", { name: "Reimposta stile selezione" })
      .click();
    await apply.click();
    await expect(target.locator(".rich-inline")).toHaveCount(0);
    await publish();
    await expect(target.locator(".rich-inline")).toHaveCount(0);

    for (const text of [original + "x", original]) {
      await target.dblclick();
      await editable.fill(text);
      await apply.click();
      await expect(target).toHaveText(text);
      await publish();
      await expect(target).toHaveText(text);
    }

    await target.dblclick();
    await editable.fill("");
    await apply.click();
    await expect(target).toHaveAttribute("data-cms-removed", "");
    await expect(target).toHaveCSS("outline-style", "dashed");
    await expect(target).toHaveCSS("outline-color", "rgb(189, 37, 37)");
    await publish();
    await expect(target).toHaveAttribute("data-cms-removed", "");
    await publicPage.goto(base + "/");
    await expect(publicPage.locator(selector)).toHaveCount(1);
    await expect(publicPage.locator(selector)).toBeHidden();

    await target.dblclick();
    await expect(editable).toBeEmpty();
    await editable.fill(original);
    await apply.click();
    await expect(target).not.toHaveAttribute("data-cms-removed", "");
    await publish();
    await publicPage.reload();
    await expect(publicPage.locator(selector)).toBeVisible();
    await expect(publicPage.locator(selector)).toHaveText(original);
  }
  await publicPage.close();
  console.log(
    "PASS FORMAT reset prima e dopo la pubblicazione, un carattere, eliminazione e ripristino",
  );

  await page.getByLabel("Pagina da modificare").selectOption("/chi-siamo");
  const aboutTitle = publicPreview.locator(
    `[data-cms='${JSON.stringify({ scope: "page", key: "chi-siamo", path: ["titleHtml"] })}']`,
  );
  await expect(page.getByLabel("Pagina da modificare")).toBeEnabled({
    timeout: 25000,
  });
  await exercise(aboutTitle, "titolo pagina Chi siamo");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
