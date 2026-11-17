import type { Metadata } from "next";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { PracticalAnswers } from "@/components/PracticalAnswers";
export const metadata: Metadata = { title: "Informazioni utili per visitare Praga", description: "Risposte e guide pratiche per organizzare il tuo viaggio a Praga.", alternates: { canonical: "/informazioni-utili" } };
export default async function Page() {
  const c = await publicSiteContent();
  return <section className="section"><div className="container-page"><h1 className="display-xl mb-5">Informazioni utili</h1><p className="body-md mb-8 max-w-3xl">{c.home.answersBody}</p><PracticalAnswers items={c.answers} gallery={c.gallery} /><div className="mt-8 flex flex-wrap gap-4"><Link href="/faq" className="button-primary">Domande frequenti</Link><Link href="/blog" className="button-primary">Tutte le guide su Praga</Link></div></div></section>;
}
