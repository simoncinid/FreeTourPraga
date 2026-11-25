import { pageEdit } from "@/lib/visual-content";
import { TripAdvisorOfficial } from "@/components/TripAdvisorOfficial";
import { aboutPageContent } from "@/lib/platform/content";
import { publicPage } from "@/lib/platform/public";
import ui from "@/components/public-ui.module.css";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const icons: LucideIcon[] = [ShieldCheck, MapPin, Users, Sparkles];

export default async function Page() {
  const page = await publicPage("chi-siamo");
  const copy = aboutPageContent;
  const title = page?.title || copy.title;
  const body = page?.body || copy.body;
  const points = page?.benefits?.length ? page.benefits : copy.benefits;
  const closingIndex = Math.max(
    0,
    page?.contentBlocks?.findIndex((block) => block.type === "text") ?? 0,
  );
  const closingBlock = page?.contentBlocks?.[closingIndex];
  const closing = closingBlock?.type === "text" ? closingBlock : null;

  return (
    <section className={`${ui.page} ${ui.about} section`}>
      <div className={`container-page ${ui.aboutInner}`}>
        <p
          {...pageEdit("chi-siamo", "subtitle")}
          className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
        >
          {page?.subtitle || copy.subtitle}
        </p>
        <h1 className={`display-xl ${ui.aboutTitle}`}>
          <span className={ui.aboutTitleRow}>
            <span {...pageEdit("chi-siamo", "title")}>{title}</span>
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
          {...pageEdit("chi-siamo", "body", "text")}
          className={`body-md whitespace-pre-wrap ${ui.aboutLead}`}
        >
          {body}
        </div>

        <h2 className={`title-md ${ui.aboutHeading}`}>Dicono di noi</h2>
        <TripAdvisorOfficial />

        <h2 className={`title-md ${ui.aboutHeading}`}>Come lavoriamo</h2>
        <div className={ui.aboutGrid}>
          {points.map((point, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article key={`${point.title}-${index}`} className="card p-6">
                <Icon className="mb-4 text-primary" size={26} />
                <h3
                  {...pageEdit("chi-siamo", `benefits.${index}.title`)}
                  className="title-md"
                >
                  {point.title}
                </h3>
                <p
                  {...pageEdit("chi-siamo", `benefits.${index}.text`)}
                  className="body-sm mt-3"
                >
                  {point.text}
                </p>
              </article>
            );
          })}
        </div>

        <h2
          {...pageEdit("chi-siamo", `contentBlocks.${closingIndex}.heading`)}
          className={`title-md ${ui.aboutHeading}`}
        >
          {closing?.heading || copy.closing.heading}
        </h2>
        <p
          {...pageEdit("chi-siamo", `contentBlocks.${closingIndex}.text`)}
          className={`body-md ${ui.aboutClose}`}
        >
          {closing?.text || copy.closing.text}
        </p>
      </div>
    </section>
  );
}

const baseMetadata = {
  title: aboutPageContent.seoTitle,
  description: aboutPageContent.seoDescription,
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
