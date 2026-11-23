import flyer from "@/content/volantino-2026.json";
import type { PlatformState } from "./model";
import { defaultSiteContent, siteContent } from "./content";
import { defaultNavigation } from "../navigation";
import { generateScheduledSlots } from "./scheduling";
import { pragueLocal } from "./time";
const revision = "specifications-v2-2026-11-22";
export function applySpecifications(s: PlatformState, now = Date.now()) {
  if (s.events.includes(revision)) return { applied: false, tours: 0 };
  const today = pragueLocal(new Date(now).toISOString()).slice(0, 10);
  const nextYear = new Date(`${today}T12:00:00Z`);
  nextYear.setUTCDate(nextYear.getUTCDate() + 365);
  const content = siteContent(s.siteContent, s.pages),
    defaults = defaultSiteContent();
  content.home = {
    ...content.home,
    ...Object.fromEntries(
      Object.entries(defaults.home).filter(
        ([key]) => !["heroImage", "contentBlocks"].includes(key),
      ),
    ),
  };
  content.globals.socialLinks = [
    { label: "Instagram", url: "https://www.instagram.com/freetours_praga/" },
    { label: "Facebook", url: "https://www.facebook.com/@FreeTourPraga" },
    { label: "TikTok", url: "https://www.tiktok.com/" },
    { label: "YouTube", url: "https://www.youtube.com/" },
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
  ];
  content.globals.instagramDirectUrl ||= "https://ig.me/m/freetours_praga";
  content.globals.googleReviewUrl ||=
    "https://g.page/r/CY2Houtn8d4XEBM/review";
  content.globals.castleMeetingAddress ||=
    "Terzo cortile del Castello di Praga, 119 00 Praha 1-Hradčany";
  content.answers = defaults.answers;
  content.globals.navigationVersion = 2;
  content.home.specialOffers = flyer.offers.map((o) => ({
    label: o.tours.join(" + "),
    priceCents: o.priceCents,
  }));
  content.home.specialOffersNote = flyer.offersNote;
  content.home.specialOffersCurrency = "CZK";
  content.globals.navigation = structuredClone(defaultNavigation);
  content.globals.address =
    "Teatro degli Stati, Rytířská 22, 110 00 Staré Město, Praga";
  content.globals.supportHours = "Tutti i giorni dalle 9:00 alle 19:00";
  content.globals.tripAdvisorTitle = "Dicono di noi";
  content.globals.tripAdvisorBody =
    "Le parole di chi ha esplorato Praga con noi.";
  const updated = [];
  for (const item of flyer.tours) {
    const t = s.tours.find((t) => t.slug === item.slug);
    if (!t) continue;
    t.title = item.title;
    t.category = item.category;
    t.description = item.description;
    t.descriptionHtml = undefined;
    t.shortDescription = item.description
      .split(/(?<=[.!?]) /)
      .slice(0, 2)
      .join(" ");
    t.currency = item.currency as "EUR" | "CZK";
    t.priceCategories = item.priceCategories;
    t.basePriceCents = item.priceCategories[0].priceCents;
    t.childPriceCents =
      item.priceCategories.find((c) => c.id === "children")?.priceCents ?? 0;
    t.infantPriceCents = 0;
    t.adultMinAge = item.priceCategories[0].minAge;
    t.childMinAge =
      item.priceCategories.find((c) => c.id === "children")?.minAge ?? 6;
    t.durationMinutes = item.durationMinutes;
    t.operatingDays = item.operatingDays;
    t.departureTime = item.departureTime;
    t.arrivalMinutes = 15;
    t.highlights = item.highlights;
    t.inclusions = item.inclusions;
    t.safetyNotes = item.safetyNotes;
    t.onlineDiscounts = false;
    t.isFreeTour = item.slug === "free-tour-praga";
    t.priceLabel = t.isFreeTour ? "Offerta libera" : "";
    if (t.isFreeTour) {
      t.freeGroupMode = "contact";
      t.freeGroupLimit = 6;
    }
    t.schedule = {
      enabled: true,
      from: today,
      to: nextYear.toISOString().slice(0, 10),
      weekdays: item.weekdays,
      times: [item.departureTime],
      capacity: t.maxGuests,
    };
    // Preserve every historical/committed departure, close only unbooked future legacy slots.
    for (const slot of t.slots)
      if (
        Date.parse(slot.startsAt) > now &&
        !slot.reserved &&
        !s.bookings.some((b) => b.slotId === slot.id) &&
        (!item.weekdays.includes(
          new Date(
            `${pragueLocal(slot.startsAt).slice(0, 10)}T12:00:00Z`,
          ).getUTCDay(),
        ) ||
          pragueLocal(slot.startsAt).slice(11, 16) !== item.departureTime)
      )
        slot.closed = true;
    if (item.slug === "interni-castello-praga") {
      t.operationalReviewRequired = !content.globals.castleMeetingAddress;
      if (content.globals.castleMeetingAddress) {
        t.meetingAddress = content.globals.castleMeetingAddress;
        t.mapUrl = "https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7";
        t.mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(t.meetingAddress)}&output=embed`;
      }
    } else {
      t.meetingAddress = content.globals.address;
      t.meetingPoint = "Teatro degli Stati";
      t.operationalReviewRequired = false;
      t.mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(t.meetingAddress)}`;
      t.mapEmbedUrl = `${t.mapUrl}&output=embed`;
    }
    generateScheduledSlots(t, now);
    updated.push(t.slug);
  }
  content.home.groups = defaults.home.groups;
  s.siteContent = content;
  s.events.push(revision);
  return { applied: true, tours: updated.length, updated };
}
