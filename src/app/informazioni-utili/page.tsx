import type { Metadata } from "next";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { PracticalAnswers } from "@/components/PracticalAnswers";
import ui from "@/components/public-ui.module.css";

export const metadata: Metadata = {
  title: "Informazioni utili per visitare Praga",
  description:
    "Risposte e guide pratiche per organizzare il tuo viaggio a Praga.",
  alternates: { canonical: "/informazioni-utili" },
};

export default async function Page() {
  const c = await publicSiteContent();
  return (
    <section className="section">
      <div className="container-page">
        <div className={ui.usefulHeader}>
          <h1 className={`display-xl ${ui.usefulTitle}`}>Informazioni utili</h1>
          <p className={`body-md ${ui.usefulLead}`}>{c.home.answersBody}</p>
        </div>
        <PracticalAnswers items={c.answers} gallery={c.gallery} />
        <div className={ui.usefulActions}>
          <Link href="/faq" className="button-primary">
            Domande frequenti
          </Link>
          <Link href="/blog" className="button-primary">
            Tutte le guide su Praga
          </Link>
        </div>
      </div>
    </section>
  );
}
