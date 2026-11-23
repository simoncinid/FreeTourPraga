import { pageEdit } from "@/lib/visual-content";
import { publicPage } from "@/lib/platform/public";
import { SectionBlocks } from "@/components/SectionBlocks";
import type { Metadata } from "next";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { BlogGuideList } from "@/components/BlogGuideList";
import ui from "@/components/public-ui.module.css";

const baseMetadata: Metadata = {
  title: "Informazioni utili per visitare Praga",
  description:
    "Risposte e guide pratiche per organizzare il tuo viaggio a Praga.",
  alternates: { canonical: "/informazioni-utili" },
};

export default async function Page() {
  const c = await publicSiteContent();
  const page = await publicPage("informazioni-utili");
  return (
    <section className="section">
      <div className="container-page">
        <div className={ui.usefulHeader}>
          <h1
            {...pageEdit("informazioni-utili", "title")}
            className={`display-xl ${ui.usefulTitle}`}
          >
            {page?.title || "Informazioni utili"}
          </h1>
          <p
            {...pageEdit("informazioni-utili", "body")}
            className={`body-md ${ui.usefulLead}`}
          >
            {page?.body || c.home.answersBody}
          </p>
        </div>
        <SectionBlocks
          binding={{
            scope: "page",
            key: "informazioni-utili",
            path: ["contentBlocks"],
          }}
          blocks={page?.contentBlocks}
        />
        <BlogGuideList items={c.gallery} />
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

export async function generateMetadata() {
  const page = await publicPage("informazioni-utili");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
