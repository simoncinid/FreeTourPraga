import type { LucideIcon } from "lucide-react";
import { Handshake, Hotel, Users } from "lucide-react";
import {
  InquiryForm,
  type InquiryVariant,
} from "@/components/InquiryForm";
import ui from "@/components/public-ui.module.css";

const defaultIcons = [Users, Hotel, Handshake] as const;

export function CollaborationPage({
  eyebrow,
  title,
  titleLines,
  body,
  benefits,
  formVariant = "partner",
}: {
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
          <p className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}>
            {eyebrow}
          </p>
          <h1 className="display-xl mb-5">
            {lines.map((line, index) => (
              <span key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </h1>
          <p className="body-md mb-10">{body}</p>
          <div className={ui.partnerBenefits}>
            {benefits.map((benefit, index) => {
              const Icon =
                benefit.icon ?? defaultIcons[index % defaultIcons.length];
              return (
                <div key={benefit.title} className={ui.partnerBenefit}>
                  <Icon size={36} className={ui.partnerIcon} aria-hidden />
                  <div>
                    <strong className="block text-ink">{benefit.title}</strong>
                    <small>{benefit.text}</small>
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
