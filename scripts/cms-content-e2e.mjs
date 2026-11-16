import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes, scryptSync } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { initialState } from "../src/lib/platform/store.ts";
import { defaultSiteContent } from "../src/lib/platform/content.ts";
const temp = await mkdtemp(join(tmpdir(), "ftp-content-workspace-"));
const state = initialState();
state.siteContent = defaultSiteContent();
delete state.siteContent.contentVersion;
const legacy = (title, subtitle, body) => ({
  title,
  subtitle,
  body,
  seoTitle: title + " SEO",
  seoDescription: "Descrizione salvata",
  published: true,
});
state.pages = {
  homepage: legacy(
    "Home legacy pubblicata",
    "Sopratitolo home salvato",
    "Introduzione home conservata",
  ),
  blog: legacy(
    "Blog legacy pubblicato",
    "Guide della redazione",
    "Introduzione blog conservata",
  ),
  faq: legacy(
    "FAQ legacy pubblicate",
    "Risposte della redazione",
    "Introduzione FAQ conservata",
  ),
};
await writeFile(join(temp, "state.json"), JSON.stringify(state));
await mkdir("output/ui-audit", { recursive: true });
const nextEnvBefore = await readFile("next-env.d.ts", "utf8");
const salt = randomBytes(16).toString("hex");
const base = "http://localhost:3112";
const env = {
  ...process.env,
  PLATFORM_STORAGE: "local",
  PLATFORM_DATA_FILE: join(temp, "state.json"),
  NEXT_DIST_DIR: ".next-qa",
  NEXT_PUBLIC_SITE_URL: base,
  SESSION_SECRET: randomBytes(48).toString("hex"),
  STAFF_USERS: JSON.stringify([
    {
      email: "cms-qa@example.com",
      role: "admin",
      passwordHash: `${salt}:${scryptSync("ContentTest!2026", salt, 64).toString("hex")}`,
    },
  ]),
  SMTP_HOST: "",
  IMAP_HOST: "",
  STRIPE_SECRET_KEY: "",
  TWILIO_CONTENT_SID: "",
};
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--webpack", "--port", "3112"],
  { env, detached: true, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (d) => {
    logs = (logs + d).slice(-10000);
  });
