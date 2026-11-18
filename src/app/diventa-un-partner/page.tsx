import { CollaborationPage } from "@/components/CollaborationPage";
import { Handshake, Hotel, Users } from "lucide-react";

export const metadata = {
  title: "Diventa un partner",
  description:
    "Hai un hotel, un’attività turistica o una community di viaggiatori? Proponi una collaborazione con FreeTourPraga.",
  alternates: { canonical: "/diventa-un-partner" },
};

export default function Page() {
  return (
    <CollaborationPage
      eyebrow="Diventa un partner"
      title="Diventa un partner"
      titleLines={["Collaboriamo.", "Insieme a Praga."]}
      body="Hai un hotel, un’attività turistica o una community di viaggiatori? Proponi una collaborazione con FreeTourPraga."
      formVariant="affiliate"
      benefits={[
        {
          icon: Hotel,
          title: "La tua attività",
          text: "Presenta la tua attività e il pubblico a cui ti rivolgi.",
        },
        {
          icon: Users,
          title: "Come collaborare",
          text: "Raccontaci come vorresti proporre i nostri tour.",
        },
        {
          icon: Handshake,
          title: "Valutiamo insieme",
          text: "Valutiamo insieme modalità e opportunità di collaborazione.",
        },
      ]}
    />
  );
}
