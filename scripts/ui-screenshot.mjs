import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const [route = "/", name = "home", revision = "before", width = "1440"] =
  process.argv.slice(2);
await mkdir("output/ui-audit", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: Number(width), height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(`http://localhost:3100${route}`);
  const consent = page.getByRole("button", {
    name: "Solo necessari",
    exact: true,
  });
  if (await consent.isVisible()) await consent.click();
  if (route.startsWith("/gestisci-prenotazione/"))
    await page.locator("main").getByRole("alert").waitFor();
  if (route === "/prenotazione/confermata")
    await page.getByRole("status").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => {
        image.loading = "eager";
        return image.decode().catch(() => {});
      }),
    );
  });
  await page.mouse.move(0, 0);
  await page.screenshot({
    path: `output/ui-audit/${name}-${revision}.png`,
    fullPage: true,
  });
  const report = await page.evaluate(() => ({
    title: document.querySelector("h1")?.innerText,
    h1Count: document.querySelectorAll("h1").length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images]
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.getAttribute("src")),
    height: document.documentElement.scrollHeight,
  }));
  console.log(
    JSON.stringify(
      { route, status: response.status(), ...report, errors },
      null,
      2,
    ),
  );
  await writeFile(
    `output/ui-audit/${name}-${revision}.json`,
    JSON.stringify(
      { route, status: response.status(), ...report, errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
