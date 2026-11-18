import { CollaborationPage } from "@/components/CollaborationPage";
import { publicPage } from "@/lib/platform/public";
import { Handshake, Hotel, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const baseMetadata = {
  title: "Partner Europa",
  description: "Tour in italiano per scuole, gruppi, hotel e agenzie a Praga.",
  alternates: { canonical: "/partner-europa" },
};

export default function Page() {
  return (
    <CollaborationPage
      eyebrow="Partner Europa"
      title="Partner Europa"
      titleLines={["Grandi esperienze.", "Organizzate insieme."]}
      body="Scuole in viaggio, gruppi da accompagnare, ospiti da consigliare: siamo il tuo riferimento locale per scoprire Praga in italiano."
      formVariant="partner"
      benefits={[
        {
          icon: Users,
          title: "Scuole e gruppi",
          text: "Itinerari e ritmi adatti a chi viaggia insieme.",
        },
        {
          icon: Hotel,
          title: "Hotel e agenzie",
          text: "Un contatto dedicato per organizzare le visite dei tuoi ospiti.",
        },
        {
          icon: Handshake,
          title: "Collabora con noi",
          text: "Affiliazioni e codici per riconoscere le prenotazioni dei tuoi clienti.",
        },
      ]}
    />
  );
}

export async function generateMetadata() {
  const p = await publicPage("partner-europa");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
