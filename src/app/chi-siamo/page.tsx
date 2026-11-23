import { pageEdit, siteEdit } from "@/lib/visual-content";
import { SectionBlocks } from "@/components/SectionBlocks";
import { RichContent } from "@/components/RichContent";
import { publicPage } from "@/lib/platform/public";
import ui from "@/components/public-ui.module.css";
import Link from "next/link";
import { ArrowRight, Headset, MapPin, ShieldCheck, Users } from "lucide-react";
import { publicSiteContent } from "@/lib/platform/public";

export const dynamic = "force-dynamic";

const icons = [ShieldCheck, Users, MapPin, Headset];

export default async function Page() {
  const { home } = await publicSiteContent();
  const page = await publicPage("chi-siamo");
  const lines = (page?.title || home.trustTitle).split("\n");

  return (
    <section className={`${ui.page} ${ui.about} section`}>
      <div className={`container-page ${ui.aboutInner}`}>
        <p
          {...pageEdit("chi-siamo", "subtitle")}
          className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
        >
          {page?.subtitle || "Chi siamo"}
        </p>
        <h1 className={`display-xl ${ui.aboutTitle}`}>
          <span className={ui.aboutTitleRow}>
            <span {...pageEdit("chi-siamo", "title")}>{lines.join("\n")}</span>
            <Link
              href="/tour"
              className={`button-primary ${ui.aboutTourCta}`}
              style={{ alignSelf: "flex-start" }}
            >
              Tutti i tour <ArrowRight size={16} aria-hidden />
            </Link>
          </span>
        </h1>
        <div
          {...pageEdit(
            "chi-siamo",
            page?.bodyHtml ? "bodyHtml" : "body",
            page?.bodyHtml ? "html" : "text",
          )}
          className={`body-md whitespace-pre-wrap ${ui.aboutLead}`}
        >
          {page?.bodyHtml ? (
            <RichContent html={page.bodyHtml} />
          ) : (
            page?.body || home.trustBody
          )}
        </div>
        <SectionBlocks
          binding={{ scope: "page", key: "chi-siamo", path: ["contentBlocks"] }}
          blocks={page?.contentBlocks}
        />
        <div className={ui.aboutGrid}>
          {home.pillars.map((pillar, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article key={pillar.title} className="card p-6">
                <Icon className="mb-4 text-primary" size={26} />
                <h2
                  {...siteEdit(`home.pillars.${index}.title`)}
                  className="title-md"
                >
                  {pillar.title}
                </h2>
                <p
                  {...siteEdit(`home.pillars.${index}.text`)}
                  className="body-sm mt-3"
                >
                  {pillar.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const baseMetadata = {
  title: "Chi siamo",
  description:
    "Guide certificate residenti a Praga, gruppi a numero chiuso e assistenza in italiano tutti i giorni.",
  alternates: { canonical: "/chi-siamo" },
};

export async function generateMetadata() {
  const page = await publicPage("chi-siamo");
  return {
    ...baseMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}
