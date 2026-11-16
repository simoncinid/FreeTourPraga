import { canonicalPath } from "./public-paths";

export const site = {
  name: "FreeTourPraga",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://it.freetourpraga.com").replace(/\/+$/, ""),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && process.env.NEXT_PUBLIC_WHATSAPP_NUMBER !== "420000000000"
    ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    : "393312744277",
  phone: "+39 331 274 4277",
  email: "prenotazione@unitedworldtours.eu",
  address: "Teatro degli Stati, Rytířská 22, 110 00 Staré Město, Praga",
  supportHours: "Tutti i giorni, dalle 9:00 alle 19:00",
  city: "Praga",
  region: "Praha",
  country: "CZ",
  latitude: 50.0875,
  longitude: 14.4208,
  tagline: "Goditi Praga con gli occhi, non con lo schermo del telefono. Al resto pensiamo noi.",
  description:
    "Scopri l'anima autentica di Praga con guide locali in italiano. Prenotazione semplice, informazioni chiare via email e assistenza su WhatsApp.",
  keywords: [
    "tour guidati Praga italiano",
    "guida italiana Praga",
    "tour Praga in italiano",
    "visite guidate Praga",
    "tour privati Praga",
    "tour Castello di Praga italiano",
    "Ponte Carlo tour italiano",
    "assistenza WhatsApp Praga"
  ]
};

export const socialLinks = [
  { label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "" },
  { label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL || "" },
  { label: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK_URL || "" },
  { label: "YouTube", url: process.env.NEXT_PUBLIC_YOUTUBE_URL || "" }
].filter((link) => Boolean(link.url));

export const tripAdvisor = {
  profileUrl:
    process.env.NEXT_PUBLIC_TRIPADVISOR_URL ||
    "https://www.tripadvisor.it/Attraction_Review-g274707-d7365510-Reviews-Free_Tour_Praga-Prague_Bohemia.html",
  widgetHtml: process.env.TRIPADVISOR_WIDGET_HTML || "",
  widgetScriptSrc: process.env.NEXT_PUBLIC_TRIPADVISOR_WIDGET_SCRIPT_SRC || "",
  // Dati profilo Attraction d7365510 (TripAdvisor / Tripadvisor.cn, nov 2026).
  rating: 4.8,
  reviewCount: 771,
  reviews: [
    {
      author: "644bbc",
      place: "Praga",
      rating: 5,
      date: "lug 2026",
      avatarUrl: "/images/reviews/stefano-reviewer.jpg",
      text: "Free tour Praga, visita guidata molto accurata ed interessante, bravissimo Stefano, preparatissimo ed empatico. Fortemente consigliata. Bravi!",
    },
    {
      author: "Elena M.",
      place: "Praga",
      rating: 5,
      date: "giu 2026",
      avatarUrl: "/images/reviews/pavel-reviewer.jpg",
      text: "Tour del Castello chiaro e coinvolgente: la guida ha saputo adattare il ritmo al gruppo e rispondere a ogni domanda. Prenotazione semplice e puntualità impeccabile.",
    },
    {
      author: "Marco R.",
      place: "Praga",
      rating: 5,
      date: "mag 2026",
      avatarUrl: "/images/reviews/castle-reviewer.jpg",
      text: "Prima volta a Praga e ci siamo sentiti subito orientati. Spiegazioni in italiano, consigli pratici utili e un gruppo piccolo che rende tutto più piacevole. Consigliatissimo.",
    },
    {
      author: "Viaggiatore TripAdvisor",
      place: "Praga",
      rating: 5,
      date: "apr 2026",
      avatarUrl: "/images/reviews/pavel-reviewer.jpg",
      text: "Great tour I thoroughly recommend. Our local tour guide Pavel lived in Prague his whole life, his passion for the city is contagious & he can put its history in a way everyone can understand. The walk is full of Old Town's highlights, with a nice stop at a local cafe.",
    },
    {
      author: "Maps4644740",
      place: "Praga",
      rating: 5,
      date: "apr 2026",
      avatarUrl: "/images/reviews/castle-reviewer.jpg",
      text: "Great tour of Prague's Castle area on a glorious warm sunny day! Our tour guide, Ilya, was a great chap with a very good historical knowledge & a captivating storyteller. It was a little group so I feel it was more relaxed. Thoroughly recommend these tours!",
    },
  ],
};

export function whatsappHref(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return new URL(path).toString();
  return new URL(canonicalPath(path), site.url).toString();
}
