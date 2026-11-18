import { CollaborationPage } from "@/components/CollaborationPage";
import { Building2, CalendarDays, Route } from "lucide-react";

export const metadata = {
  title: "Agenzie B2B",
  description:
    "Organizza visite guidate in italiano a Praga per i tuoi clienti. Raccontaci le esigenze del gruppo e costruiamo insieme una proposta.",
  alternates: { canonical: "/agenzie-b2b" },
};

export default function Page() {
  return (
    <CollaborationPage
      eyebrow="Agenzie B2B"
      title="Agenzie B2B"
      titleLines={["Visite guidate.", "Per i tuoi clienti."]}
      body="Organizza visite guidate in italiano a Praga per i tuoi clienti. Raccontaci le esigenze del gruppo e costruiamo insieme una proposta."
      formVariant="agency"
      benefits={[
        {
          icon: Route,
          title: "Gruppi e itinerari",
          text: "Itinerari per gruppi, scuole e viaggi organizzati.",
        },
        {
          icon: CalendarDays,
          title: "Contatto locale",
          text: "Un contatto locale per date, orari e punti d’incontro.",
        },
        {
          icon: Building2,
          title: "Su misura",
          text: "Richieste su misura in base al programma di viaggio.",
        },
      ]}
    />
  );
}
