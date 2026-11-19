"use client";

import { useState } from "react";
import { QuickBooking } from "@/components/QuickBooking";
import type { Tour } from "@/lib/types";

export function TourMobileBooking({ tour }: { tour: Tour }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="tour-mobile-booking button-primary"
        onClick={() => setOpen(true)}
      >
        Prenota questo tour
      </button>
      {open && (
        <QuickBooking
          tour={tour}
          sheet
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
