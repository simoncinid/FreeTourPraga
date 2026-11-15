import type { Affiliate, PlatformState } from "./model";

/** Cookie/parametro come su WP Affiliates (itthinx): `?affiliates=ID`, durata 30 giorni. */
export const AFFILIATE_PARAM = "affiliates";
export const AFFILIATE_COOKIE = "ftp_affiliates";
export const AFFILIATE_COOKIE_DAYS = 30;
export const AFFILIATE_STORAGE_KEY = "ftp-affiliate";

/** Hostel/partner attivi su it.freetourpraga.com (WP Affiliates, aprile 2023+). */
export const wpAffiliatesSeed: Affiliate[] = [
  {
    code: "AHOY",
    name: "Ahoy hostel",
    email: "manager@ahoyhostel.com",
    type: "hotel",
    commissionPercent: 0,
    active: true,
    wpId: 2,
  },
  {
    code: "BESTSPOT",
    name: "Best Spot",
    email: "info@bestspothostel.cz",
    type: "hotel",
    commissionPercent: 0,
    active: true,
    wpId: 6,
  },
  {
    code: "CHARLESBRIDGE",
    name: "Charles Bridge Hostel",
    email: "Info@charlesbridgehostel.com",
    type: "hotel",
    commissionPercent: 0,
    active: true,
    wpId: 5,
  },
  {
    code: "DOWNTOWN",
    name: "Hostal Downtown",
    email: "downtown@jsc.cz",
    type: "hotel",
    commissionPercent: 0,
    active: true,
    wpId: 3,
  },
  {
    code: "SOPHIES",
    name: "Sophies new town",
    email: "sophies.hostel@bohoco.cz",
    type: "hotel",
    commissionPercent: 0,
    active: true,
    wpId: 4,
  },
  {
    code: "PRAGUECITY",
    name: "Prague city center",
    email: "maioasis506@gmail.com",
    type: "hotel",
    commissionPercent: 0,
    active: true,
    wpId: 7,
  },
  {
    code: "HOPON",
    name: "Hop On Hop Off",
    email: "heshamadammoursi@gmail.com",
    type: "agency",
    commissionPercent: 0,
    active: true,
    wpId: 8,
  },
];

export function affiliatePublicLink(baseUrl: string, a: Affiliate) {
  if (a.wpId != null)
    return `${baseUrl}/?${AFFILIATE_PARAM}=${encodeURIComponent(String(a.wpId))}`;
  return `${baseUrl}/?ref=${encodeURIComponent(a.code)}`;
}

/** Risolve codice stringa (`AHOY`) o ID numerico WP (`2` / `affiliates=2`). */
export function resolveAffiliate(
  s: PlatformState,
  raw: string | undefined | null,
  onlyActive = true,
): Affiliate | undefined {
  const value = (raw || "").trim();
  if (!value) return undefined;
  const upper = value.toUpperCase();
  const asId = /^\d+$/.test(value) ? Number(value) : NaN;
  return s.affiliates.find((a) => {
    if (onlyActive && !a.active) return false;
    if (a.code === upper) return true;
    if (Number.isFinite(asId) && a.wpId === asId) return true;
    return false;
  });
}

/** Unisce seed WP senza sovrascrivere affiliati già presenti (per code o wpId). */
export function ensureWpAffiliates(s: PlatformState) {
  for (const seed of wpAffiliatesSeed) {
    const exists = s.affiliates.some(
      (a) => a.code === seed.code || (seed.wpId != null && a.wpId === seed.wpId),
    );
    if (!exists) s.affiliates.push({ ...seed });
  }
}

export function bookingAdminRecipients() {
  const raw =
    process.env.BOOKING_ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    "info@freetourpraga.com,admin@unitedworldtours.eu,freetourpraga@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .join(", ");
}
