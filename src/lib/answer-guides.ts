import { guidePath } from "@/lib/public-paths";
import type { SiteContent } from "@/lib/platform/content";

type Guide = SiteContent["gallery"][number];
type Answer = SiteContent["answers"][number];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("it")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Solo collegamenti chiari domanda → articolo blog.
 * Evita match deboli (orario, durata, lingua) dove non esiste una guida dedicata.
 */
const QUESTION_TO_ARTICLE: { test: RegExp; prefer: RegExp }[] = [
  {
    test: /citt[aà] vecchia|quartiere ebraico|orologio/i,
    prefer: /josefov|quartiere ebraico|citt[aà] vecchia di praga|orologio astronomico|ponte carlo/i,
  },
  {
    test: /che cos.?è il free tour/i,
    prefer: /citt[aà] vecchia di praga|ponte carlo/i,
  },
  {
    test: /prenotare|completare la visita/i,
    prefer: /mal[aá] strana|castello/i,
  },
  {
    test: /cambio|euro.?corona|pagamenti/i,
    prefer: /cambio|corona|pagamenti/i,
  },
  {
    test: /aeroporto|raggiunger/i,
    prefer: /aeroporto|raggiunger/i,
  },
  {
    test: /mangiare|ristoranti/i,
    prefer: /mangiare|ristoranti/i,
  },
];

function isBlogGuide(guide: Guide) {
  return Boolean(guide.slug || guide.canonicalPath);
}

function scoreAgainstRule(
  guide: Guide,
  prefer: RegExp,
  question: string,
  haystack: string,
) {
  if (!isBlogGuide(guide)) return 0;
  if (!prefer.test(guide.title)) return 0;
  const title = normalize(guide.title);
  const q = normalize(question);
  let score = 20;
  for (const word of title.split(/\s+/).filter((w) => w.length > 5)) {
    if (q.includes(word)) score += 8;
    else if (haystack.includes(word)) score += 2;
  }
  // Se la domanda parla del quartiere ebraico, preferisci Josefov all'Orologio.
  if (/ebraico|josefov/.test(q) && /josefov|ebraico/.test(title)) score += 16;
  if (/orologio/.test(q) && /orologio/.test(title)) score += 16;
  score += Math.min(title.length / 20, 5);
  return score;
}

export function guideForAnswer(item: Answer, gallery: Guide[]) {
  const rule = QUESTION_TO_ARTICLE.find((entry) => entry.test.test(item.question));
  if (!rule) return null;

  const haystack = normalize(`${item.question} ${item.answer}`);
  let best: Guide | null = null;
  let bestScore = 0;
  for (const guide of gallery) {
    const score = scoreAgainstRule(guide, rule.prefer, item.question, haystack);
    if (score > bestScore) {
      best = guide;
      bestScore = score;
    }
  }
  if (!best) return null;
  return { guide: best, href: guidePath(best), score: bestScore };
}
