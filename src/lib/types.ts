export type AgeBand = "adults" | "children" | "infants";

export type PaymentMethod = "cash" | "bank_transfer" | "stripe";

export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "cancelled"
  | "modified"
  | "no_show"
  | "present";

export type PaymentStatus =
  | "not_required"
  | "pending"
  | "contacted"
  | "paid"
  | "failed"
  | "refunded";

export type TourPhoto = { url: string; alt: string };

export type PriceCategory = {
  id: string;
  label: string;
  priceCents: number;
  estimatedEuroCents?: number;
  minAge?: number;
  maxAge?: number;
  description?: string;
};
export type ParticipantSelection = { categoryId: string; quantity: number };
export type CommissionRule = {
  affiliateType: string;
  affiliateCode?: string;
  product: "free" | "paid" | "package";
  mode: "fixed" | "percent";
  value: number;
};
export type ContentSectionBlock =
  | { type: "text"; heading: string; headingHtml?: string; text: string; html?: string }
  | { type: "image"; imageUrl: string; alt: string; caption: string; captionHtml?: string }
  | {
      type: "split";
      heading: string;
      headingHtml?: string;
      text: string;
      html?: string;
      imageUrl: string;
      alt: string;
      caption: string;
      captionHtml?: string;
      imagePosition: "left" | "right";
    };
export type CalendarRule = {
  id: string;
  from: string;
  to: string;
  weekdays: number[];
  times: string[];
  action: "open" | "close" | "capacity" | "remove";
  capacity?: number;
  actor?: string;
  at?: string;
};
export type SeasonalOffer = {
  id: string;
  from: string;
  to: string;
  percent: number;
};
export type Tour = {
  hiddenText?: string[];
  paymentMethods?: ("cash" | "bank_transfer")[];
  paymentInstructions?: string;
  /** Explicit eligible companion tours; multiple rows alone never imply a package. */
  commissionPackageWith?: string[];
  currency?: "EUR" | "CZK";
  priceCategories?: PriceCategory[];
  contentBlocks?: ContentSectionBlock[];
  commissionRules?: CommissionRule[];
  calendarRules?: CalendarRule[];
  calendarLog?: { at: string; actor: string; from: string; to: string }[];
  seasonalOffers?: SeasonalOffer[];
  bookingCutoffMinutes?: number;
  minParticipants?: number;
  petsAllowed?: boolean;
  architecturalBarriers?: boolean;
  freeGroupLimit?: number;
  freeGroupMode?: "fixed" | "contact" | "none";
  freeGroupPriceCents?: number;
  arrivalMinutes?: number;
  operatingDays?: string;
  departureTime?: string;
  onlineDiscounts?: boolean;
  cardPreview?: {
    title?: string;
    description?: string;
    itinerary?: string;
    facts?: string[];
    itineraryLabel?: string;
    pricesLabel?: string;
    bookLabel?: string;
    detailsLabel?: string;
  };
  formattedCopy?: {
    labels?: Record<string, string>;
    title?: string;
    shortDescription?: string;
    meetingPoint?: string;
    meetingAddress?: string;
    meetingInstructions?: string;
    fareRequirements?: string;
    cancellationClause?: string;
    highlights?: (string | null)[];
    inclusions?: (string | null)[];
    exclusions?: (string | null)[];
    safetyNotes?: (string | null)[];
  };
  /** Etichette e copy UI della pagina dettaglio tour (fallback ai testi italiani fissi). */
  detailCopy?: {
    priceLabel?: string;
    pricePersonLabel?: string;
    guidePrefix?: string;
    navDescrizione?: string;
    navItinerario?: string;
    navInfo?: string;
    navCancellazione?: string;
    navIncontro?: string;
    navRecensioni?: string;
    headingDescrizione?: string;
    headingItinerario?: string;
    headingInfo?: string;
    headingIncluso?: string;
    headingEscluso?: string;
    headingPratiche?: string;
    headingCancellazione?: string;
    headingRecensioni?: string;
    whatsappTitle?: string;
    whatsappBody?: string;
    whatsappCta?: string;
  };
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
  meetingInstructions?: string;
  mapUrl: string;
  mapEmbedUrl: string;
  latitude: number;
  longitude: number;
  durationMinutes: number;
  durationLabel?: string;
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
  /** Clausola testo libero; vuota → usa la clausola globale. */
  cancellationClause?: string;
  bookingCutoffHours?: number;
  advanceBookingHours?: number;
  fareRequirements?: string;
  suggestedContribution?: string;
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
  /** Sigla operativa (FT, CM, …). Vuota = dedotta da titolo e slug. */
  code?: string;
  /** Nome della guida mostrato in card. Vuoto = riga Guida nascosta (la lingua è già in meta). */
  guide?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  highlights: string[];
  itineraryGroups?: { title: string; titleHtml?: string; start: number }[];
  /** Foto per ogni punto saliente, allineate a `highlights` (max 4 URL a riga). */
  highlightGalleries?: string[][];
  inclusions: string[];
  exclusions?: string[];
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
  removed?: boolean;
  calendarBase?: { capacity: number; closed?: boolean };
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
