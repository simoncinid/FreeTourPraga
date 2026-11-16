import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.TEST_URL || "http://localhost:3101";
if (!/^http:\/\/(localhost|127\.0\.0\.1):3101$/.test(base))
  throw Error("Gallery mutations require the isolated QA server on port 3101");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const request = context.request;
const uploaded = [];
await mkdir("output/ui-audit/tour-gallery", { recursive: true });
const login = await request.post(`${base}/api/platform/login`, {
  headers: { Origin: base },
  data: { email: "admin@freetourpraga.local", password: "PragaLocale!2026" },
});
assert.equal(login.status(), 200);
const state = await (
  await request.get(`${base}/api/platform/admin/state`)
).json();
const original = state.tours[0];
async function save(tour) {
  const response = await request.put(`${base}/api/platform/admin/tour`, {
    headers: { Origin: base },
    data: tour,
  });
  assert.equal(response.status(), 200, await response.text());
}
async function stored() {
  return (
    await (await request.get(`${base}/api/platform/admin/state`)).json()
  ).tours.find((tour) => tour.id === original.id);
}
try {
  // Verify upload -> persisted tour -> public gallery, including backward-compatible saves.
  for (const background of ["#1268d6", "#ff4b0b"]) {
    const response = await request.post(`${base}/api/platform/admin/media`, {
      headers: { Origin: base, "Content-Type": "image/png" },
      data: await sharp({
        create: { width: 160, height: 120, channels: 3, background },
      })
        .png()
        .toBuffer(),
    });
    assert.equal(response.status(), 200);
    uploaded.push((await response.json()).url);
  }
  const galleryImages = uploaded.map((url, i) => ({
    url,
    alt: `Foto di verifica ${i + 1}`,
  }));
  await save({ ...original, galleryImages });
  assert.deepEqual((await stored()).galleryImages, galleryImages);
  const legacy = { ...(await stored()) };
  delete legacy.galleryImages;
  await save(legacy);
  assert.deepEqual((await stored()).galleryImages, galleryImages);

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const gallery = page.getByRole("region", {
    name: `Foto del tour: ${original.title}`,
    exact: true,
  });
  const thumbs = gallery.getByRole("button", { name: /^Mostra foto/ });
  await page.goto(`${base}/tour/${original.slug}`);
  const consent = page.getByRole("button", {
    name: "Solo necessari",
    exact: true,
  });
  if (await consent.isVisible()) await consent.click();
  assert.equal(await thumbs.count(), 3);
  await thumbs.nth(2).click();
  assert.equal(await thumbs.nth(2).getAttribute("aria-pressed"), "true");
  assert.equal(
    await gallery.getByRole("img").getAttribute("alt"),
    "Foto di verifica 2",
  );
  await gallery
    .getByRole("button", { name: "Foto successiva", exact: true })
    .click();
  assert.equal(await thumbs.nth(0).getAttribute("aria-pressed"), "true");
  await gallery
    .getByRole("button", { name: "Foto precedente", exact: true })
    .click();
  assert.equal(await thumbs.nth(2).getAttribute("aria-pressed"), "true");
  await thumbs.nth(2).press("Home");
  assert.equal(await thumbs.nth(0).getAttribute("aria-pressed"), "true");
  await thumbs.nth(0).press("End");
  assert.equal(await thumbs.nth(2).getAttribute("aria-pressed"), "true");
  const invalid = await request.put(`${base}/api/platform/admin/tour`, {
    headers: { Origin: base },
    data: {
      ...original,
      galleryImages: [{ url: "https://evil.example/a.jpg", alt: "" }],
    },
  });
  assert.equal(invalid.ok(), false);

  // Exercise the actual admin controls: descriptions, ordering, removal, multiple uploads, save and reload.
  await page.goto(`${base}/admin/tour/${original.slug}`);
  const editor = page.getByRole("region", {
    name: "Galleria fotografica",
    exact: true,
  });
  await editor
    .getByLabel("Descrizione foto 1", { exact: true })
    .fill("Descrizione salvata QA");
  await editor
    .getByRole("button", { name: "Sposta dopo foto 1", exact: true })
    .click();
  const saveButton = page.getByRole("button", {
    name: "Salva tour e partenze",
    exact: true,
  });
  const savedDescription = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/platform/admin/tour") &&
      response.request().method() === "PUT",
  );
  await saveButton.click();
  const descriptionResponse = await savedDescription;
  assert.equal(descriptionResponse.status(), 200);
  assert.equal(
    descriptionResponse.request().postDataJSON().galleryImages[1].alt,
    "Descrizione salvata QA",
  );
  await page.getByText("Operazione completata.", { exact: true }).waitFor();
  assert.equal((await stored()).galleryImages[1].alt, "Descrizione salvata QA");
  await page.reload();
  assert.equal(
    await editor.getByLabel("Descrizione foto 2", { exact: true }).inputValue(),
    "Descrizione salvata QA",
  );
  await editor
    .getByRole("button", { name: "Rimuovi foto 1", exact: true })
    .click();
  const uploadBuffer = await sharp({
    create: { width: 160, height: 120, channels: 3, background: "#207a51" },
  })
    .png()
    .toBuffer();
  await editor.locator('input[type="file"]').setInputFiles([
    { name: "galleria-uno.png", mimeType: "image/png", buffer: uploadBuffer },
    { name: "galleria-due.png", mimeType: "image/png", buffer: uploadBuffer },
  ]);
  await editor
    .getByRole("status")
    .filter({ hasText: "2 foto caricate" })
    .waitFor();
  const savedUploads = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/platform/admin/tour") &&
      response.request().method() === "PUT",
  );
  await saveButton.click();
  assert.equal((await savedUploads).status(), 200);
  await page.getByText("Operazione completata.", { exact: true }).waitFor();
  assert.equal((await stored()).galleryImages.length, 3);
  uploaded.push(
    ...(await stored()).galleryImages.slice(1).map((photo) => photo.url),
  );

  await save({
    ...original,
    galleryImages: [...original.galleryImages, ...galleryImages],
  });
  await page.goto(`${base}/tour/${original.slug}`);
  await thumbs.first().press("End");
  assert.equal(await thumbs.last().getAttribute("aria-pressed"), "true");
  assert.ok(
    await gallery
      .locator('[aria-label="Miniature del tour"]')
      .evaluate((list) => list.scrollTop > 0),
  );

  // Recheck the real six-photo design at desktop, tablet and phone widths.
  await save(original);
  for (const width of [1920, 1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`${base}/tour/${original.slug}`);
    await gallery.waitFor();
    await thumbs.nth(1).click();
    await thumbs.nth(0).click();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(
          document.querySelectorAll('[aria-roledescription="carosello"] img'),
          (image) => image.decode().catch(() => {}),
        ),
      );
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Overflow at ${width}`,
    );
    const mainPhoto = await gallery.getByRole("img").boundingBox();
    const galleryBounds = await gallery.boundingBox();
    const contentBounds = await page.locator("h1").evaluate((heading) => {
      const bounds = heading.closest(".container-page").getBoundingClientRect();
      return { x: bounds.x, width: bounds.width };
    });
    assert.ok(Math.abs(galleryBounds.x - contentBounds.x) < 1);
    assert.ok(Math.abs(galleryBounds.width - contentBounds.width) < 1);
    if (width >= 768) {
      assert.ok(
        mainPhoto.width > galleryBounds.width / 2,
        `Main photo must exceed half gallery width at ${width}`,
      );
      assert.ok(mainPhoto.x < (await thumbs.first().boundingBox()).x);
    }
    await page.screenshot({
      path: `output/ui-audit/tour-gallery/desktop-${width}.png`,
    });
    await thumbs.nth(3).click();
    await gallery.getByRole("img").evaluate((image) => image.decode());
    assert.equal(await thumbs.nth(3).getAttribute("aria-pressed"), "true");
    assert.equal(
      await thumbs
        .nth(3)
        .evaluate((button) => getComputedStyle(button).borderTopColor),
      "rgb(255, 75, 11)",
    );
    if (width === 1440)
      await page.screenshot({
        path: "output/ui-audit/tour-gallery/selected-photo-desktop.png",
      });
  }
  // Removing all extra photos remains intentional after reload, with no empty controls.
  await save({ ...original, galleryImages: [] });
  await page.reload();
  assert.equal(await thumbs.count(), 0);
  assert.equal(await gallery.getByRole("img").count(), 1);
  assert.equal(
    await gallery
      .getByRole("button", { name: "Foto successiva", exact: true })
      .count(),
    0,
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS tour gallery: uploads, persistence, legacy saves, validation, admin reorder/remove/captions/multi-upload, clicks/arrows/keyboard, responsive layout, selected border and one-photo fallback",
  );
} finally {
  await save(original);
  await browser.close();
  if (process.env.HTTP_TEST_PRODUCTION !== "1")
    for (const url of uploaded)
      await rm(`.data/media/${url.split("/").pop()}`, { force: true });
}
