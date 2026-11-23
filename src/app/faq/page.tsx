import { siteEdit } from "@/lib/visual-content";
import { SectionBlocks } from "@/components/SectionBlocks";
import ui from "@/components/public-ui.module.css";
import { Plus } from "lucide-react";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { publicPage } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Domande frequenti",
  alternates: { canonical: "/faq" },
};
export default async function Page() {
  const c = await publicSiteContent();
  const editorial = await publicPage("faq");
  const faqs = c.faqs;
  return (
    <section className={`${ui.page} ${ui.faq} section`}>
      <div className="container-page">
        <JsonLd data={faqJsonLd(faqs)} />
        <p
          {...siteEdit("home.faqEyebrow")}
          className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
        >
          {c.home.faqEyebrow}
        </p>
        <h1
          {...siteEdit("home.faqTitle")}
          className="display-xl mb-4 max-w-3xl"
        >
          {c.home.faqTitle}
        </h1>
        <p {...siteEdit("home.faqBody")} className="body-md mb-10 max-w-3xl">
          {c.home.faqBody}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((f, index) => (
            <details key={f.q} className="card">
              <summary className="font-bold cursor-pointer">
                <span {...siteEdit(`faqs.${index}.q`)}>{f.q}</span>
                <Plus size={18} aria-hidden />
              </summary>
              <p {...siteEdit(`faqs.${index}.a`)}>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-sm">
          Non hai trovato la risposta?{" "}
          <Link
            className="font-semibold text-ink underline underline-offset-4"
            href="/contatti"
          >
            Scrivici, ti aiutiamo noi.
          </Link>
        </p>
        <SectionBlocks
          binding={{ scope: "page", key: "faq", path: ["contentBlocks"] }}
          blocks={editorial?.contentBlocks}
        />
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
