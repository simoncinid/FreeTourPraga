import { z } from "zod";
import { partnerSchema } from "./partners";
import { jsonEqual } from "../json-equal";
import {
  readContentPath,
  writeContentPath,
  type ContentBinding,
} from "../visual-content";
import { siteContent, mergeContentPages } from "./content";
import { siteContentSchema } from "./content-validation";
import { pageSchema } from "./validation";
import { HttpError } from "./security";
import { prepareArticles } from "../article-urls";
import type { PlatformState } from "./model";
export const visualPatchSchema = z.object({
  patches: z
    .array(
      z.object({
        binding: z.object({
          scope: z.enum(["site", "page", "article", "partner"]),
          key: z.string().max(700).optional(),
          path: z
            .array(
              z
                .string()
                .max(100)
                .regex(/^[a-zA-Z0-9_-]+$/)
                .refine(
                  (k) => !["__proto__", "prototype", "constructor"].includes(k),
                ),
            )
            .min(1)
            .max(8),
        }),
        expected: z.unknown().optional(),
        value: z.unknown().optional(),
      }),
    )
    .min(1)
    .max(500),
});
function allowed(b: ContentBinding) {
  const p = b.path.join(".");
  if (b.scope === "partner")
    return /^(name|description|imageUrl|email|phone|website)$/.test(p);
  if (b.scope === "page")
    return /^(title|subtitle|body|bodyHtml|seoTitle|seoDescription|contentBlocks|benefits)(\.|$)/.test(
      p,
    );
  if (b.scope === "article")
    return /^(title|caption|imageUrl|imageAlt|intro|introHtml|blocks|ctaEnabled|ctaLabel|ctaHref|seoTitle|seoDescription)(\.|$)/.test(
      p,
    );
  return (
    /^(home|answers|faqs|formattedText)(\.|$)/.test(p) ||
    /^globals\.(brandName|description|email|phone|whatsappNumber|address|supportHours|footerText|footerNote|tripAdvisorUrl|tripAdvisorTitle|tripAdvisorBody|socialLinks|officeAddress|castleMeetingAddress|googleReviewUrl|instagramDirectUrl|navigation|navigationVersion)(\.|$)/.test(
      p,
    )
  );
}
export function applyVisualPatches(
  s: PlatformState,
  input: z.infer<typeof visualPatchSchema>,
) {
  const content = structuredClone(siteContent(s.siteContent, s.pages));
  const previous = structuredClone(content);
  const pages = structuredClone(mergeContentPages(s.pages, content));
  const touched = new Set<string>();
  const partners = structuredClone(s.partners ?? []),
    touchedPartners = new Set<string>();
  for (const patch of input.patches) {
    const b = patch.binding;
    if (!allowed(b))
      throw new HttpError(400, "Elemento non modificabile da questo editor");
    const target =
      b.scope === "site"
        ? content
        : b.scope === "page"
          ? pages[b.key || ""]
          : b.scope === "partner"
            ? partners.find((p) => p.id === b.key && !p.deleted)
            : content.gallery.find((a) => a.id === b.key);
    if (!target) throw new HttpError(404, "Contenuto non trovato");
    for (const arrayField of ["blocks", "contentBlocks", "benefits"]) {
      const i = b.path.indexOf(arrayField);
      if (i >= 0) {
        const index = b.path[i + 1];
        if (
          !index ||
          !/^\d+$/.test(index) ||
          b.path.length !== i + 3 ||
          b.path.at(-1) === "type" ||
          !readContentPath(target, b.path.slice(0, i + 2))
        )
          throw new HttpError(
            400,
            "La struttura delle sezioni è fissa: puoi modificare soltanto i contenuti esistenti",
          );
      }
    }

    if (!jsonEqual(readContentPath(target, b.path), patch.expected))
      throw new HttpError(
        409,
        "Questo contenuto è stato modificato da un’altra sessione. Ricarica la pagina prima di salvare.",
      );
    writeContentPath(target, b.path, patch.value);
    if (b.scope === "page") touched.add(b.key!);
    if (b.scope === "partner") touchedPartners.add(b.key!);
  }
  for (const key of touched) {
    pages[key] = pageSchema.parse({ ...pages[key], published: true });
  }
  const parsed = siteContentSchema.parse(content);
  parsed.gallery = prepareArticles(previous.gallery, parsed.gallery);
  // Global meeting point changes follow the same operational rules as the structured editor.
  if (
    parsed.globals.castleMeetingAddress !==
    previous.globals.castleMeetingAddress
  ) {
    const castle = s.tours.find((t) => t.slug === "interni-castello-praga");
    const address = parsed.globals.castleMeetingAddress?.trim() || "";
    if (castle) {
      castle.meetingAddress = address;
      castle.mapUrl = address
        ? "https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7"
        : "";
      castle.mapEmbedUrl = address
        ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
        : "";
      castle.operationalReviewRequired = !address;
    }
  }
  if (touchedPartners.size)
    s.partners = partners.map((p) =>
      touchedPartners.has(p.id) ? { ...p, ...partnerSchema.parse(p) } : p,
    );
  s.siteContent = parsed;
  s.pages = pages;
  return { fields: input.patches.length, pages: [...touched] };
}
