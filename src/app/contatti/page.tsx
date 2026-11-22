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
          <p className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}>
            {page?.subtitle || "Un consiglio da chi vive qui"}
          </p>
          <h1 className="display-xl mb-6">
            {page?.title || "Praga è più vicina di quanto pensi."}
          </h1>
          <p className="body-md mb-10 max-w-md">
            Un dubbio sul tour, sul punto d’incontro o sull’esperienza giusta
            per te? Parliamone: siamo qui per aiutarti a organizzare la visita.
          </p>
          {page?.body && (
            <p className="mb-6 whitespace-pre-wrap">{page.body}</p>
          )}
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
                <small>{site.email}</small>
              </span>
            </a>
            {site.socialLinks.length > 0 && (
              <div className={ui.contactSocialRow}>
                {site.socialLinks.map((link) => (
                  <a
                    key={link.label}
                    className={ui.contactRow}
                    href={link.url}
                    target="_blank"
                    rel="me noreferrer"
                  >
                    <span className={ui.contactIcon} aria-hidden>
                      <BrandIcon name={link.label} />
                    </span>
                    <span>
                      <strong className="block text-ink">{link.label}</strong>
                      <small>Apri profilo</small>
                    </span>
                  </a>
                ))}
              </div>
            )}
            <div className={ui.contactRow}>
              <MapPin size={36} className={ui.contactIcon} aria-hidden />
              <span>
                <strong className="block text-ink">
                  Punto d’incontro principale
                </strong>
                <small>{site.address}</small>
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
                    <p className={ui.contactOtherPoint}>
                      <strong className="block">Castello con interni</strong>
                      <span>{site.castleMeetingAddress}</span>
                    </p>
                  )}
                  {site.officeAddress && (
                    <p className={ui.contactOtherPoint}>
                      <strong className="block">
                        Sede ufficio — previo appuntamento
                      </strong>
                      <span>{site.officeAddress}</span>
                    </p>
                  )}
                </div>
              </details>
            )}
            <SectionBlocks blocks={page?.contentBlocks} />
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
