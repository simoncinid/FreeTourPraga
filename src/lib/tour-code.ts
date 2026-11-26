/** Ordine fisso delle nomenclature ufficiali (v5/v6). */
export const TOUR_CODE_ORDER = [
  "FT",
  "FC",
  "CM",
  "CN",
  "PE",
  "CB",
  "MS",
  "CI",
  "TZ",
  "PRIV",
] as const;

type CodedTour = {
  code?: string;
  slug?: string;
  title?: string;
  category?: string;
};

export function inferredTourCode(tour: CodedTour) {
  const explicit = tour.code?.trim().toUpperCase() || "";
  if (explicit) return explicit;
  const blob = `${tour.slug || ""} ${tour.title || ""} ${tour.category || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/privat/.test(blob)) return "PRIV";
  if (/terez/.test(blob)) return "TZ";
  if (/interni/.test(blob) && /castell/.test(blob)) return "CI";
  if (/strahov|petrin|monaster/.test(blob)) return "MS";
  if (/comunism|bunker/.test(blob)) return "CB";
  if (/esoter|alchim/.test(blob)) return "PE";
  if (/nuova/.test(blob)) return "CN";
  if (/castell/.test(blob) && /mala|strana/.test(blob)) return "CM";
  if (/free/.test(blob)) return "FT";
  return "";
}

export function tourCodeRank(code: string) {
  const index = TOUR_CODE_ORDER.indexOf(
    code as (typeof TOUR_CODE_ORDER)[number],
  );
  return index === -1 ? TOUR_CODE_ORDER.length : index;
}

export function tourCodeSort(a: CodedTour, b: CodedTour) {
  const rank = tourCodeRank(inferredTourCode(a)) - tourCodeRank(inferredTourCode(b));
  if (rank) return rank;
  return (a.title || "").localeCompare(b.title || "", "it");
}

export function tourFilterLabel(tour: CodedTour & { title: string }) {
  const code = inferredTourCode(tour);
  return code ? `${code} / ${tour.title}` : tour.title;
}
