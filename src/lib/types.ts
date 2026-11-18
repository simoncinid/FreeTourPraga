export type AgeBand = "adults" | "children" | "infants";

export type PaymentMethod = "cash" | "stripe";

export type BookingStatus =
  "pending" | "confirmed" | "cancelled" | "modified" | "no_show" | "present";

export type PaymentStatus =
  "not_required" | "pending" | "paid" | "failed" | "refunded";

export type TourPhoto = { url: string; alt: string };

export type Tour = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  descriptionHtml?: string;
  canonicalPath?: string;
  sourceUrl?: string;
  sourceUpdatedAt?: string;
  priceLabel?: string;
  importedFromWordpress?: boolean;
  operationalReviewRequired?: boolean;
  imageUrl: string;
  galleryImages?: TourPhoto[];
  meetingPoint: string;
  meetingAddress: string;
  mapUrl: string;
  mapEmbedUrl: string;
  latitude: number;
  longitude: number;
  durationMinutes: number;
  basePriceCents: number;
  childPriceCents: number;
  infantPriceCents: number;
  adultMinAge?: number;
  childMinAge?: number;
  maxGuests: number;
  isFreeTour?: boolean;
  closures?: { date: string; times: string[] }[];
  walkingLabel?: string;
  cancellationHours?: number;
  lateRefundPercent?: number;
  reminderHours?: number;
  reminderTemplate?: string;
  schedule?: {
    enabled: boolean;
    from: string;
    to: string;
    weekdays: number[];
    times: string[];
    capacity: number;
  };
  walkingDifficulty: number;
  rating: number;
  reviewCount: number;
  language: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  highlights: string[];
  /** Foto per ogni punto saliente, allineate a `highlights` (max 4 URL a riga). */
  highlightGalleries?: string[][];
  inclusions: string[];
  safetyNotes: string[];
  slots: TourSlot[];
};

export type TourSlot = {
  id: string;
  tourId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reserved: number;
  closed?: boolean;
};

export type BookingFormInput = {
  tourSlug: string;
  slotId: string;
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  infants: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  affiliateCode?: string;
};

export type BookingRecord = BookingFormInput & {
  id: string;
  pnr: string;
  tourTitle: string;
  startsAt: string;
  totalGuests: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  stripePaymentUrl?: string;
  selfServiceUrl: string;
  calendarUrl: string;
  createdAt: string;
};
