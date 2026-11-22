/** One owner per editable field; shared public placements reuse that owner. */
export const contentSections = {
  homepage: {
    label: "Homepage",
    description:
      "Apertura, sezioni, dati in evidenza e punti di forza della homepage.",
  },
  blog: {
    label: "Blog",
    description:
      "Introduzione del blog e articoli con testi, immagini e pulsanti facoltativi.",
  },
  faq: {
    label: "FAQ e risposte",
    description:
      "Domande della pagina FAQ e risposte rapide prima di prenotare.",
  },
  pagine: {
    label: "Pagine del sito",
    description: "Testi e metadati delle altre pagine pubbliche.",
  },
  identita: {
    label: "Dati e contatti",
    description:
      "Marchio, recapiti, orari e testi del footer, condivisi da tutto il sito.",
  },
  navigazione: {
    label: "Menu e social",
    description: "Collegamenti del menu e profili social.",
  },
  recensioni: {
    label: "Recensioni",
    description: "Profilo TripAdvisor e testi della sezione recensioni.",
  },
} as const;
export type ContentSection = keyof typeof contentSections;
export type StructuredContentSection = Exclude<ContentSection, "pagine">;
export const pageLabels = {
  "informazioni-utili": "Informazioni utili",
  "agenzie-b2b": "Agenzie e scuole",
  "diventa-un-partner": "Diventa un partner",
  "lavora-con-noi": "Lavora con noi",
  social: "Social",
  "chi-siamo": "Chi siamo",
  catalogo: "Catalogo tour",
  "partner-europa": "Partner Europa",
  contatti: "Pagina contatti",
  aiuto: "Aiuto",
  privacy: "Privacy e cookie",
  termini: "Termini di prenotazione",
} as const;
export const contentFields = {
  homepage: {
    home: [
      "heroImage",
      "heroImageMobile",
      "heroTitle",
      "heroEyebrow",
      "heroBody",
      "primaryLabel",
      "primaryHref",
      "secondaryLabel",
      "toursEyebrow",
      "toursTitle",
      "toursBody",
      "trustEyebrow",
      "trustTitle",
      "trustBody",
      "partnerEyebrow",
      "partnerTitle",
      "partnerBody",
      "partnerLabel",
    ],
  },
  blog: { home: ["galleryEyebrow", "galleryTitle", "galleryBody"] },
  faq: {
    home: ["faqTitle", "faqEyebrow", "faqBody", "answersTitle", "answersBody"],
  },
  identita: {
    globals: [
      "brandName",
      "description",
      "email",
      "phone",
      "whatsappNumber",
      "address",
      "officeAddress",
      "castleMeetingAddress",
      "supportHours",
      "footerText",
      "footerNote",
    ],
  },
  navigazione: { globals: ["instagramDirectUrl"] },
  recensioni: {
    globals: [
      "googleReviewUrl",
      "tripAdvisorUrl",
      "tripAdvisorTitle",
      "tripAdvisorBody",
    ],
  },
} as const;
