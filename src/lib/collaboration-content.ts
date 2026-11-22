import type { ContentPage } from "./platform/model";
export const collaborationDefaults: Record<string, ContentPage> = {
  "agenzie-b2b": {
    title: "Agenzie B2B",
    subtitle: "Agenzie B2B",
    body: "Organizza visite guidate in italiano a Praga per i tuoi clienti. Raccontaci le esigenze del gruppo e costruiamo insieme una proposta.",
    benefits: [
      {
        title: "Gruppi e itinerari",
        text: "Itinerari per gruppi, scuole e viaggi organizzati.",
      },
      {
        title: "Contatto locale",
        text: "Un contatto locale per date, orari e punti d’incontro.",
      },
      {
        title: "Su misura",
        text: "Richieste su misura in base al programma di viaggio.",
      },
    ],
    seoTitle: "Agenzie B2B",
    seoDescription:
      "Organizza visite guidate in italiano a Praga per i tuoi clienti. Raccontaci le esigenze del gruppo e costruiamo insieme una proposta.",
    published: false,
  },
  "diventa-un-partner": {
    title: "Diventa un partner",
    subtitle: "Diventa un partner",
    body: "Hai un hotel, un’attività turistica o una community di viaggiatori? Proponi una collaborazione con FreeTourPraga.",
    benefits: [
      {
        title: "La tua attività",
        text: "Presenta la tua attività e il pubblico a cui ti rivolgi.",
      },
      {
        title: "Come collaborare",
        text: "Raccontaci come vorresti proporre i nostri tour.",
      },
      {
        title: "Valutiamo insieme",
        text: "Valutiamo insieme modalità e opportunità di collaborazione.",
      },
    ],
    seoTitle: "Diventa un partner",
    seoDescription:
      "Hai un hotel, un’attività turistica o una community di viaggiatori? Proponi una collaborazione con FreeTourPraga.",
    published: false,
  },
  "lavora-con-noi": {
    title: "Lavora con noi",
    subtitle: "Lavora con noi",
    body: "Ti piace raccontare Praga e accompagnare i viaggiatori alla scoperta della città? Presentati al nostro team.",
    benefits: [
      {
        title: "La tua esperienza",
        text: "Raccontaci la tua esperienza come guida o nel turismo.",
      },
      {
        title: "Lingue e disponibilità",
        text: "Indica le lingue che parli e la tua disponibilità.",
      },
      {
        title: "Curriculum",
        text: "Aggiungi nel messaggio un collegamento al tuo curriculum o portfolio.",
      },
    ],
    seoTitle: "Lavora con noi",
    seoDescription:
      "Ti piace raccontare Praga e accompagnare i viaggiatori alla scoperta della città? Presentati al nostro team.",
    published: false,
  },
};

export const partnerBenefits = [
  {
    title: "Scuole e gruppi",
    text: "Itinerari e ritmi adatti a chi viaggia insieme.",
  },
  {
    title: "Hotel e agenzie",
    text: "Un contatto dedicato per organizzare le visite dei tuoi ospiti.",
  },
  {
    title: "Collabora con noi",
    text: "Affiliazioni e codici per riconoscere le prenotazioni dei tuoi clienti.",
  },
];
