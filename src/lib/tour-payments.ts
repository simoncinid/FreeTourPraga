import type { Tour } from "./types";
export type TourPaymentMethod = "cash" | "bank_transfer";
export const paymentMethodLabels: Record<TourPaymentMethod, string> = {
  cash: "Contanti sul posto",
  bank_transfer: "Bonifico bancario",
};
export function paymentMethodsFor(
  tour: Pick<Tour, "paymentMethods" | "paymentInstructions">,
): TourPaymentMethod[] {
  return (tour.paymentMethods ?? ["cash"]).filter(
    (m) =>
      m === "cash" ||
      (m === "bank_transfer" && !!tour.paymentInstructions?.trim()),
  );
}
