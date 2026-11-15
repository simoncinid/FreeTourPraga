import Link from "next/link";
import { PracticalAnswers } from "@/components/PracticalAnswers";
import { publicSiteContent } from "@/lib/platform/public";

export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await publicSiteContent();
  return (
    <section className="section">
      <div className="container-page">
        <p className="uppercase-tag mb-4 text-primary">Prima di partire</p>
        <h1 className="display-xl mb-4">Informazioni utili</h1>
        <p className="body-md mb-10 max-w-3xl">{c.home.answersBody}</p>
        <PracticalAnswers items={c.answers} />
        <Link href="/faq" className="button-secondary mt-10">
          Domande frequenti
        </Link>
      </div>
    </section>
  );
}

export const metadata = {
  title: "Informazioni utili",
  description:
    "Cosa sapere prima di prenotare un tour in italiano a Praga: gruppi, ritrovo, famiglie e assistenza.",
  alternates: { canonical: "/informazioni-utili" },
};
