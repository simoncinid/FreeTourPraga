import { faqs, trustPillars } from "../data";
import { aiQuestions } from "../ai-content";
import { site, socialLinks, tripAdvisor } from "../site";
import type { ContentPage } from "./model";
import { guideSlug } from "../public-paths";

export const CONTENT_PAGE_KEYS = [
  "homepage",
  "chi-siamo",
  "informazioni-utili",
  "blog",
  "catalogo",
  "tour-privati",
  "partner-europa",
  "faq",
  "contatti",
  "privacy",
  "termini",
] as const;
export type BlogBlock =
  | { type: "text"; heading: string; text: string; html?: string }
  | { type: "image"; imageUrl: string; alt: string; caption: string }
  | {
      type: "split";
      heading: string;
      text: string;
      imageUrl: string;
      alt: string;
      caption: string;
      imagePosition: "left" | "right";
    };

export type SiteContent = {
  contentVersion?: 2;
  globals: {
    brandName: string;
    description: string;
    email: string;
    phone: string;
    whatsappNumber: string;
    address: string;
    supportHours: string;
    footerText: string;
    footerNote: string;
    tripAdvisorUrl: string;
    tripAdvisorTitle: string;
    tripAdvisorBody: string;
    socialLinks: { label: string; url: string }[];
    navigation: { label: string; href: string }[];
  };
  home: {
    carouselIntervalSeconds?: number;
    heroImage: string;
    heroTitle: string;
    heroEyebrow: string;
    heroBody: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    toursEyebrow: string;
    toursTitle: string;
    toursBody: string;
    trustEyebrow: string;
    trustTitle: string;
    trustBody: string;
    galleryEyebrow: string;
    galleryTitle: string;
    galleryBody: string;
    answersTitle: string;
    answersBody: string;
    partnerEyebrow: string;
    partnerTitle: string;
    partnerBody: string;
    partnerLabel: string;
    faqTitle: string;
    faqEyebrow: string;
    faqBody: string;
    stats: { value: string; label: string }[];
    pillars: { title: string; text: string }[];
    groups: {
      title: string;
      subtitle: string;
      items: { title: string; href: string }[];
    }[];
  };
  gallery: {
    id?: string;
    slug?: string;
    slugAliases?: string[];
    updatedAt?: string;
    canonicalPath?: string;
    seoTitle?: string;
    seoDescription?: string;
    sourceUrl?: string;
    title: string;
    caption: string;
    imageUrl: string;
    imageAlt?: string;
    intro?: string;
    blocks?: BlogBlock[];
    ctaEnabled?: boolean;
    ctaLabel: string;
    ctaHref: string;
  }[];
  faqs: { q: string; a: string }[];
  answers: { question: string; answer: string }[];
};
export function defaultSiteContent(): SiteContent {
  return {
    contentVersion: 2,
    globals: {
      brandName: site.name,
      description: site.description,
      email: site.email,
      phone: site.phone,
      whatsappNumber: site.whatsappNumber,
      address: site.address,
      supportHours: site.supportHours,
      footerText:
        "Tour guidati in italiano, gruppi ristretti e prenotazione semplice.",
      footerNote:
        "Un riferimento locale prima, durante e dopo il tuo viaggio a Praga.",
      tripAdvisorUrl: tripAdvisor.profileUrl,
      tripAdvisorTitle: "Dicono di noi",
      tripAdvisorBody: "Le parole di chi ha esplorato Praga con FreeTourPraga.",
      socialLinks: structuredClone(socialLinks),
      navigation: [
        { label: "I Nostri Tour", href: "/tour" },
        { label: "Chi siamo", href: "/chi-siamo" },
        { label: "Informazioni utili", href: "/informazioni-utili" },
        { label: "Contatti", href: "/contatti" },
        { label: "Partner tour in Europa", href: "/partner-europa" },
        { label: "Blog", href: "/blog" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    home: {
      heroImage:
        "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1800&q=85",
      heroTitle: "Scopri l'anima autentica di Praga, in totale sicurezza.",
      heroEyebrow: "Tour guidati in italiano a Praga",
      heroBody:
        "Esplora la capitale ceca con guide locali esperte al tuo fianco. Prenotazione semplice, informazioni chiare via email e assistenza dedicata su WhatsApp.",
      primaryLabel: "I nostri tour",
      primaryHref: "/tour",
      secondaryLabel: "Scrivici su WhatsApp",
      toursEyebrow: "Le nostre esperienze",
      toursTitle: "Scegli il tuo itinerario.",
      toursBody:
        "Abbiamo selezionato percorsi chiari, completi e ben strutturati per accompagnarti alla scoperta di Praga con competenza e cura.",
      trustEyebrow: "Perché sceglierci",
      trustTitle: "Non sei un semplice turista.\nSei nostro ospite.",
      trustBody:
        "Curiamo ogni dettaglio pratico e organizzativo delle nostre visite guidate, offrendoti supporto costante e informazioni utili prima, durante e dopo ogni tour.",
      galleryEyebrow: "Guide e consigli di viaggio",
      galleryTitle: "Tutto quello che c'è da sapere prima di partire.",
      galleryBody:
        "Articoli, consigli locali e approfondimenti culturali selezionati dal nostro team per farti orientare al meglio in città.",
      answersTitle: "Prima di prenotare",
      answersBody: "L'essenziale per risolvere ogni tuo dubbio.",
      partnerEyebrow: "Agenzie e scuole",
      partnerTitle: "Soluzioni su misura per scuole, gruppi, hotel e agenzie.",
      partnerBody:
        "Organizzi un viaggio di istruzione, un tour di gruppo o cerchi un partner affidabile a Praga per i tuoi ospiti? Progettiamo itinerari personalizzati con logistica dedicata e supporto diretto in italiano.",
      partnerLabel: "Richiedi una proposta dedicata",
      faqEyebrow: "Prima di prenotare",
      faqBody:
        "Tutto quello che serve sapere prima di prenotare un tour a Praga.",
      faqTitle: "Domande frequenti",
      stats: [
        {
          value: "Tour in italiano",
          label: "Guide certificate, residenti a Praga",
        },
        { value: "Posti garantiti", label: "Gruppi organizzati, zero caos" },
        {
          value: "Prenotazione semplice",
          label: "Conferma immediata e zero sorprese",
        },
        {
          value: "Sempre al tuo fianco",
          label: "Assistenza diretta su WhatsApp",
        },
      ],
      pillars: structuredClone(trustPillars),
      groups: [
        {
          title: "Gli essenziali",
          subtitle: "I tour più importanti per la scoperta di Praga.",
          items: [
            {
              title: "Free tour Città Vecchia e quartiere ebraico",
              href: "/tour/citta-vecchia-ponte-carlo",
            },
            {
              title: "Castello e Malá Strana",
              href: "/tour/castello-praga-mala-strana",
            },
            { title: "Città Nuova", href: "/contatti" },
          ],
        },
        {
          title: "Tuffo nella storia",
          subtitle: "Percorsi per entrare nella storia della città.",
          items: [
            { title: "Tour del comunismo", href: "/contatti" },
            { title: "Praga esoterica", href: "/contatti" },
          ],
        },
        {
          title: "Gli angoli nascosti",
          subtitle: "Luoghi meno battuti, con una guida in italiano.",
          items: [
            {
              title: "Tour di Petřín e Monastero di Strahov",
              href: "/contatti",
            },
            { title: "Tour di Vyšehrad", href: "/contatti" },
          ],
        },
        {
          title: "Escursioni Fuori Porta",
          subtitle: "Giornate organizzate fuori dal centro di Praga.",
          items: [
            {
              title: "Escursione al campo di concentramento di Terezin",
              href: "/contatti",
            },
            { title: "Tour al birrificio di Plzen", href: "/contatti" },
            { title: "Karlovy Vary", href: "/contatti" },
          ],
        },
      ],
    },
    gallery: [
      {
        title: "Città Vecchia e Ponte Carlo",
        caption:
          "Da dove partire al primo giorno e come muoversi nel centro senza perdere tempo.",
        imageUrl:
          "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80",
        ctaEnabled: false,
        ctaLabel: "",
        ctaHref: "",
      },
      {
        title: "Castello e Malá Strana",
        caption:
          "Ritmo, salite e punto d'incontro chiari prima di arrivare al Castello.",
        imageUrl:
          "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80",
        ctaEnabled: false,
        ctaLabel: "",
        ctaHref: "",
      },
      {
        title: "Cambio, pagamenti e assistenza",
        caption:
          "Come pagare in modo chiaro e a chi scrivere, tutti i giorni dalle 9:00 alle 19:00.",
        imageUrl:
          "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=1200&q=80",
        ctaEnabled: false,
        ctaLabel: "",
        ctaHref: "",
      },
    ],
    faqs: structuredClone(faqs),
    answers: structuredClone(aiQuestions),
  };
}
function normalizeGalleryItem(
  item: SiteContent["gallery"][number],
): SiteContent["gallery"][number] {
  return {
    ...item,
    id: item.id || `guide:${guideSlug(item)}`,
    slug: guideSlug(item),
    imageAlt: item.imageAlt?.trim() || "",
    intro: item.intro?.trim() || "",
    blocks: item.blocks ?? [],
    // Legacy articles never acquire an automatic promotional button.
    ctaEnabled: item.ctaEnabled === true,
    ctaLabel: item.ctaLabel?.trim() || "",
    ctaHref: item.ctaHref?.trim() || "",
  };
}

export function siteContent(
  stored?: SiteContent,
  pages?: Record<string, ContentPage>,
): SiteContent {
  const base = defaultSiteContent();
  const content = stored
    ? {
        ...base,
        ...stored,
        globals: { ...base.globals, ...stored.globals },
        home: { ...base.home, ...stored.home },
      }
    : base;
  // Transfer published legacy page overrides once; structured sections then own their text.
  if (stored?.contentVersion !== 2) {
    const mappings = {
      homepage: ["heroTitle", "heroEyebrow", "heroBody"],
      blog: ["galleryTitle", "galleryEyebrow", "galleryBody"],
      faq: ["faqTitle", "faqEyebrow", "faqBody"],
    } as const;
    for (const [key, fields] of Object.entries(mappings)) {
      const page = pages?.[key];
      if (!page?.published) continue;
      for (const [index, field] of fields.entries()) {
        const value = [page.title, page.subtitle, page.body][index].trim();
        if (value) content.home[field] = value;
      }
    }
  }
  content.contentVersion = 2;
  // Discard legacy customer-account links, including navigation already saved in the CMS.
  content.globals.navigation = content.globals.navigation.filter(
    (link) => !/^\/account(?:[/?#]|$)/.test(link.href),
  );
  content.gallery = content.gallery.map(normalizeGalleryItem);
  return content;
}

function draftPage(
  title: string,
  subtitle: string,
  body: string,
  seoTitle: string,
  seoDescription: string,
): ContentPage {
  return {
    title,
    subtitle,
    body,
    seoTitle,
    seoDescription,
    published: false,
  };
}

/** Testi standard delle pagine CMS, allineati a ciò che il sito mostra oggi. */
export function defaultContentPages(
  content: SiteContent = defaultSiteContent(),
): Record<string, ContentPage> {
  const h = content.home;
  const g = content.globals;
  const pillars = h.pillars.map((p) => `• ${p.title}: ${p.text}`).join("\n");
  const faqBody = content.faqs.map((f) => `D: ${f.q}\nR: ${f.a}`).join("\n\n");
  const answersBody = content.answers
    .map((a) => `D: ${a.question}\nR: ${a.answer}`)
    .join("\n\n");
  return {
    homepage: draftPage(
      h.heroTitle,
      h.heroEyebrow,
      h.heroBody,
      g.brandName,
      g.description,
    ),
    "chi-siamo": draftPage(
      h.trustTitle.replaceAll("\n", " "),
      "Chi siamo",
      `${h.trustBody}\n\n${pillars}`,
      "Chi siamo",
      "Guide certificate residenti a Praga, gruppi a numero chiuso e assistenza in italiano.",
    ),
    "informazioni-utili": draftPage(
      h.answersTitle,
      "Informazioni utili",
      `${h.answersBody}\n\n${answersBody}`,
      "Informazioni utili",
      "Cosa sapere prima di prenotare un tour a Praga.",
    ),
    blog: draftPage(
      h.galleryTitle,
      h.galleryEyebrow,
      h.galleryBody,
      "Guide e consigli di viaggio",
      "Consigli locali e informazioni pratiche prima di un tour in italiano a Praga.",
    ),
    catalogo: draftPage(
      "Tour guidati in italiano a Praga",
      h.toursEyebrow,
      h.toursBody,
      "Tour guidati in italiano a Praga",
      "Catalogo tour FreeTourPraga in italiano, con disponibilità e assistenza WhatsApp.",
    ),
    "tour-privati": draftPage(
      "Tour privati e gruppi",
      "Agenzie e scuole",
      "Itinerari su misura per famiglie, scuole, gruppi e agenzie. Indica date e partecipanti: prepariamo una proposta dedicata.",
      "Tour privati a Praga",
      "Tour privati e di gruppo in italiano a Praga.",
    ),
    "partner-europa": draftPage(
      "Grandi esperienze. Organizzate insieme.",
      "Partner Europa",
      h.partnerBody,
      "Partner Europa",
      "Tour in italiano per scuole, gruppi, hotel e agenzie a Praga.",
    ),
    faq: draftPage(
      h.faqTitle,
      "Prima di prenotare",
      `Tutto quello che serve sapere prima di prenotare un tour a Praga.\n\n${faqBody}`,
      "Domande frequenti",
      "Risposte alle domande più frequenti sui tour FreeTourPraga.",
    ),
    contatti: draftPage(
      "Praga è più vicina di quanto pensi.",
      "Un consiglio da chi vive qui",
      `Un dubbio sul tour, sul punto d'incontro o sull'esperienza giusta per te? Parliamone: siamo qui per aiutarti a organizzare la visita.\n\nEmail: ${g.email}\nTelefono: ${g.phone}\nWhatsApp: ${g.supportHours}\n${g.address}`,
      "Contatti",
      "Contatta il team FreeTourPraga per informazioni sui tour in italiano.",
    ),
    privacy: draftPage(
      "Privacy e cookie",
      "",
      `Titolare: Domenico Masini, ditta individuale, IČO 21191310, Kaprova 42/14, 11000 Praha – Staré Město. Contatto: ${g.email}.\n\nTrattiamo i dati necessari a prenotazioni, conferme, pagamenti e assistenza. I dettagli completi restano nella pagina Privacy del sito.`,
      "Privacy e cookie",
      "Informativa privacy e cookie FreeTourPraga.",
    ),
    termini: draftPage(
      "Termini di prenotazione",
      "",
      "Il servizio è organizzato da Domenico Masini (IČO 21191310). Prezzi in euro, pagamento in contanti sul posto. Le regole di cancellazione e rimborso sono indicate in conferma e nella pagina Termini del sito.",
      "Termini e cancellazioni",
      "Termini di prenotazione e cancellazione FreeTourPraga.",
    ),
  };
}

/** Riempie le pagine CMS vuote con la versione standard; non sovrascrive bozze/pubblicate. */
export function mergeContentPages(
  stored: Record<string, ContentPage> | undefined,
  content: SiteContent,
): Record<string, ContentPage> {
  const defaults = defaultContentPages(content);
  const out: Record<string, ContentPage> = { ...defaults };
  for (const [key, page] of Object.entries(stored || {})) {
    if (!page) continue;
    const blank =
      !page.title.trim() &&
      !page.subtitle.trim() &&
      !page.body.trim() &&
      !page.seoTitle.trim() &&
      !page.seoDescription.trim();
    if (page.published || !blank) out[key] = page;
  }
  return out;
}

export function contentWhatsapp(content: SiteContent, message: string) {
  return `https://wa.me/${content.globals.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
