import { RichContent } from "@/components/RichContent";
import type { ContentPage } from "@/lib/platform/model";
import { InlineCopy } from "@/components/RichInline";
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
  const points: NonNullable<ContentPage["benefits"]> = page?.benefits?.length ? page.benefits : copy.benefits;
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
          {...pageEdit("chi-siamo", "subtitleHtml", "inline")}
          className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
        >
          <InlineCopy html={page?.subtitleHtml}>{page?.subtitle || copy.subtitle}</InlineCopy>
        </p>
        <h1 className={`display-xl ${ui.aboutTitle}`}>
          <span className={ui.aboutTitleRow}>
            <span {...pageEdit("chi-siamo", "titleHtml", "inline")}><InlineCopy html={page?.titleHtml}>{title}</InlineCopy></span>
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
          {...pageEdit("chi-siamo", "bodyHtml", "html")}
          className={`body-md whitespace-pre-wrap ${ui.aboutLead}`}
        >
            {page?.bodyHtml ? <RichContent html={page.bodyHtml} /> : body}
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
                  {...pageEdit("chi-siamo", `benefits.${index}.titleHtml`, "inline")}
                  className="title-md"
                >
                  <InlineCopy html={point.titleHtml}>{point.title}</InlineCopy>
                </h3>
                <div
                  {...pageEdit("chi-siamo", `benefits.${index}.html`, "html")}
                  className="body-sm mt-3"
                >
                  {point.html ? <RichContent html={point.html} /> : point.text}
                </div>
              </article>
            );
          })}
        </div>

        <h2
          {...pageEdit("chi-siamo", `contentBlocks.${closingIndex}.headingHtml`, "inline")}
          className={`title-md ${ui.aboutHeading}`}
        >
          <InlineCopy html={closing?.headingHtml}>{closing?.heading || copy.closing.heading}</InlineCopy>
        </h2>
        <div
          {...pageEdit("chi-siamo", `contentBlocks.${closingIndex}.html`, "html")}
          className={`body-md ${ui.aboutClose}`}
        >
          {closing?.html ? <RichContent html={closing.html} /> : closing?.text || copy.closing.text}
        </div>
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
