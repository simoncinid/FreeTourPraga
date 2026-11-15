import { faqs, trustPillars } from "../data";
import { aiQuestions } from "../ai-content";
import { site, socialLinks, tripAdvisor } from "../site";
export type SiteContent = {
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
    stats: { value: string; label: string }[];
    pillars: { title: string; text: string }[];
    groups: { title: string; items: { title: string; href: string }[] }[];
  };
  gallery: { title: string; caption: string; imageUrl: string }[];
  faqs: { q: string; a: string }[];
  answers: { question: string; answer: string }[];
};
export function defaultSiteContent(): SiteContent {
  return {
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
      tripAdvisorBody: "Le parole di chi ha esplorato Praga con noi.",
      socialLinks: structuredClone(socialLinks),
      navigation: [
        { label: "I Nostri Tour", href: "/tour" },
        { label: "Chi siamo", href: "/chi-siamo" },
        { label: "Informazioni utili", href: "/informazioni-utili" },
        { label: "Contatti", href: "/contatti" },
        { label: "Partner tour in Europa", href: "/partner-europa" },
        { label: "Agenzie e scuole", href: "/tour-privati" },
        { label: "Blog", href: "/blog" },
        { label: "FAQ", href: "/faq" },
        { label: "Aiuto", href: "/aiuto" },
        { label: "Accedi o registrati", href: "/account" },
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
      partnerTitle:
        "Soluzioni su misura per scuole, gruppi, hotel e agenzie.",
      partnerBody:
        "Organizzi un viaggio di istruzione, un tour di gruppo o cerchi un partner affidabile a Praga per i tuoi ospiti? Progettiamo itinerari personalizzati con logistica dedicata e supporto diretto in italiano.",
      partnerLabel: "Richiedi una proposta dedicata",
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
          items: [
            {
              title: "Free tour Città Vecchia e quartiere ebraico",
              href: "/tour/citta-vecchia-ponte-carlo",
            },
            {
              title: "Castello, Malá Strana e Città Nuova",
              href: "/tour/castello-praga-mala-strana",
            },
          ],
        },
        {
          title: "Tuffo nella storia",
          items: [
            { title: "Tour del comunismo", href: "/tour" },
            { title: "Praga esoterica", href: "/tour" },
          ],
        },
        {
          title: "Gli angoli nascosti",
          items: [
            {
              title: "Tour di Petřín e Monastero di Strahov",
              href: "/tour",
            },
            { title: "Tour di Vyšehrad", href: "/tour" },
          ],
        },
        {
          title: "Escursioni Fuori Porta",
          items: [
            {
              title: "Escursione al campo di concentramento di Terezin",
              href: "/tour",
            },
            { title: "Tour al birrificio di Plzen", href: "/tour" },
            { title: "Karlovy Vary", href: "/tour" },
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
      },
      {
        title: "Castello e Malá Strana",
        caption:
          "Ritmo, salite e punto d'incontro chiari prima di arrivare al Castello.",
        imageUrl:
          "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Cambio, pagamenti e assistenza",
        caption:
          "Come pagare in modo chiaro e a chi scrivere, tutti i giorni dalle 9:00 alle 19:00.",
        imageUrl:
          "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    faqs: structuredClone(faqs),
    answers: structuredClone(aiQuestions),
  };
}
export function siteContent(stored?: SiteContent): SiteContent {
  const base = defaultSiteContent();
  return stored
    ? {
        ...base,
        ...stored,
        globals: { ...base.globals, ...stored.globals },
        home: { ...base.home, ...stored.home },
      }
    : base;
}
export function contentWhatsapp(content: SiteContent, message: string) {
  return `https://wa.me/${content.globals.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
