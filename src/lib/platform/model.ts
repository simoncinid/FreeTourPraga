import type { SiteContent } from "./content";
import type { Tour } from "../types";
export type CatalogTour = Tour & {
  published: boolean;
  adultMinAge: number;
  childMinAge: number;
  bookingCutoffHours: number;
  guide: string;
  otaAliases?: string[];
};
export type Reservation = {
  id: string;
  pnr: string;
  orderId: string;
  tourSlug: string;
  slotId: string;
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  infants: number;
  policy?: { cancellationHours: number; lateRefundPercent: number };
  bookingNote?: string;
  unitAdultCents?: number;
  unitChildCents?: number;
  unitInfantCents?: number;
  totalGuests: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  /** Storico: solo "cash" in Fase 1; stripe/ota restano per prenotazioni legacy. */
  paymentMethod: "cash" | "stripe" | "ota";
  paymentStatus: "pending" | "paid" | "refunded" | "not_required" | "failed";
  status: "confirmed" | "pending" | "cancelled" | "present" | "no_show";
  source: string;
  affiliateCode: string;
  commissionCents: number;
  commissionPaid: boolean;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  notes: string;
  cancellationReason?: string;
  refundCents?: number;
  refundStatus?: string;
  /** Legacy; i reminder WhatsApp non sono attivi in Fase 1. */
  whatsappConsent: boolean;
  consentAt: string;
  termsVersion: string;
  calendarSequence?: number;
  lastMinuteApplied?: boolean;
};
export type Order = {
  id: string;
  key: string;
  fingerprint: string;
  pnrs: string[];
  token: string;
  totalCents: number;
  paymentUrl?: string;
  stripeSessionId?: string;
  paymentIntentId?: string;
  expiresAt: string;
  createdAt: string;
};
export type Job = {
  id: string;
  key: string;
  type: "email" | "whatsapp" | "refund";
  bookingPnr?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  calendar?: string;
  bcc?: string;
  orderId?: string;
  amount?: number;
  status: "queued" | "running" | "sent" | "failed";
  attempts: number;
  runAt: string;
  leaseUntil?: string;
  error?: string;
  providerId?: string;
};
export type EmailKindTemplate = {
  subject: string;
  text: string;
  html: string;
};
export type EmailTemplates = {
  confirmed: EmailKindTemplate;
  modified: EmailKindTemplate;
  cancelled: EmailKindTemplate;
  admin: { subject: string; text: string };
};
export type Affiliate = {
  code: string;
  name: string;
  email: string;
  type: "hotel" | "guide" | "promoter" | "agency";
  commissionPercent: number;
  active: boolean;
  /** ID numerico legacy WordPress Affiliates (`?affiliates=ID`). */
  wpId?: number;
};
export type ContentPage = {
  canonicalPath?: string;
  bodyHtml?: string;
  updatedAt?: string;
  sourceUrl?: string;
  title: string;
  subtitle: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
};
export type Settings = {
  multiTourPercent: number;
  minimumTours: number;
  cancellationHours: number;
  lateRefundPercent: number;
  retentionDays: number;
  emailFooter: string;
  emailTemplates: EmailTemplates;
  lastMinuteEnabled: boolean;
  /** Finestra (ore prima della partenza) in cui vale il listino last-minute. */
  lastMinuteHours: number;
  lastMinuteDiscountPercent: number;
};
export type OtaMessage = {
  id: string;
  provider: "civitatis" | "getyourguide";
  reference: string;
  raw: string;
  status: "review" | "imported" | "rejected";
  error?: string;
  pnr?: string;
  createdAt: string;
};
export type PlatformState = {
  seoEditorialRevision?: string;
  version: number;
  closedDates?: string[];
  siteContent?: SiteContent;
  tours: CatalogTour[];
  bookings: Reservation[];
  orders: Order[];
  jobs: Job[];
  affiliates: Affiliate[];
  pages: Record<string, ContentPage>;
  settings: Settings;
  ota: OtaMessage[];
  inquiries: {
    id: string;
    name: string;
    email: string;
    message: string;
    type: string;
    createdAt: string;
    status: string;
  }[];
  audit: {
    id: string;
    actor: string;
    action: string;
    target: string;
    at: string;
  }[];
  rateLimits: Record<string, { count: number; resetAt: number }>;
  events: string[];
};
