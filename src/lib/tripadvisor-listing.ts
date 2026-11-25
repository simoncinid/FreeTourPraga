import { unstable_cache } from "next/cache";
import { tripAdvisor } from "@/lib/site";

export type TripadvisorReview = {
  author: string;
  avatar: string;
  title: string;
  body: string;
  rating: number;
  date: string;
  url: string;
  profileUrl: string;
};

const profile = (slug: string) => `https://www.tripadvisor.it/Profile/${slug}`;
const review = (id: string) =>
  `https://www.tripadvisor.it/ShowUserReviews-g274707-d${tripAdvisor.locationId}-r${id}-Free_Tour_Praga-Prague_Bohemia.html`;
const photo = (path: string) =>
  `https://dynamic-media-cdn.tripadvisor.com/media/${path}?w=100&h=-1&s=1`;

/** Recensioni pubbliche lette dalla prima pagina del profilo, 25 nov 2026. */
export const tripadvisorReviews: TripadvisorReview[] = [
  {
    author: "bbc",
    avatar: photo("photo-o/1a/f6/f6/0d/default-avatar-2020-34.jpg"),
    title: "Da non perdere",
    body: "Free tour Praga, visita guidata molto accurata ed interessante, bravissimo Stefano, preparatissimo ed empatico. Fortemente consigliata. Bravi!",
    rating: 5,
    date: "16 luglio 2026",
    url: review("1068715267"),
    profileUrl: profile("644bbc"),
  },
  {
    author: "Clacdm75",
    avatar: photo("photo-o/1a/f6/f3/e4/default-avatar-2020-30.jpg"),
    title: "Ottimo tour",
    body: "Ottimo tour, ottima guida. Margherita e’esaustiva e preparata, i prezzi molto più che convenienti, li ricontatterò senz’altro",
    rating: 5,
    date: "8 luglio 2026",
    url: review("1067557139"),
    profileUrl: profile("Clacdm75"),
  },
  {
    author: "cosmicpeace",
    avatar: photo("photo-s/01/59/aa/49/cosmicpeace.jpg"),
    title: "Un grande tour amichevole con passione",
    body: "Ottimo tour che consiglio vivamente. La nostra guida turistica locale Pavel ha vissuto a Praga tutta la sua vita, la sua passione per la città è contagiosa e può mettere la sua storia in un modo che tutti possono capire. La passeggiata è ricca di attrazioni della Città Vecchia, con una bella sosta in un caffè locale, per gustare un caffè o una birra. Pavel ha risposto a tutte le mie domande, e ci ha dato consigli utili su come essere a Praga. Secondo tour vado con questa compagnia, e mi sono davvero divertito entrambi. Ti prego, non dimenticare di dare la mancia!",
    rating: 5,
    date: "8 aprile 2026",
    url: review("1055824919"),
    profileUrl: profile("cosmicpeace"),
  },
  {
    author: "Federica Lanzi",
    avatar: photo("photo-o/1a/f6/f1/42/default-avatar-2020-20.jpg"),
    title: "Praga Comunista e visita al bunker",
    body: "Visita guidata al Bunker posto sotto Hotel Jalta in piazza San Venceslao, al tempo del Comunismo, e descritta benissimo dalla nostra guida preparatissima e gentilissima di nome Giulia. Consigliato",
    rating: 5,
    date: "31 gennaio 2026",
    url: review("1048078861"),
    profileUrl: profile("LaChicca2"),
  },
  {
    author: "Alyssa",
    avatar: photo("photo-o/30/75/78/4d/caption.jpg"),
    title:
      "Grande tour a piedi gratuito della Città Vecchia di Praga e altre attrazioni",
    body: "Grande tour a piedi della città di Praga, guida era molto informato di storia e chiaramente entusiasta di quello che fa. Il tour è iniziato in Piazza Venceslao alle 1030, mostrando molte attrazioni della città, ci siamo anche fermati in un bel caffè per un po' (un bel posto per una pausa) e si è concluso in Piazza della Città Vecchia alle 1400, dove abbiamo assistito alla \"Processione degli Apostoli\" tramite l'Orologio Astronomico. È stato un ottimo modo per trascorrere il giorno 1 del nostro viaggio lì, acquisendo maggiore familiarità con la città.",
    rating: 5,
    date: "4 gennaio 2026",
    url: review("1044935870"),
    profileUrl: profile("acU3796BN"),
  },
  {
    author: "SilviaSimo16",
    avatar: photo("photo-o/1a/f6/f1/b8/default-avatar-2020-22.jpg"),
    title: "Ottima scelta!",
    body: "Ottima esperienza. Free tour città vecchia e il giorno dopo tour città nuova (adulti 15€ bambini gratis). Spiegazioni eccellenti e guide preparatissime e coinvolgenti (Dario e Ingrid). Anche i miei figli di 9 e 13 anni hanno partecipato con interesse riuscendo a seguire!",
    rating: 5,
    date: "3 gennaio 2026",
    url: review("1044798472"),
    profileUrl: profile("SilviaSimo16"),
  },
  {
    author: "Carlotta E",
    avatar: photo("photo-o/1a/f6/ee/10/default-avatar-2020-8.jpg"),
    title: "Fantastico",
    body: "Bellissima esperienza, molto coinvolgente, le guide sono preparate, molto simpatiche, e gentili consigliatissimo!",
    rating: 5,
    date: "23 novembre 2025",
    url: review("1040105701"),
    profileUrl: profile("carlottae374"),
  },
  {
    author: "Fdz",
    avatar: photo("photo-o/1a/f6/e5/66/default-avatar-2020-53.jpg"),
    title: "Praga parentesi di storia",
    body: "La guida (Roberto) è molto preparata e coinvolgente. Abbiamo fatto il tour della città vecchia e abbiamo potuto avere un approfondimento di molti aneddoti storici che probabilmente per pigrizia non avremmo approfondito. Gradito inoltre alcuni consigli sullo shopping e i ristoranti. Esperienza molto positiva.",
    rating: 5,
    date: "15 novembre 2025",
    url: review("1039046206"),
    profileUrl: profile("Daydream29109752953"),
  },
  {
    author: "Carla T",
    avatar: photo("photo-o/1a/f6/f1/06/default-avatar-2020-18.jpg"),
    title: "Guide preparate.",
    body: "Guide in italiano molto preparate. Tour ben organizzati e gestiti. Consiglio guida Sig. Paolo perché alla preparazione unisce empatia e simpatia.",
    rating: 5,
    date: "13 ottobre 2025",
    url: review("1034642206"),
    profileUrl: profile("893carlat"),
  },
];

const widgetUrl = `https://www.tripadvisor.it/WidgetEmbed-cdsratingsonlynarrow?${new URLSearchParams(
  {
    locationId: tripAdvisor.locationId,
    lang: "it",
    format: "inner",
    display: "true",
    display_version: "2",
  },
).toString()}`;

export const loadTripadvisorScore = unstable_cache(
  async () => {
    const response = await fetch(widgetUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const bubble = html.match(/bubble_(\d{2})/);
    const count = html.match(/(\d[\d.]*)\s*recensioni/i);
    if (!bubble || !count) return null;
    const rating = Number(bubble[1]) / 10;
    const reviewCount = Number(count[1].replaceAll(".", ""));
    if (!Number.isFinite(rating) || !Number.isFinite(reviewCount)) return null;
    return { rating, reviewCount };
  },
  ["tripadvisor-score", tripAdvisor.locationId],
  { revalidate: 60 * 60 * 6 },
);
