import { z } from "zod";
import type { PlatformState } from "./model";
import { localDateSchema, tourImageUrlSchema } from "./validation";
import { pragueLocal } from "./time";
export const partnerSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  name: z.string().trim().min(1).max(150),
  description: z.string().max(5000),
  imageUrl: z.union([z.literal(""), tourImageUrlSchema]),
  email: z.union([z.literal(""), z.string().email()]),
  phone: z.string().max(50),
  website: z
    .string()
    .url()
    .max(2000)
    .refine((v) => new URL(v).protocol === "https:", "Usa HTTPS"),
  published: z.boolean(),
});
export const partnerPeriodSchema = z
  .object({ from: localDateSchema, to: localDateSchema })
  .refine((v) => v.from <= v.to, "Intervallo non valido");
export function recordPartnerClick(
  s: PlatformState,
  partnerId: string,
  visitor: string,
  now = new Date().toISOString(),
) {
  const day = pragueLocal(now).slice(0, 10);
  s.partnerClicks ??= [];
  const previous = s.partnerClicks.find(
    (c) => c.partnerId === partnerId && c.day === day && c.visitor === visitor,
  );
  if (previous) previous.count++;
  else s.partnerClicks.push({ partnerId, visitor, day, count: 1 });
}
export { partnerStats } from "../partner-statistics";
export function csvCell(v: unknown) {
  return `"${String(v ?? "")
    .replace(/^[=+@-]/, "'")
    .replaceAll('"', '""')}"`;
}
