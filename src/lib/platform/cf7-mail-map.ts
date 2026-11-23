/**
 * Nomi tour e oggetti email allineati ai moduli Contact Form 7 di
 * it.freetourpraga.com. L’oggetto admin e la riga «Tour:» devono restare
 * identici: UWT li usa per importare le prenotazioni nell’app guide.
 */
export type Cf7MailProfile = {
  uwtTourName: string;
  customerSubject: string;
};

export const CF7_MAIL_BY_SLUG: Record<string, Cf7MailProfile> = {
  "free-tour-praga": {
    uwtTourName: "Free Tour italiano",
    customerSubject: "Free Tour di Praga",
  },
  "castello-praga-mala-strana": {
    uwtTourName: "Tour del Castillo en italiano",
    customerSubject: "Tour del Castello di Praga in Italiano",
  },
  "citta-nuova-di-praga": {
    uwtTourName: "Tour della Citta Nuova",
    customerSubject: "Tour della Città Nuova di Praga",
  },
  comunismo: {
    uwtTourName: "Tour del Comunismo e della Seconda Guerra Mondiale",
    customerSubject: "Tour del Comunismo e del Bunker Antiatomico",
  },
  terezin: {
    uwtTourName: "Tour de Terezín en italiano",
    customerSubject: "Tour del Campo di Concentramento di Terezín",
  },
  "mercatini-natale": {
    uwtTourName: "Tour dei Mercatini di Natale",
    customerSubject: "Tour dei Mercatini di Natale di Praga",
  },
  "tour-praga-esoterica": {
    uwtTourName: "Tour Notturno della Praga Esoterica",
    customerSubject: "Tour serale della Praga esoterica",
  },
  "petrin-monastero-strahov": {
    uwtTourName: "Tour del Monastero di Strahov",
    customerSubject: "Tour di Petřín e Monastero di Strahov",
  },
  "interni-castello-praga": {
    uwtTourName: "Tour degli interni del Castello di Praga",
    customerSubject: "Tour degli interni del Castello di Praga",
  },
  "free-tour-castello-praga": {
    uwtTourName: "Free Tour del Castello di Praga",
    customerSubject: "Free Tour di Praga",
  },
};

export const UWT_ADMIN_SUBJECT = "Reserva freetourpraga.com italiano";

export function cf7MailForSlug(
  slug: string,
  fallbackTitle: string,
): Cf7MailProfile {
  return (
    CF7_MAIL_BY_SLUG[slug] ?? {
      uwtTourName: fallbackTitle,
      customerSubject: fallbackTitle,
    }
  );
}
