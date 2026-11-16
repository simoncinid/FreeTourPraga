import ui from "@/components/public-ui.module.css";
import { Plus } from "lucide-react";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Domande frequenti",
  alternates: { canonical: "/faq" },
};
export default async function Page() {
  const page = await publicPage("faq");
  const c = await publicSiteContent();
  const faqs = c.faqs;
  if (page) return <ContentBlock page={page} />;
  return (
    <section className={`${ui.page} ${ui.faq} section`}>
      <div className="container-page max-w-3xl">
        <JsonLd data={faqJsonLd(faqs)} />
        <p className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}>Prima di prenotare</p>
        <h1 className="display-xl mb-8">{c.home.faqTitle}</h1>
        {faqs.map((f) => (
          <details key={f.q} className="card mb-4 p-6">
            <summary className="font-bold cursor-pointer"><span>{f.q}</span><Plus size={18} aria-hidden /></summary>
            <p className="mt-4">{f.a}</p>
          </details>
        ))}
        <p className="mt-8 text-sm">Non hai trovato la risposta? <Link className="font-semibold text-ink underline underline-offset-4" href="/contatti">Scrivici, ti aiutiamo noi.</Link></p>
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("faq");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
