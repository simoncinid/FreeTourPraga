import assert from "node:assert/strict";
import test from "node:test";
import {
  inferredTourCode,
  tourCodeSort,
  tourFilterLabel,
} from "../src/lib/tour-code";

test("sigle ufficiali e ordine FT…PRIV", () => {
  const tours = [
    { slug: "terezin", title: "Terezín" },
    { slug: "free-tour-praga", title: "Free Tour" },
    { slug: "citta-nuova-di-praga", title: "Città Nuova" },
    { slug: "tour-privato", title: "Privato", code: "PRIV" },
    { slug: "comunismo", title: "Comunismo" },
  ];
  assert.equal(inferredTourCode(tours[0]), "TZ");
  assert.equal(inferredTourCode(tours[1]), "FT");
  assert.equal(tourFilterLabel({ ...tours[1], title: "Free Tour" }), "FT / Free Tour");
  assert.deepEqual(
    [...tours].sort(tourCodeSort).map((tour) => inferredTourCode(tour)),
    ["FT", "CN", "CB", "TZ", "PRIV"],
  );
});
