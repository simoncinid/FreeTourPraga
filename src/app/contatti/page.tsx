import { SiteInlineText } from "@/components/SiteRichText";
import { RichContent } from "@/components/RichContent";
import { InlineCopy } from "@/components/RichInline";
import { pageEdit, siteEdit } from "@/lib/visual-content";
import { catalog } from "@/lib/platform/public";
import { BrandIcon } from "@/components/BrandIcon";
import { SectionBlocks } from "@/components/SectionBlocks";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import ui from "@/components/public-ui.module.css";
import { publicSiteContent, publicPage } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
import { InquiryForm } from "@/components/InquiryForm";

const baseMetadata = {
  title: "Contatti",
  description:
    "Contatta il team FreeTourPraga per informazioni sui tour in italiano.",
  alternates: { canonical: "/contatti/" },
};

export default async function Page() {
  const c = await publicSiteContent();
  const site = c.globals;
  const whatsappHref = (m: string) =>
    `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(m)}`;
  const page = await publicPage("contatti");
  const tours = await catalog();
  const mainAddress = site.address.trim().toLocaleLowerCase("it");
  const points = [
    ...new Map(
      tours.map((t) => [
        t.meetingAddress,
        { label: t.meetingPoint, address: t.meetingAddress, mapUrl: t.mapUrl },
      ]),
    ).values(),
  ].filter((p) => p.address.trim().toLocaleLowerCase("it") !== mainAddress);

  const hasOtherPoints =
    points.length > 0 || !!site.castleMeetingAddress || !!site.officeAddress;

  return (
    <section className={`${ui.page} ${ui.contact} section`}>
      <div className={`container-page ${ui.contactGrid}`}>
        <div>
          <p
            {...pageEdit("contatti", "subtitleHtml", "inline")}
            className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}
          >
            <InlineCopy html={page?.subtitleHtml}>{page?.subtitle || "Un consiglio da chi vive qui"}</InlineCopy>
          </p>
          <h1 {...pageEdit("contatti", "titleHtml", "inline")} className="display-xl mb-6">
            <InlineCopy html={page?.titleHtml}>{page?.title || "Praga è più vicina di quanto pensi."}</InlineCopy>
          </h1>
          <div
            {...pageEdit("contatti", "bodyHtml", "html")}
            className="body-md mb-10 max-w-md"
          >
            {page?.bodyHtml ? <RichContent html={page.bodyHtml} /> : page?.body ||
              "Un dubbio sul tour, sul punto d’incontro o sull’esperienza giusta per te? Parliamone: siamo qui per aiutarti a organizzare la visita."}
          </div>
          <div className={ui.contactRows}>
            <a
              className={ui.contactRow}
              href={whatsappHref("Ciao, vorrei informazioni sui tour.")}
            >
              <MessageCircle size={36} className={ui.contactIcon} aria-hidden />
              <span>
                <strong className="block text-ink">Scrivici su WhatsApp</strong>
                <small>
                  {site.phone} · {site.supportHours}
                </small>
              </span>
            </a>
            <a className={ui.contactRow} href={`mailto:${site.email}`}>
              <Mail size={36} className={ui.contactIcon} aria-hidden />
              <span>
                <strong className="block text-ink">Email</strong>
                <small {...siteEdit("globals.email")}><SiteInlineText content={c} path="globals.email">{site.email}</SiteInlineText></small>
              </span>
            </a>
            <div className={ui.contactRow}>
              <MapPin size={36} className={ui.contactIcon} aria-hidden />
              <span>
                <strong className="block text-ink">
                  Punto d’incontro principale
                </strong>
                <small {...siteEdit("globals.address")}><SiteInlineText content={c} path="globals.address">{site.address}</SiteInlineText></small>
              </span>
            </div>
            {hasOtherPoints && (
              <details className={ui.contactOtherPoints}>
                <summary className={ui.contactRow}>
                  <MapPin size={36} className={ui.contactIcon} aria-hidden />
                  <span>
                    <strong className="block text-ink">
                      Altri punti d’incontro
                    </strong>
                    <small>Apri per vedere tutti i luoghi</small>
                  </span>
                </summary>
                <div className={ui.contactOtherPointsList}>
                  {points.map((p) => (
                    <a
                      key={p.address}
                      href={p.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={ui.contactOtherPoint}
                    >
                      <strong className="block">{p.label}</strong>
                      <span>{p.address}</span>
                    </a>
                  ))}
                  {site.castleMeetingAddress && (
                    <a
                      href="https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7"
                      target="_blank"
                      rel="noreferrer"
                      className={ui.contactOtherPoint}
                    >
                      <strong className="block">Castello con interni</strong>
                      <span {...siteEdit("globals.castleMeetingAddress")}><SiteInlineText content={c} path="globals.castleMeetingAddress">{site.castleMeetingAddress}</SiteInlineText></span>
                    </a>
                  )}
                  {site.officeAddress && (
                    <p className={ui.contactOtherPoint}>
                      <strong className="block">
                        Sede ufficio — previo appuntamento
                      </strong>
                      <span {...siteEdit("globals.officeAddress")}><SiteInlineText content={c} path="globals.officeAddress">{site.officeAddress}</SiteInlineText></span>
                    </p>
                  )}
                </div>
              </details>
            )}
            {site.socialLinks.length > 0 && (
              <div className={ui.contactSocialRow} role="list">
                {site.socialLinks.map((link) => (
                  <a
                    key={link.label}
                    role="listitem"
                    className={ui.contactSocialIcon}
                    href={link.url}
                    target="_blank"
                    rel="me noreferrer"
                    aria-label={link.label}
                    title={link.label}
                  >
                    <BrandIcon name={link.label} />
                  </a>
                ))}
              </div>
            )}
            <SectionBlocks
              binding={{
                scope: "page",
                key: "contatti",
                path: ["contentBlocks"],
              }}
              blocks={page?.contentBlocks}
            />
          </div>
        </div>
        <div className={ui.contactAside}>
          <InquiryForm />
        </div>
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("contatti");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
