import { z } from "zod";
import { sanitizeRichText } from "../rich-text";
const canonicalPathSchema = z
  .string()
  .max(500)
  .regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/);
export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const date = new Date(`${v}T12:00:00Z`);
    return (
      Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v
    );
  }, "Data non valida");
const text = (max = 200) => z.string().trim().min(1).max(max);
export const contentSectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    heading: z.string().max(250),
    text: z.string().max(20000),
  }),
  z.object({
    type: z.literal("image"),
    imageUrl: z.lazy(() => tourImageUrlSchema),
    alt: z.string().max(250),
    caption: z.string().max(1000),
  }),
  z.object({
    type: z.literal("split"),
    heading: z.string().max(250),
    text: z.string().max(20000),
    imageUrl: z.lazy(() => tourImageUrlSchema),
    alt: z.string().max(250),
    caption: z.string().max(1000),
    imagePosition: z.enum(["left", "right"]),
  }),
]);
export const commissionRuleSchema = z
  .object({
    affiliateType: z.string().trim().min(1).max(80),
    affiliateCode: z.string().max(40).optional(),
    product: z.enum(["free", "paid", "package"]),
    mode: z.enum(["fixed", "percent"]),
    value: z.number().min(0).max(10000000),
  })
  .refine(
    (v) => v.mode !== "percent" || v.value <= 100,
    "Percentuale massima 100",
  );
export const calendarOperationSchema = z
  .object({
    tourIds: z.array(z.string().max(200)).min(1).max(200),
    from: localDateSchema,
    to: localDateSchema,
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .default([0, 1, 2, 3, 4, 5, 6]),
    times: z
      .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/))
      .max(20)
      .default([]),
    action: z.enum(["open", "close", "capacity"]),
    capacity: z.number().int().min(1).max(10000).optional(),
  })
  .refine(
    (v) =>
      v.from <= v.to && Date.parse(v.to) - Date.parse(v.from) <= 366 * 86400000,
    "Intervallo massimo un anno",
  )
  .refine(
    (v) => v.action === "close" || v.capacity !== undefined,
    "Indica la capienza",
  );
