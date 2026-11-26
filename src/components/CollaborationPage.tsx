import { InlineCopy } from "./RichInline";
import { RichContent } from "./RichContent";
import type { ContentPage } from "@/lib/platform/model";
import { pageEdit } from "@/lib/visual-content";
import type { LucideIcon } from "lucide-react";
import { Handshake, Hotel, Users } from "lucide-react";
import { InquiryForm, type InquiryVariant } from "@/components/InquiryForm";
import ui from "@/components/public-ui.module.css";

const defaultIcons = [Users, Hotel, Handshake] as const;

export function CollaborationPage({
  pageKey,
  formatted,
  eyebrow,
  title,
  titleLines,
  body,
  benefits,
  formVariant = "partner",
}: {
  pageKey?: string;
  formatted?: Pick<ContentPage, "titleHtml" | "subtitleHtml" | "bodyHtml"> | null;
  eyebrow: string;
  title: string;
  titleLines?: string[];
  body: string;
  benefits: { title: string; titleHtml?: string; text: string; html?: string; icon?: LucideIcon }[];
  formVariant?: InquiryVariant;
}) {
  const lines = titleLines?.length ? titleLines : [title];

  return (
    <section className={`${ui.page} ${ui.partner} section`}>
      <div className="container-page grid items-start gap-16 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p
            {...(pageKey ? pageEdit(pageKey, "subtitleHtml", "inline") : {})}
            className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
          >
            <InlineCopy html={formatted?.subtitleHtml}>{eyebrow}</InlineCopy>
          </p>
          <h1 className="display-xl mb-5">
            <span {...(pageKey ? pageEdit(pageKey, "titleHtml", "inline") : {})}>
              <InlineCopy html={formatted?.titleHtml}>{lines.join("\n")}</InlineCopy>
            </span>
          </h1>
          <div
            {...(pageKey ? pageEdit(pageKey, "bodyHtml", "html") : {})}
            className="body-md mb-10"
          >
            {formatted?.bodyHtml ? <RichContent html={formatted.bodyHtml} /> : body}
          </div>
          <div className={ui.partnerBenefits}>
            {benefits.map((benefit, index) => {
              const Icon =
                benefit.icon ?? defaultIcons[index % defaultIcons.length];
              return (
                <div key={benefit.title} className={ui.partnerBenefit}>
                  <Icon size={36} className={ui.partnerIcon} aria-hidden />
                  <div>
                    <strong
                      {...(pageKey
                        ? pageEdit(pageKey, `benefits.${index}.titleHtml`, "inline")
                        : {})}
                      className="block text-ink"
                    >
                      <InlineCopy html={benefit.titleHtml}>{benefit.title}</InlineCopy>
                    </strong>
                    <div className="text-sm"
                      {...(pageKey
                        ? pageEdit(pageKey, `benefits.${index}.html`, "html")
                        : {})}
                    >
                      {benefit.html ? <RichContent html={benefit.html} /> : benefit.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <InquiryForm variant={formVariant} />
      </div>
    </section>
  );
}
