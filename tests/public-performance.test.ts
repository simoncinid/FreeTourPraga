import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialState, readState } from "../src/lib/platform/store";
import { catalog, navigationTours, publicSiteContent } from "../src/lib/platform/public";

test("content reads skip calendar expansion while catalog and booking reads retain generated inventory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ftp-public-performance-"));
  const previousStorage = process.env.PLATFORM_STORAGE;
  const previousFile = process.env.PLATFORM_DATA_FILE;
  try {
    process.env.PLATFORM_STORAGE = "local";
    process.env.PLATFORM_DATA_FILE = join(directory, "state.json");
    const state = initialState();
    const tour = state.tours[0];
    tour.slots = [];
    tour.operationalReviewRequired = false;
    tour.schedule = {
      enabled: true, from: "2050-01-01", to: "2050-12-31",
      weekdays: [0, 1, 2, 3, 4, 5, 6], times: ["10:00"], capacity: 25,
    };
    await writeFile(process.env.PLATFORM_DATA_FILE, JSON.stringify(state));

    const contentState = await readState({ generateSlots: false });
    assert.equal(contentState.tours[0].slots.length, 0);
    assert.equal((await publicSiteContent()).globals.brandName, state.siteContent!.globals.brandName);
    assert.deepEqual((await navigationTours())[0], {
      title: tour.title, slug: tour.slug, canonicalPath: tour.canonicalPath,
    });
    assert.equal((await readState()).tours[0].slots.length, 90);
    const publicSlots = (await catalog()).find((item) => item.id === tour.id)!.slots;
    assert.equal(publicSlots.length, 90);
    assert.equal(new Set(publicSlots.map((slot) => slot.id)).size, 90);
    assert.equal((await catalog()).find((item) => item.id === tour.id)!.slots.length, 90);
  } finally {
    if (previousStorage === undefined) delete process.env.PLATFORM_STORAGE;
    else process.env.PLATFORM_STORAGE = previousStorage;
    if (previousFile === undefined) delete process.env.PLATFORM_DATA_FILE;
    else process.env.PLATFORM_DATA_FILE = previousFile;
    await rm(directory, { recursive: true, force: true });
  }
});