export const itemSchema = z.object({
  tourSlug: text(),
  slotId: text(),
  adults: z.number().int().min(0).max(10000),
  participants: z
    .array(
      z.object({
        categoryId: z.string().max(80),
        quantity: z.number().int().min(0).max(10000),
      }),
    )
    .max(30)
    .optional(),
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
  paymentMethod: z.enum(["cash", "bank_transfer"]),
  affiliateCode: z.string().max(40).default(""),
  termsAccepted: z.literal(true),
  whatsappConsent: z.boolean().default(false),
});
const emailKindTemplateSchema = z.object({
  subject: text(200),
  text: z.string().trim().min(1).max(20000),
  html: z.string().trim().min(1).max(50000),
});
export const affiliateSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,40}$/),
  name: text(120),
  email: z.string().email(),
  type: z.string().trim().min(1).max(80),
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
  emailTemplates: z.object({
    confirmed: emailKindTemplateSchema,
    modified: emailKindTemplateSchema,
    cancelled: emailKindTemplateSchema,
    admin: z.object({
      subject: text(200),
      text: z.string().trim().min(1).max(20000),
    }),
  }),
  lastMinuteEnabled: z.boolean(),
  lastMinuteHours: z.number().min(1).max(168),
  lastMinuteDiscountPercent: z.number().min(0).max(100),
});
export const tourImageUrlSchema = z.string().refine((v) => {
  if (/^\/api\/media\/[-a-f0-9]{36}\.webp$/.test(v)) return true;
  if (
    /^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|webp|jpe?g|avif)$/.test(
      v,
    )
  )
    return true;
  if (
    v.startsWith("/wp-content/uploads/") &&
    !/[\\?#\u0000]/.test(v) &&
    !v.includes("..")
  )
    return true;
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
  currency: z.enum(["EUR", "CZK"]).optional(),
  priceCategories: z
    .array(
      z
        .object({
          id: z
            .string()
            .regex(/^[a-zA-Z0-9_-]+$/)
            .max(80),
          label: text(150),
          priceCents: z.number().int().min(0).max(10000000),
          minAge: z.number().int().min(0).max(120).optional(),
          maxAge: z.number().int().min(0).max(120).optional(),
          description: z.string().max(500).optional(),
        })
        .refine(
          (v) =>
            v.minAge === undefined ||
            v.maxAge === undefined ||
            v.minAge <= v.maxAge,
          "Età non valide",
        ),
    )
    .min(1)
    .max(30)
    .refine(
      (v) => new Set(v.map((c) => c.id)).size === v.length,
      "ID categoria duplicati",
    )
    .optional(),
  contentBlocks: z.array(contentSectionSchema).max(60).optional(),
  paymentMethods: z
    .array(z.enum(["cash", "bank_transfer"]))
    .min(1)
    .max(2)
    .optional(),
  paymentInstructions: z.string().max(5000).optional(),
  commissionPackageWith: z.array(z.string().max(200)).max(200).optional(),
  commissionRules: z.array(commissionRuleSchema).max(100).optional(),
  calendarRules: z
    .array(
      z.object({
        id: z.string(),
        from: localDateSchema,
        to: localDateSchema,
        weekdays: z.array(z.number().int().min(0).max(6)),
        times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
        action: z.enum(["open", "close", "capacity"]),
        capacity: z.number().int().min(1).max(10000).optional(),
      }),
    )
    .max(1000)
    .optional(),
  freeGroupLimit: z.number().int().min(0).max(10000).optional(),
  freeGroupMode: z.enum(["fixed", "contact", "none"]).optional(),
  freeGroupPriceCents: z.number().int().min(0).max(10000000).optional(),
  arrivalMinutes: z.number().int().min(0).max(240).optional(),
  operatingDays: z.string().max(250).optional(),
  departureTime: z.string().max(50).optional(),
  onlineDiscounts: z.boolean().optional(),
  id: text(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: text(),
  category: text(),
  shortDescription: text(1000),
  description: text(20000),
  descriptionHtml: z
    .string()
    .max(100000)
    .transform(sanitizeRichText)
    .optional(),
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
  mapUrl: z
    .string()
    .url()
    .refine((v) => {
      const u = new URL(v);
      return (
        u.protocol === "https:" &&
        [
          "www.google.com",
          "google.com",
          "maps.google.com",
          "maps.app.goo.gl",
          "goo.gl",
        ].includes(u.hostname)
      );
    }, "Usa un link Google Maps"),
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
  maxGuests: z.number().int().min(1).max(10000),
  isFreeTour: z.boolean().optional(),
  closures: z
    .array(
      z.object({
        date: localDateSchema,
        times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).max(10),
      }),
    )
    .max(500)
    .optional(),
  walkingLabel: z.string().trim().min(1).max(80).optional(),
  cancellationHours: z.number().min(0).max(720).optional(),
  lateRefundPercent: z.number().min(0).max(100).optional(),
  reminderHours: z.number().min(1).max(168).optional(),
  reminderTemplate: z.string().max(10000).optional(),
  schedule: z
    .object({
      enabled: z.boolean(),
      from: localDateSchema,
      to: localDateSchema,
      weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
      times: z
        .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/))
        .min(1)
        .max(10)
        .refine((v) => new Set(v).size === v.length, "Orari duplicati"),
      capacity: z.number().int().min(1).max(10000),
    })
    .refine((v) => v.from <= v.to, "La fine precede l’inizio")
    .optional(),
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
        capacity: z.number().int().min(1).max(10000),
        reserved: z.number().int().min(0),
        closed: z.boolean().optional(),
      }),
    )
    .max(5000),
});
export const pageSchema = z.object({
  benefits: z
    .array(z.object({ title: z.string().max(250), text: z.string().max(5000) }))
    .max(30)
    .optional(),
  contentBlocks: z.array(contentSectionSchema).max(60).optional(),
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
