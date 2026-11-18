import { z } from "zod";
import { sanitizeRichText } from "../rich-text";
const canonicalPathSchema = z.string().max(500).regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/);
export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
  const date = new Date(`${v}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v;
}, "Data non valida");
const text = (max = 200) => z.string().trim().min(1).max(max);
export const itemSchema = z.object({
  tourSlug: text(),
  slotId: text(),
  adults: z.number().int().min(1).max(100),
  children: z.number().int().min(0).max(100).default(0),
  infants: z.number().int().min(0).max(100).default(0),
});
export const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1).max(10),
  name: text(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Usa il formato internazionale, es. +393331234567",
    ),
  notes: z.string().max(2000).default(""),
  paymentMethod: z.enum(["cash", "stripe"]),
  affiliateCode: z.string().max(40).default(""),
  termsAccepted: z.literal(true),
  whatsappConsent: z.boolean().default(false),
});
export const affiliateSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,40}$/),
  name: text(120),
  email: z.string().email(),
  type: z.enum(["hotel", "guide", "promoter", "agency"]),
  commissionPercent: z.number().min(0).max(100),
  active: z.boolean(),
  wpId: z.number().int().positive().optional(),
});
export const settingsSchema = z.object({
  multiTourPercent: z.number().min(0).max(100),
  minimumTours: z.number().int().min(2).max(10),
  cancellationHours: z.number().min(0).max(720),
  lateRefundPercent: z.number().min(0).max(100),
  retentionDays: z.number().int().min(30).max(3650),
  emailFooter: text(1000),
  reminderHours: z.number().min(1).max(168),
  googleAdsId: z.string().regex(/^(AW-\d+)?$/),
  googleAdsLabel: z.string().max(100),
});
export const tourImageUrlSchema = z.string().refine((v) => {
  if (/^\/api\/media\/[-a-f0-9]{36}\.webp$/.test(v)) return true;
  if (v.startsWith("/wp-content/uploads/") && !/[\\?#\u0000]/.test(v) && !v.includes("..")) return true;
  try {
    const u = new URL(v);
    return (
      u.protocol === "https:" &&
      (u.hostname === "images.unsplash.com" ||
        (!!process.env.MEDIA_PUBLIC_BASE &&
          u.origin === new URL(process.env.MEDIA_PUBLIC_BASE).origin))
    );
  } catch {
    return false;
  }
}, "Usa una foto caricata o un URL immagini autorizzato");
export const tourSchema = z.object({
  id: text(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: text(),
  category: text(),
  shortDescription: text(1000),
  description: text(20000),
  descriptionHtml: z.string().max(100000).transform(sanitizeRichText).optional(),
  canonicalPath: canonicalPathSchema.optional(),
  sourceUrl: z.string().url().optional(),
  sourceUpdatedAt: z.string().datetime().optional(),
  priceLabel: z.string().max(250).optional(),
  importedFromWordpress: z.boolean().optional(),
  operationalReviewRequired: z.boolean().optional(),
  imageUrl: tourImageUrlSchema,
  galleryImages: z
    .array(
      z.object({
        url: tourImageUrlSchema,
        alt: z.string().trim().max(250).default(""),
      }),
    )
    .max(20)
    .optional(),
  meetingPoint: text(),
  meetingAddress: text(),
  mapUrl: z.string().url().refine((v) => { const u = new URL(v); return u.protocol === "https:" && ["www.google.com", "google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"].includes(u.hostname); }, "Usa un link Google Maps"),
  mapEmbedUrl: z
    .string()
    .url()
    .refine((v) => new URL(v).hostname === "www.google.com"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  durationMinutes: z.number().int().min(15).max(1440),
  basePriceCents: z.number().int().min(0).max(10000000),
  childPriceCents: z.number().int().min(0).max(10000000),
  infantPriceCents: z.number().int().min(0).max(10000000),
  maxGuests: z.number().int().min(1).max(25),
  isFreeTour: z.boolean().optional(),
  closures: z.array(z.object({ date: localDateSchema, times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).max(10) })).max(500).optional(),
  walkingLabel: z.string().trim().min(1).max(80).optional(),
  cancellationHours: z.number().min(0).max(720).optional(),
  lateRefundPercent: z.number().min(0).max(100).optional(),
  reminderHours: z.number().min(1).max(168).optional(),
  reminderTemplate: z.string().max(10000).optional(),
  schedule: z.object({
    enabled: z.boolean(), from: localDateSchema, to: localDateSchema,
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(10).refine((v) => new Set(v).size === v.length, "Orari duplicati"),
    capacity: z.number().int().min(1).max(25),
  }).refine((v) => v.from <= v.to, "La fine precede l’inizio").optional(),
  walkingDifficulty: z.number().min(1).max(5),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  language: text(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.array(z.string()).optional(),
  highlights: z.array(text(1000)).max(30),
  highlightGalleries: z
    .array(z.array(tourImageUrlSchema).max(4))
    .max(30)
    .optional(),
  inclusions: z.array(text(1000)).max(30),
  safetyNotes: z.array(text(1000)).max(30),
  published: z.boolean(),
  adultMinAge: z.number().int().min(1).max(99),
  childMinAge: z.number().int().min(0).max(99),
  bookingCutoffHours: z.number().min(0).max(168),
  guide: z.string().max(120),
  otaAliases: z.array(z.string().max(300)).max(30).optional(),
  slots: z
    .array(
      z.object({
        id: text(),
        tourId: text(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        capacity: z.number().int().min(1).max(25),
        reserved: z.number().int().min(0),
        closed: z.boolean().optional(),
      }),
    )
    .max(5000),
});
export const pageSchema = z.object({
  canonicalPath: canonicalPathSchema.optional(),
  bodyHtml: z.string().max(100000).transform(sanitizeRichText).optional(),
  updatedAt: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  title: text(250),
  subtitle: z.string().max(1000),
  body: z.string().max(30000),
  seoTitle: z.string().max(200),
  seoDescription: z.string().max(500),
  published: z.boolean(),
});
