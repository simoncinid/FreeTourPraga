import type { SiteContent } from "./content";
import type { ContentSectionBlock, CommissionRule, Tour } from "../types";
export type CatalogTour = Tour & {
  published: boolean;
  archivedAt?: string;
  adultMinAge: number;
  childMinAge: number;
  bookingCutoffHours: number;
  guide: string;
  otaAliases?: string[];
};
export type Reservation = {
  currency?: "EUR" | "CZK";
  categorySnapshot?: {
    id: string;
    label: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  commissionRuleSnapshot?: CommissionRule;
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
  paymentInstructions?: string;
  paymentMethod: "cash" | "bank_transfer" | "stripe" | "ota" | "whatsapp";
  paymentStatus: "pending" | "paid" | "refunded" | "not_required" | "failed";
  status:
    | "confirmed"
    | "pending"
    | "awaiting_payment"
    | "cancelled"
    | "present"
    | "no_show";
  source: string;
  affiliateCode: string;
  commissionCents: number;
  commissionPaid: boolean;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  notes: string;
  notesHtml?: string;
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
  currency?: "EUR" | "CZK";
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
  replyTo?: string;
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
  expired: EmailKindTemplate;
  refunded: EmailKindTemplate;
  admin: { subject: string; text: string };
};
export type Affiliate = {
  code: string;
  name: string;
  email: string;
  type: string;
  commissionPercent: number;
  active: boolean;
  /** ID numerico legacy WordPress Affiliates (`?affiliates=ID`). */
  wpId?: number;
};
export type ContentPage = {
  benefits?: { title: string; text: string }[];
  contentBlocks?: ContentSectionBlock[];
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
  paymentHoldMinutes: number;
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
export type EuropeanPartner = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  email: string;
  phone: string;
  website: string;
  published: boolean;
  deleted?: boolean;
};
export type PartnerClick = {
  partnerId: string;
  day: string;
  visitor: string;
  count: number;
};
export type PlatformState = {
  partners?: EuropeanPartner[];
  partnerClicks?: PartnerClick[];
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
    phone?: string;
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
  notices?: { id: string; text: string; at: string }[];
  tickets?: {
    id: string;
    title: string;
    body: string;
    status: "open" | "working" | "done";
    at: string;
    updatedAt: string;
  }[];
  rateLimits: Record<string, { count: number; resetAt: number }>;
  events: string[];
};
