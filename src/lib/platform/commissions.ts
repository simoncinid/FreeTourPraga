import type { Tour } from "../types";
import type { Affiliate, PlatformState, Reservation } from "./model";
import { isFreeTour } from "../tour-rules";
export function commissionFor(
  tour: Tour,
  affiliate: Affiliate | undefined,
  total: number,
  guests: number,
  isPackage: boolean,
) {
  if (!affiliate) return { commissionCents: 0 };
  const product = isPackage ? "package" : isFreeTour(tour) ? "free" : "paid";
  const rules = tour.commissionRules?.filter(
    (r) => r.affiliateType === affiliate.type && r.product === product,
  );
  const rule =
    rules?.find((r) => r.affiliateCode === affiliate.code) ??
    rules?.find((r) => !r.affiliateCode);
  return {
    commissionRuleSnapshot: rule ? { ...rule } : undefined,
    commissionCents: rule
      ? Math.round(
          rule.mode === "fixed"
            ? rule.value * guests
            : (total * rule.value) / 100,
        )
      : Math.round((total * affiliate.commissionPercent) / 100),
  };
}
export function commissionMatured(
  s: Pick<PlatformState, "tours">,
  b: Reservation,
  now = Date.now(),
) {
  const slot = s.tours
    .find((t) => t.slug === b.tourSlug)
    ?.slots.find((x) => x.id === b.slotId);
  return (
    !!slot &&
    Date.parse(slot.endsAt) <= now &&
    ["confirmed", "present"].includes(b.status) &&
    (!["bank_transfer", "whatsapp"].includes(b.paymentMethod) ||
      b.totalCents === 0 ||
      b.paymentStatus === "paid") &&
    b.paymentStatus !== "refunded" &&
    b.paymentStatus !== "failed"
  );
}

export function isCommissionPackage(tour: Tour, items: { tourSlug: string }[]) {
  const slugs = new Set(items.map((i) => i.tourSlug));
  return (
    slugs.has(tour.slug) &&
    (tour.commissionPackageWith ?? []).some(
      (slug) => slug !== tour.slug && slugs.has(slug),
    )
  );
}
