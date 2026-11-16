import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
export const pages = [
  ["01-home", "/"],
  ["02-tour", "/tour"],
  ["03-tour-citta", "/tour/citta-vecchia-ponte-carlo"],
  ["04-tour-castello", "/tour/castello-praga-mala-strana"],
  ["05-tour-birra", "/tour/birra-ceca-storie-locali"],
  ["06-chi-siamo", "/chi-siamo"],
  ["07-informazioni", "/informazioni-utili"],
  ["08-contatti", "/contatti"],
  ["09-partner", "/partner-europa"],
  ["10-privati", "/tour-privati"],
  ["11-blog", "/blog"],
  ["12-aiuto", "/aiuto"],
  ["13-faq", "/faq"],
  ["14-privacy", "/privacy"],
  ["15-termini", "/termini"],
  ["16-accesso", "/accesso"],
  ["17-carrello-empty", "/carrello"],
  ["18-checkout-empty", "/checkout"],
  ["19-conferma-empty", "/prenotazione/confermata"],
  ["21-not-found", "/pagina-non-esistente"],
];
const browser = await chromium.launch();
const reports = [];
try {
  for (const width of [1440, 1280, 1920, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      locale: "it-IT",
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      localStorage.setItem("ftp-consent", "essential"),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [name, path] of pages) {
      errors.length = 0;
      const response = await page.goto("http://localhost:3100" + path);
      await page
        .getByLabel("Preferenze privacy", { exact: true })
        .waitFor({ state: "hidden" });
      if (path === "/carrello" || path === "/checkout")
        await page
          .getByText("Il tuo viaggio comincia qui.", { exact: true })
          .waitFor();
      if (path === "/prenotazione/confermata")
        await page.getByRole("status").waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        );
      });
      const details = await page.evaluate(() => ({
        h1: document.querySelector("main h1")?.innerText,
        h1Count: document.querySelectorAll("main h1").length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenImages: [...document.images]
          .filter((i) => i.naturalWidth === 0)
          .map((i) => i.src),
      }));
      assert.equal(details.h1Count, 1, `${width} ${path}: h1`);
      assert.equal(details.overflow, false, `${width} ${path}: overflow`);
      assert.deepEqual(details.brokenImages, [], `${width} ${path}: images`);
      assert.deepEqual(errors, [], `${width} ${path}: JS`);
      if (width === 1440) {
        await page.mouse.move(0, 0);
        await page.screenshot({
          path: `output/ui-audit/${name}-final.png`,
          fullPage: true,
        });
        if (name === "01-home")
          await page.screenshot({
            path: "output/ui-audit/01-home-final-hero.png",
          });
      }
      reports.push({
        name,
        path,
        width,
        status: response.status(),
        ...details,
      });
    }
    if (width === 1440) {
      await page.goto("http://localhost:3100/faq");
      await page.locator("main summary").first().click();
      assert.equal(await page.locator("main details[open]").count(), 1);
      await page.screenshot({
        path: "output/ui-audit/13-faq-open-final.png",
        fullPage: true,
      });
      await page.locator("main summary").first().press("Enter");
      assert.equal(await page.locator("main details[open]").count(), 0);
      await page.goto("http://localhost:3100/tour");
      assert.equal(await page.locator("main article").count(), 3);
      await page
        .getByRole("textbox", { name: "Cerca un tour", exact: true })
        .fill("nessun-risultato-ui");
      await page
        .getByText("Nessun tour corrisponde ai filtri scelti.", {
          exact: false,
        })
        .waitFor();
      await page.screenshot({
        path: "output/ui-audit/02-tour-empty-final.png",
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Mostra tutti i tour", exact: false })
        .click();
      assert.equal(await page.locator("main article").count(), 3);
      await page.goto("http://localhost:3100/");
      await page
        .getByRole("tab", { name: "Tuffo nella storia", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("tab", { name: "Tuffo nella storia", exact: true })
          .getAttribute("aria-selected"),
        "true",
      );
      await page.screenshot({
        path: "output/ui-audit/01-home-second-tab-final.png",
        fullPage: true,
      });
      await page.goto("http://localhost:3100/pagamento");
      assert.match(page.url(), /\/checkout$/);
      await page.goto("http://localhost:3100/self-service/ui-invalid");
      assert.equal(
        await page.locator("h1").innerText(),
        "Ritroviamo la strada.",
      );
    }
    await context.close();
    console.log(
      `PASS ${width}px: ${pages.length} public pages, headings, overflow, images, JS${width === 1440 ? ", filters, tabs, keyboard FAQ, redirects and unavailable link" : ""}`,
    );
  }
  await writeFile(
    "output/ui-audit/verification.json",
    JSON.stringify({ checks: reports.length, reports }, null, 2),
  );
} finally {
  await browser.close();
}
