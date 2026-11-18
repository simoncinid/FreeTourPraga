import { cancellationNote, FREE_TOUR_NOTE, isFreeTour } from "@/lib/tour-rules";
import ui from "@/components/public-ui.module.css";
import type { Metadata } from "next";
import { TourGallery } from "@/components/TourGallery";
import { tourPhotos } from "@/lib/tour-gallery";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, Info, Users, MessageCircle } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { GoogleMap } from "@/components/GoogleMap";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { TourHighlights } from "@/components/TourHighlights";
import { JsonLd } from "@/components/JsonLd";
import panels from "@/components/tour-panels.module.css";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
import { catalog } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
import { formatMoney, minutesToLabel } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";
import { breadcrumbJsonLd, tourJsonLd } from "@/lib/seo";
import { tourPath } from "@/lib/public-paths";
import { RichContent } from "@/components/RichContent";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = (await catalog()).find((t) => t.slug === slug || t.canonicalPath === `/tour/${slug}/`);
  if (!tour) return {};
  return {
    title: tour.importedFromWordpress && tour.seoTitle ? { absolute: tour.seoTitle } : tour.seoTitle || tour.title,
    description: tour.seoDescription || tour.shortDescription,
    keywords: [...site.keywords, ...(tour.seoKeywords || [])],
    alternates: {
      canonical: tourPath(tour),
    },
    openGraph: {
      title: tour.seoTitle || tour.title,
      description: tour.seoDescription || tour.shortDescription,
      url: absoluteUrl(tourPath(tour)),
      type: "article",
      locale: "it_IT",
      images: [
        {
          url: tour.imageUrl,
          width: 1200,
          height: 800,
          alt: `${tour.title} - FreeTourPraga`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tour.seoTitle || tour.title,
      description: tour.seoDescription || tour.shortDescription,
      images: [tour.imageUrl],
    },
    other: {
      "geo.region": "CZ-10",
      "geo.placename": tour.meetingPoint,
      "geo.position": `${tour.latitude};${tour.longitude}`,
      ICBM: `${tour.latitude}, ${tour.longitude}`,
    },
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tour = (await catalog()).find((t) => t.slug === slug || t.canonicalPath === `/tour/${slug}/`);
  if (!tour) notFound();
  const content = await publicSiteContent();
  const whatsappHref = (m: string) => contentWhatsapp(content, m);

  return (
    <section className={`${ui.page} ${ui.detail} pb-20 pt-10`}>
      <JsonLd
        data={[
          tourJsonLd(tour),
          breadcrumbJsonLd([
            { name: "Home", url: site.url },
            { name: "Tour", url: absoluteUrl("/tour") },
            { name: tour.title, url: absoluteUrl(tourPath(tour)) },
          ]),
        ]}
      />
      <div className="container-page">
        <div className="mb-7">
          <p className="micro-label mb-3 text-primary">
            Praga · {tour.category}
          </p>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <h1 className="display-xl tour-detail-title mb-0 min-w-0">
              {tour.title}
            </h1>
            <div className="shrink-0 text-left lg:text-right">
              <span className="block text-sm text-muted">{tour.priceLabel ? "Free Tour" : "A partire da soli"}</span>
              <strong className="font-display text-4xl text-primary leading-none">
                {tour.priceLabel || formatMoney(tour.basePriceCents)}
              </strong>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock3 size={15} /> {minutesToLabel(tour.durationMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={15} /> Guida in {tour.language}
            </span>
          </div>
        </div>

        <TourGallery
          key={tour.id}
          title={tour.title}
          photos={tourPhotos(tour)}
        />

        <div className="mb-8 border-b border-hairline pb-4 text-sm font-semibold text-ink">
          <a href="#esperienza" className="mr-7 border-b-2 border-primary pb-4">
            Descrizione
          </a>
          <a href="#dettagli" className="mr-7">
            Dettagli
          </a>
          <a href="#incontro">Punto d&apos;incontro</a>
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-10">
            <section id="esperienza">
              <h2 className="display-md mb-4">L&apos;esperienza</h2>
              <div className="body-md">{tour.descriptionHtml ? <RichContent html={tour.descriptionHtml} /> : <p>{tour.description}</p>}</div>
            </section>
            <section id="dettagli">
              <h2 className="display-md mb-4">Cosa vedrai</h2>
              <TourHighlights
                items={tour.highlights.map((text, index) => ({
                  text,
                  images: (tour.highlightGalleries?.[index] || []).slice(0, 4),
                }))}
              />
            </section>
            <section id="incontro" className="grid gap-4 md:grid-cols-2">
              <div className={`card p-6 ${panels.panelOrange}`}>
                <h2 className={`display-md mb-4 ${panels.panelTitleOneLine}`}>
                  Incluso
                </h2>
                <ul className={panels.panelList}>
                  {tour.inclusions.map((item) => (
                    <li key={item} className={`${panels.panelTickItem} body-sm`}>
                      <CheckCircle2
                        className={panels.panelTick}
                        size={18}
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`card p-6 ${panels.panelBlue}`}>
                <h2 className={`display-md mb-4 ${panels.panelTitleOneLine}`}>
                  Informazioni pratiche
                </h2>
                <ul className={panels.panelList}>
                  {tour.safetyNotes.map((note) => (
                    <li key={note} className={`${panels.panelTickItem} body-sm`}>
                      <Info
                        className={panels.panelInfo}
                        size={18}
                        aria-hidden
                      />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <section className="card grid gap-3 p-6"><h2 className="display-md">Prenotazione e cancellazione</h2>{isFreeTour(tour) && <p>{FREE_TOUR_NOTE}</p>}<p>{cancellationNote(tour)}</p></section>
            <GoogleMap tour={tour} />
            <TripAdvisorSection layout="card" />
            <section
              className={`${panels.panelWhatsapp} rounded-xl p-7 text-on-dark`}
            >
              <div className={panels.panelTitleRow}>
                <MessageCircle size={42} className={`${panels.panelIcon} ${panels.panelIconWhatsapp}`} aria-hidden />
                <h2 className="display-md !mb-0 !text-on-dark">
                  Hai un dubbio prima di prenotare?
                </h2>
              </div>
              <p className="body-sm mb-5 !text-hairline-soft">
                Scrivici: nel messaggio troveremo già il nome del tour, così
                possiamo risponderti più rapidamente.
              </p>
              <a
                className="button-primary !bg-[#1aad53] !text-white hover:!bg-[#159648]"
                href={whatsappHref(
                  `Ciao FreeTourPraga, mi trovo nella pagina del tour ${tour.title} e vorrei un'informazione rapida sulla disponibilita.`,
                )}
              >
                Scrivi su WhatsApp
              </a>
            </section>
          </div>
          <BookingForm tour={tour} />
          <a href="#prenota" className="tour-mobile-booking button-primary">Prenota questo tour</a>
        </div>
      </div>
    </section>
  );
}
