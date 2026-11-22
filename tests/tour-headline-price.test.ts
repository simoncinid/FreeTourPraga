import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/lib/platform/store";
import { tourHeadlinePrice } from "../src/lib/participant-pricing";
import { publicTour } from "../src/lib/platform/scheduling";
import { tourJsonLd } from "../src/lib/seo";
import { quote } from "../src/lib/platform/booking";

test("editing category prices updates headline, public catalog, SEO and quote despite an obsolete scalar and label", () => {
  const state = initialState(),
    tour = state.tours[0];
  tour.isFreeTour = false;
  tour.currency = "CZK";
  tour.priceLabel = "Vecchio prezzo 29 euro";
  tour.basePriceCents = 2900;
  tour.priceCategories = [
    { id: "infants", label: "Minori di 6 anni", priceCents: 0 },
    { id: "adults", label: "Adulti", priceCents: 40000 },
    { id: "students", label: "Studenti", priceCents: 35000 },
  ];
  const slot = tour.slots[0];
  slot.startsAt = new Date(Date.now() + 86400000 * 7).toISOString();
  slot.endsAt = new Date(Date.parse(slot.startsAt) + 7200000).toISOString();
  slot.capacity = 25;
  slot.reserved = 0;
  const input = {
    items: [
      {
        tourSlug: tour.slug,
        slotId: slot.id,
        adults: 1,
        children: 0,
        infants: 0,
        participants: [{ categoryId: "adults", quantity: 1 }],
      },
    ],
    affiliateCode: "",
  };
  for (const price of [40000, 99900]) {
    tour.priceCategories[1].priceCents = price;
    const headline = tourHeadlinePrice(tour);
    assert.equal(headline.priceCents, price);
    assert.match(headline.text, /CZK/);
    assert.doesNotMatch(headline.text, /29 euro/);
    assert.equal(publicTour(state, tour).basePriceCents, price);
    assert.equal(publicTour(state, tour).priceLabel, "");
    assert.equal(tourJsonLd(tour).offers.price, (price / 100).toFixed(2));
    assert.equal(quote(state, input)[0].subtotalCents, price);
  }
  assert.equal(
    tour.basePriceCents,
    2900,
    "presentation must not rewrite historical storage",
  );
});

test("custom categories without an adults ID use the first configured category", () => {
  const tour = initialState().tours[0];
  tour.isFreeTour = false;
  tour.priceCategories = [
    { id: "custom", label: "Partecipante", priceCents: 12345 },
    { id: "reduced", label: "Ridotto", priceCents: 1000 },
  ];
  assert.equal(tourHeadlinePrice(tour).priceCents, 12345);
  tour.priceCategories[0].priceCents = 0;
  assert.equal(tourHeadlinePrice(tour).priceCents, 0);
});

test("free tours retain the offer label and zero quote reference even with legacy paid values", () => {
  const tour = initialState().tours[0];
  tour.isFreeTour = true;
  tour.basePriceCents = 2900;
  tour.priceLabel = "";
  tour.priceCategories = [{ id: "adults", label: "Adulti", priceCents: 99900 }];
  const headline = tourHeadlinePrice(tour);
  assert.equal(headline.priceCents, 0);
  assert.equal(headline.text, "Offerta libera");
  assert.equal(headline.showFrom, false);
});

test("legacy tours keep their scalar fallback, custom display label and EUR default", () => {
  const tour = initialState().tours[0];
  tour.isFreeTour = false;
  tour.priceCategories = undefined;
  tour.currency = undefined;
  tour.priceLabel = "";
  assert.equal(tourHeadlinePrice(tour).priceCents, tour.basePriceCents);
  assert.match(tourHeadlinePrice(tour).text, /€/);
  tour.priceLabel = "Tariffa su richiesta";
  assert.equal(tourHeadlinePrice(tour).text, "Tariffa su richiesta");
});

test("public derived prices preserve the stored free/paid classification for a zero adult category", () => {
  const state = initialState(),
    tour = state.tours[0];
  tour.isFreeTour = undefined;
  tour.basePriceCents = 2900;
  tour.priceCategories = [
    { id: "adults", label: "Adulti", priceCents: 0 },
    { id: "children", label: "Bambini", priceCents: 2000 },
  ];
  const exposed = publicTour(state, tour);
  assert.equal(exposed.basePriceCents, 0);
  assert.equal(exposed.isFreeTour, false);
  assert.equal(tourHeadlinePrice(exposed).isFree, false);
});