let browser;
try {
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw Error("QA server exited");
    try {
      const r = await fetch(base + "/api/platform/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (r.ok) break;
    } catch {}
    if (i === 89) throw Error("QA server did not start");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "it-IT",
  });
  assert.equal(
    (
      await context.request.post(base + "/api/platform/login", {
        data: { email: "cms-qa@example.com", password: "ContentTest!2026" },
      })
    ).status(),
    200,
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/admin/sito");
  await page.waitForURL("**/admin/contenuti");
  const consent = page.getByRole("button", {
    name: "Solo necessari",
    exact: true,
  });
  if (await consent.isVisible()) await consent.click();
  await expect(
    page.getByLabel("Titolo principale", { exact: true }),
  ).toHaveValue("Home legacy pubblicata");
  assert.equal(
    await page
      .locator("aside")
      .getByRole("link", { name: "Contenuti", exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Home, FAQ e contatti", exact: true })
      .count(),
    0,
  );
  assert.equal(await page.locator('a[href="/admin/sito"]').count(), 0);
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(
    await page
      .getByRole("navigation", { name: "Aree contenuti", exact: true })
      .getByRole("link")
      .count(),
    7,
  );
  assert.equal(
    await page.getByLabel("Titolo pagina", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByLabel("Titolo elenco articoli", { exact: true }).count(),
    0,
  );
  async function save(label, endpoint = "site-content") {
    const promise = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/platform/admin/" + endpoint) &&
        r.request().method() === "PUT",
    );
    await page.getByRole("button", { name: label, exact: true }).click();
    const r = await promise;
    assert.equal(r.status(), 200, await r.text());
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeEnabled();
  }
  const reader = await context.newPage();
  await reader.goto(base + "/");
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "Home legacy pubblicata",
  );
  await page
    .getByLabel("Titolo principale", { exact: true })
    .fill("Homepage da un solo editor");
  await save("Pubblica homepage");
  await reader.reload();
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "Homepage da un solo editor",
  );
  await page
    .getByLabel("Titolo SEO", { exact: true })
    .fill("SEO indipendente homepage");
  await save("Salva SEO", "page");
  await reader.reload();
  assert.match(await reader.title(), /^SEO indipendente homepage/);
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "Homepage da un solo editor",
  );
  await page.screenshot({
    path: "output/ui-audit/content-workspace-home.png",
    fullPage: false,
  });
  const nav = page.getByRole("navigation", {
    name: "Aree contenuti",
    exact: true,
  });
  await nav.getByRole("link", { name: "Blog", exact: true }).click();
  await expect(
    page.getByLabel("Titolo elenco articoli", { exact: true }),
  ).toHaveValue("Blog legacy pubblicato");
  assert.equal(
    await page.getByLabel("Titolo principale", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Crea articolo", exact: true })
      .count(),
    1,
  );
  await page
    .getByLabel("Titolo elenco articoli", { exact: true })
    .fill("Blog con articoli sempre visibili");
  await save("Pubblica blog");
  await reader.goto(base + "/blog");
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "Blog con articoli sempre visibili",
  );
  assert.equal(
    await reader.getByRole("link", { name: /Leggi la guida/ }).count(),
    state.siteContent.gallery.length,
  );
  await page.screenshot({
    path: "output/ui-audit/content-workspace-blog.png",
    fullPage: false,
  });
  await nav.getByRole("link", { name: "FAQ e risposte", exact: true }).click();
  await expect(
    page.getByLabel("Titolo pagina FAQ", { exact: true }),
  ).toHaveValue("FAQ legacy pubblicate");
  assert.equal(
    await page.getByLabel("Titolo elenco articoli", { exact: true }).count(),
    0,
  );
  await page
    .getByLabel("Titolo pagina FAQ", { exact: true })
    .fill("FAQ da un solo editor");
  await page
    .getByLabel("Introduzione pagina FAQ", { exact: true })
    .fill("Introduzione unica delle FAQ");
  await save("Pubblica faq e risposte");
  await reader.goto(base + "/faq");
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "FAQ da un solo editor",
  );
  assert.equal(
    await reader.locator("main details").count(),
    state.siteContent.faqs.length,
  );
  await page
    .getByLabel("Titolo SEO", { exact: true })
    .fill("SEO indipendente FAQ");
  await save("Salva SEO", "page");
  await reader.reload();
  assert.equal(
    await reader.locator("main details").count(),
    state.siteContent.faqs.length,
  );
  await nav.getByRole("link", { name: "Dati e contatti", exact: true }).click();
  await expect(
    page.getByLabel("Email di assistenza", { exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.getByLabel("Titolo pagina", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByLabel("Titolo principale", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByLabel("Profilo TripAdvisor", { exact: true }).count(),
    0,
  );
  await page.screenshot({
    path: "output/ui-audit/content-workspace-identity.png",
    fullPage: false,
  });
  await nav.getByRole("link", { name: "Menu e social", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Menu del sito", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Profili social", exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.getByLabel("Email di assistenza", { exact: true }).count(),
    0,
  );
  await nav.getByRole("link", { name: "Recensioni", exact: true }).click();
  await expect(
    page.getByLabel("Profilo TripAdvisor", { exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.getByLabel("Email di assistenza", { exact: true }).count(),
    0,
  );
  await nav.getByRole("link", { name: "Pagine del sito", exact: true }).click();
  const pageNav = page.getByRole("navigation", {
    name: "Pagine del sito",
    exact: true,
  });
  await expect(pageNav.getByRole("link")).toHaveCount(6);
  for (const removed of [
    "homepage",
    "blog",
    "faq",
    "informazioni-utili",
    "tour-privati",
  ])
    assert.equal(
      await pageNav.locator(`a[href="/admin/contenuti/${removed}"]`).count(),
      0,
    );
  await pageNav
    .getByRole("link", { name: "Pagina contatti", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pagina contatti", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Titolo pagina", { exact: true })).toBeVisible();
  await page
    .getByLabel("Titolo pagina", { exact: true })
    .fill("Pagina contatti gestita qui");
  await page
    .getByRole("checkbox", {
      name: "Usa questi testi nella pagina pubblica",
      exact: true,
    })
    .check();
  await save("Salva pagina", "page");
  await reader.goto(base + "/contatti");
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "Pagina contatti gestita qui",
  );
  const current = await (
    await context.request.get(base + "/api/platform/admin/state")
  ).json();
  assert.equal(
    current.siteContent.home.heroTitle,
    "Homepage da un solo editor",
  );
  assert.equal(current.siteContent.contentVersion, 2);
  assert.deepEqual(
    current.siteContent.gallery.map((g) => g.title),
    state.siteContent.gallery.map((g) => g.title),
  );
  const attempt = {
    ...current.pages.homepage,
    title: "Titolo da vecchio editor da ignorare",
    body: "Corpo da ignorare",
    seoTitle: "Metadati aggiornati via API",
  };
  assert.equal(
    (
      await context.request.put(base + "/api/platform/admin/page", {
        data: { key: "homepage", page: attempt },
      })
    ).status(),
    200,
  );
  await reader.goto(base + "/");
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText(
    "Homepage da un solo editor",
  );
  await page.goto(base + "/admin/contenuti/informazioni-utili");
  await page.waitForURL("**/admin/contenuti/faq");
  await expect(
    page.getByLabel("Titolo pagina FAQ", { exact: true }),
  ).toHaveValue("FAQ da un solo editor");
  assert.deepEqual(errors, []);
  await writeFile(
    "output/ui-audit/content-workspace-verification.json",
    JSON.stringify(
      {
        oneSidebarEntry: true,
        legacyRedirect: true,
        sevenDistinctAreas: true,
        legacyContentPreserved: true,
        canonicalHome: true,
        blogIndexPreserved: true,
        faqStructurePreserved: true,
        seoDoesNotOverrideText: true,
        pagesEditable: true,
        articlesPreserved: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: unified navigation, unique field owners, legacy migration, scoped saving, SEO isolation, public rendering and article preservation",
  );
} catch (error) {
  console.error(error);
  console.error(logs);
  process.exitCode = 1;
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
  await rm(temp, { recursive: true, force: true });
  const now = await readFile("next-env.d.ts", "utf8");
  if (now.includes(".next-qa/"))
    await writeFile("next-env.d.ts", nextEnvBefore);
}
