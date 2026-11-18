import { CollaborationPage } from "@/components/CollaborationPage";
import { Languages, Link2, UserRound } from "lucide-react";

export const metadata = {
  title: "Lavora con noi",
  description:
    "Ti piace raccontare Praga e accompagnare i viaggiatori alla scoperta della città? Presentati al nostro team.",
  alternates: { canonical: "/lavora-con-noi" },
};

export default function Page() {
  return (
    <CollaborationPage
      eyebrow="Lavora con noi"
      title="Lavora con noi"
      titleLines={["Racconta Praga.", "Unisciti al team."]}
      body="Ti piace raccontare Praga e accompagnare i viaggiatori alla scoperta della città? Presentati al nostro team."
      formVariant="jobs"
      benefits={[
        {
          icon: UserRound,
          title: "La tua esperienza",
          text: "Raccontaci la tua esperienza come guida o nel turismo.",
        },
        {
          icon: Languages,
          title: "Lingue e disponibilità",
          text: "Indica le lingue che parli e la tua disponibilità.",
        },
        {
          icon: Link2,
          title: "Curriculum",
          text: "Aggiungi nel messaggio un collegamento al tuo curriculum o portfolio.",
        },
      ]}
    />
  );
}
