import { pageEdit } from "@/lib/visual-content";
import type { LucideIcon } from "lucide-react";
import { Handshake, Hotel, Users } from "lucide-react";
import { InquiryForm, type InquiryVariant } from "@/components/InquiryForm";
import ui from "@/components/public-ui.module.css";

const defaultIcons = [Users, Hotel, Handshake] as const;

export function CollaborationPage({
  pageKey,
  eyebrow,
  title,
  titleLines,
  body,
  benefits,
  formVariant = "partner",
}: {
  pageKey?: string;
  eyebrow: string;
  title: string;
  titleLines?: string[];
  body: string;
  benefits: { title: string; text: string; icon?: LucideIcon }[];
  formVariant?: InquiryVariant;
}) {
  const lines = titleLines?.length ? titleLines : [title];

  return (
    <section className={`${ui.page} ${ui.partner} section`}>
      <div className="container-page grid items-start gap-16 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p
            {...(pageKey ? pageEdit(pageKey, "subtitle") : {})}
            className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
          >
            {eyebrow}
          </p>
          <h1 className="display-xl mb-5">
            <span {...(pageKey ? pageEdit(pageKey, "title") : {})}>
              {lines.join("\n")}
            </span>
          </h1>
          <p
            {...(pageKey ? pageEdit(pageKey, "body") : {})}
            className="body-md mb-10"
          >
            {body}
          </p>
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
                        ? pageEdit(pageKey, `benefits.${index}.title`)
                        : {})}
                      className="block text-ink"
                    >
                      {benefit.title}
                    </strong>
                    <small
                      {...(pageKey
                        ? pageEdit(pageKey, `benefits.${index}.text`)
                        : {})}
                    >
                      {benefit.text}
                    </small>
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
