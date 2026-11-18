import { z } from "zod";
import { tourSchema } from "./validation";
import { sanitizeRichText } from "../rich-text";
const short = z.string().trim().min(1).max(250),
  body = z.string().trim().min(1).max(5000);
const localPath = z
  .string()
  .max(500)
  .regex(/^\/(?!\/)[a-zA-Z0-9/_?=&#.%+-]*$/);
const https = z
  .string()
  .url()
  .max(1000)
  .refine((v) => {
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "È richiesto un URL HTTPS");
const optionalText = (max: number) => z.string().trim().max(max).default("");
const articleHref = z.union([z.literal(""), localPath, https]);
export const blogBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    html: z.string().max(100000).transform(sanitizeRichText).optional(),
    heading: optionalText(250),
    text: z.string().trim().min(1).max(20000),
  }),
  z.object({
    type: z.literal("image"),
    imageUrl: tourSchema.shape.imageUrl,
    alt: optionalText(250),
    caption: optionalText(1000),
  }),
  z.object({
    type: z.literal("split"),
    heading: optionalText(250),
    text: z.string().trim().min(1).max(20000),
    imageUrl: tourSchema.shape.imageUrl,
    alt: optionalText(250),
    caption: optionalText(1000),
    imagePosition: z.enum(["left", "right"]).default("right"),
  }),
]);
export const blogArticleSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9:_-]+$/).max(220).optional(),
    canonicalPath: z.string().max(500).regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/).optional(),
    seoTitle: optionalText(250).optional(),
    seoDescription: optionalText(500).optional(),
    sourceUrl: z.string().url().optional(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200).optional(),
    slugAliases: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200)).max(100).optional(),
    updatedAt: z.string().datetime().optional(),
    title: short,
    caption: body,
    imageUrl: tourSchema.shape.imageUrl,
    imageAlt: optionalText(250),
    intro: optionalText(20000),
    blocks: z.array(blogBlockSchema).max(40).default([]),
    ctaEnabled: z.boolean().default(false),
    ctaLabel: optionalText(250),
    ctaHref: articleHref.default(""),
  })
  .superRefine((article, ctx) => {
    if (article.ctaEnabled) {
      if (!article.ctaLabel)
        ctx.addIssue({
          code: "custom",
          path: ["ctaLabel"],
          message: "Scrivi il testo del pulsante",
        });
      if (!article.ctaHref)
        ctx.addIssue({
          code: "custom",
          path: ["ctaHref"],
          message: "Indica il link del pulsante",
        });
    }
  });
export const siteContentSchema = z.object({
  contentVersion: z.literal(2).default(2),
  globals: z.object({
    brandName: short,
    description: body,
    email: z.string().email().max(254),
    phone: z.string().regex(/^\+[1-9][\d\s()-]{6,30}$/),
    whatsappNumber: z.string().regex(/^[1-9]\d{6,14}$/),
    address: short,
    supportHours: short,
    footerText: body,
    footerNote: body,
    tripAdvisorUrl: https.refine((v) =>
      /(^|\.)tripadvisor\.(com|it)$/.test(new URL(v).hostname),
    ),
    tripAdvisorTitle: short,
    tripAdvisorBody: body,
    socialLinks: z.array(z.object({ label: short, url: https })).max(10),
    navigation: z
      .array(z.object({ label: short, href: localPath }))
      .min(1)
      .max(12),
  }),
  home: z.object({
    carouselIntervalSeconds: z.number().int().min(3).max(30).optional(),
    heroImage: tourSchema.shape.imageUrl,
    heroTitle: short,
    heroEyebrow: z.string().trim().min(1).max(1000),
    heroBody: z.string().trim().min(1).max(30000),
    primaryLabel: short,
    primaryHref: localPath,
    secondaryLabel: short,
    toursEyebrow: short,
    toursTitle: short,
    toursBody: body,
    trustEyebrow: short,
    trustTitle: short,
    trustBody: body,
    galleryEyebrow: z.string().trim().min(1).max(1000),
    galleryTitle: short,
    galleryBody: z.string().trim().min(1).max(30000),
    answersTitle: short,
    answersBody: body,
    partnerEyebrow: short,
    partnerTitle: short,
    partnerBody: body,
    partnerLabel: short,
    faqTitle: short,
    faqEyebrow: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .default("Prima di prenotare"),
    faqBody: z
      .string()
      .trim()
      .min(1)
      .max(30000)
      .default(
        "Tutto quello che serve sapere prima di prenotare un tour a Praga.",
      ),
    stats: z.array(z.object({ value: short, label: short })).max(8),
    pillars: z.array(z.object({ title: short, text: body })).max(12),
    groups: z
      .array(
        z.object({
          title: short,
          subtitle: z.string().trim().max(250).default(""),
          items: z
            .array(z.object({ title: short, href: localPath }))
            .min(1)
            .max(6),
        }),
      )
      .max(6),
  }),
  gallery: z.array(blogArticleSchema).max(100),
  faqs: z.array(z.object({ q: short, a: body })).max(50),
  answers: z.array(z.object({ question: short, answer: body })).max(30),
});
