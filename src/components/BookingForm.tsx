"use client";
import { QuickBooking } from "./QuickBooking";
import type { Tour } from "@/lib/types";
export function BookingForm({ tour }: { tour: Tour }) {
  return <aside id="prenota" className="tour-booking-form sticky top-24 self-start"><QuickBooking tour={tour} inline onClose={() => {}} /></aside>;
}
