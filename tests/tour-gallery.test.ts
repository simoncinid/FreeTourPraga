import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/lib/platform/store";
import { tourSchema } from "../src/lib/platform/validation";
import {
  oldTownGallery,
  tourGalleryImages,
  tourPhotos,
} from "../src/lib/tour-gallery";

test("tour galleries validate every image and preserve ordered descriptions", () => {
  const tour = initialState().tours[0];
  const galleryImages = [
    {
      url: "/api/media/12345678-abcd-abcd-abcd-123456789012.webp",
      alt: "  Ponte Carlo  ",
    },
    oldTownGallery[0],
  ];
  const parsed = tourSchema.parse({ ...tour, galleryImages });
  assert.equal(parsed.galleryImages?.[0].alt, "Ponte Carlo");
  assert.equal(parsed.galleryImages?.[1].url, oldTownGallery[0].url);
  for (const url of [
    "https://evil.example/photo.jpg",
    "javascript:alert(1)",
    "/etc/passwd",
    "http://images.unsplash.com/a.jpg",
  ]) {
    assert.equal(
      tourSchema.safeParse({ ...tour, galleryImages: [{ url, alt: "" }] })
        .success,
      false,
    );
  }
  assert.equal(
    tourSchema.safeParse({
      ...tour,
      galleryImages: Array(21).fill(galleryImages[0]),
    }).success,
    false,
  );
  assert.deepEqual(
    tourSchema.parse({ ...tour, galleryImages: [] }).galleryImages,
    [],
  );
  const { galleryImages: omitted, ...legacy } = tour;
  assert.ok(omitted);
  assert.equal(tourSchema.parse(legacy).galleryImages, undefined);
});

test("cover stays first, duplicate images disappear and empty descriptions fall back to the title", () => {
  const tour = initialState().tours[0];
  const photos = tourPhotos({
    ...tour,
    galleryImages: [
      { url: tour.imageUrl, alt: "Duplicate" },
      { url: oldTownGallery[0].url, alt: " " },
      oldTownGallery[0],
    ],
  });
  assert.equal(photos.length, 2);
  assert.equal(photos[0].url, tour.imageUrl);
  assert.equal(photos[1].alt, tour.title);
});

test("legacy stock tours receive gallery defaults without restoring removed photos or changing custom tours", () => {
  const tour = { ...initialState().tours[0], galleryImages: undefined };
  assert.equal(tourGalleryImages(tour).length, 5);
  assert.deepEqual(tourGalleryImages({ ...tour, galleryImages: [] }), []);
  assert.deepEqual(
    tourGalleryImages({ ...tour, imageUrl: "/api/media/custom.webp" }),
    [],
  );
  assert.deepEqual(tourGalleryImages({ ...tour, id: "custom-tour" }), []);
});
