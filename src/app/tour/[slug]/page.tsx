import {
  estimatedEuroPrice,
  tourHeadlinePrice,
} from "@/lib/participant-pricing";
import { SectionBlocks } from "@/components/SectionBlocks";
import { bookingDeadlineNote, cancellationNote } from "@/lib/tour-rules";
import ui from "@/components/public-ui.module.css";
import type { Metadata } from "next";
import { TourGallery } from "@/components/TourGallery";
import { tourPhotos } from "@/lib/tour-gallery";
import { notFound } from "next/navigation";
import { Clock3, Users, MessageCircle } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { TourMobileBooking } from "@/components/TourMobileBooking";
import { GoogleMap } from "@/components/GoogleMap";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { OfficialTripAdvisorWidget } from "@/components/OfficialTripAdvisorWidget";
import { TourHighlights } from "@/components/TourHighlights";
import { JsonLd } from "@/components/JsonLd";
import panels from "@/components/tour-panels.module.css";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
import { session } from "@/lib/platform/security";
import { readState } from "@/lib/platform/store";
import { publicTour } from "@/lib/platform/scheduling";
import { tourGalleryImages } from "@/lib/tour-gallery";
import { catalog } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
import { formatMoney, minutesToLabel } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";
import { breadcrumbJsonLd, tourJsonLd } from "@/lib/seo";
import { tourPath } from "@/lib/public-paths";
import { RichContent } from "@/components/RichContent";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = (await catalog()).find(
    (t) => t.slug === slug || t.canonicalPath === `/tour/${slug}/`,
  );
  if ((await searchParams)?.["cms-tour"])
    return { title: "Anteprima tour", robots: { index: false, follow: false } };
  if (!tour) return {};
  return {
    title: tour.seoTitle
      ? { absolute: tour.seoTitle }
      : tour.seoTitle || tour.title,
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

export default async function TourDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  let tour: import("@/lib/types").Tour | undefined = (await catalog()).find(
    (t) => t.slug === slug || t.canonicalPath === `/tour/${slug}/`,
  );
  const previewId = (await searchParams)?.["cms-tour"];
  if (typeof previewId === "string") {
    const staff = await session();
    if (staff && ["admin", "operator"].includes(staff.role)) {
      const state = await readState({ generateSlots: false });
      const stored = state.tours.find((t) => t.id === previewId);
      if (stored) tour = publicTour(state, stored);
      else if ((await searchParams)?.["cms-new"] === "1" && state.tours[0]) {
        const draft = {
          ...structuredClone(state.tours[0]),
          id: previewId,
          title: "Nuovo tour",
          slug: "nuovo-tour",
          published: false,
        };
        tour = publicTour(state, draft);
      }
    }
  }
  if (!tour) notFound();
  const price = tourHeadlinePrice(tour);
  const adultEuro = estimatedEuroPrice(
    tour.priceCategories?.find(({ id }) => id === "adults")?.estimatedEuroCents,
  );
  const duration = tour.durationLabel || minutesToLabel(tour.durationMinutes);
  const highlights = tour.highlights.map((text, index) => ({
    text,
    index,
    images: (tour.highlightGalleries?.[index] || []).slice(0, 4),
  }));
  const groups =
    tour.itineraryGroups?.filter(({ start }) => start < highlights.length) ??
    [];
  const bookingDeadline = bookingDeadlineNote(tour);
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
          <div
            className={`grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end ${ui.detailTitleRow}`}
          >
            <h1
              data-tour-field="title"
              className="display-xl tour-detail-title mb-0 min-w-0"
            >
              {tour.title}
            </h1>
            <div className={ui.detailOffer}>
              <div className={ui.detailPrice}>
                <span>{price.isFree ? "Prezzo" : "Tariffa intera adulti"}</span>
                <strong>
                  {adultEuro
                    ? formatMoney(price.priceCents, tour.currency)
                    : price.text}
                </strong>
                {adultEuro && <span>{adultEuro} a persona</span>}
                {price.isFree && tour.suggestedContribution && (
                  <span>Offerta consigliata {tour.suggestedContribution}</span>
                )}
              </div>
              <div className={ui.detailMeta}>
                <span>
                  <Clock3 size={15} aria-hidden />{" "}
                  <span
                    data-tour-field={
                      tour.durationLabel ? "durationLabel" : "durationMinutes"
                    }
                    data-tour-kind={tour.durationLabel ? "text" : "number"}
                  >
                    {duration}
                  </span>
                </span>
                <span>
                  <Users size={15} aria-hidden /> Guida in{" "}
                  <span data-tour-field="language">{tour.language}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <TourGallery
          key={tour.id}
          title={tour.title}
          photos={tourPhotos(tour)}
          editPaths={tourPhotos(tour).map((photo) =>
            photo.url === tour.imageUrl
              ? "imageUrl"
              : `galleryImages.${tourGalleryImages(tour).findIndex((p) => p.url === photo.url)}.url`,
          )}
        />

        <nav aria-label="Sezioni del tour" className={ui.tourSectionNav}>
          {[
            ["esperienza", "Descrizione"],
            ["dettagli", "Itinerario"],
            ["incontro", "Informazioni utili"],
            ["cancellazione", "Cancellazione"],
            ["punto-incontro", "Punto di incontro"],
            ["recensioni", "Recensioni"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-10">
            <section id="esperienza">
              <h2 className="display-md mb-4">Descrizione</h2>
              <div
                className="body-md"
                data-tour-field={
                  tour.descriptionHtml ? "descriptionHtml" : "description"
                }
                data-tour-kind={tour.descriptionHtml ? "html" : "text"}
              >
                {tour.descriptionHtml ? (
                  <RichContent html={tour.descriptionHtml} />
                ) : (
                  <p>{tour.description}</p>
                )}
              </div>
            </section>
            <SectionBlocks blocks={tour.contentBlocks} tourEditable />
            <section id="dettagli" className={panels.highlightPanel}>
              <h2 className="display-md mb-4">Itinerario</h2>
              {groups.length ? (
                groups.map((group, index) => (
                  <div key={group.start} className="mb-5 last:mb-0">
                    <h3
                      className="display-sm mb-3"
                      data-tour-field={`itineraryGroups.${index}.title`}
                    >
                      {group.title}
                    </h3>
                    <TourHighlights
                      items={highlights.slice(
                        group.start,
                        groups[index + 1]?.start,
                      )}
                    />
                  </div>
                ))
              ) : (
                <TourHighlights items={highlights} />
              )}
            </section>
            <section id="incontro">
              <h2 className="display-md mb-4">Informazioni utili</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`card p-6 ${panels.panelOrange}`}>
                  <h3 className="display-sm mb-3">Incluso</h3>
                  <TourInfoList items={tour.inclusions} field="inclusions" />
                  {!!tour.exclusions?.length && (
                    <>
                      <h3 className="display-sm mb-3 mt-5">Non incluso</h3>
                      <TourInfoList
                        items={tour.exclusions}
                        field="exclusions"
                      />
                    </>
                  )}
                </div>
                <div className={`card p-6 ${panels.panelBlue}`}>
                  <h3 className="display-sm mb-3">Informazioni pratiche</h3>
                  <ul className={`${panels.panelList} body-md mb-3`}>
                    {(tour.operatingDays || tour.departureTime) && (
                      <li>
                        <strong>Partenze</strong> ·{" "}
                        {[tour.operatingDays, tour.departureTime]
                          .filter(Boolean)
                          .join(" · ")}
                      </li>
                    )}
                    <li>
                      <strong>Durata</strong> · {duration}
                    </li>
                    {!!tour.arrivalMinutes && (
                      <li>
                        Arriva {tour.arrivalMinutes} minuti prima della
                        partenza.
                      </li>
                    )}
                  </ul>
                  <TourInfoList items={tour.safetyNotes} field="safetyNotes" />
                </div>
              </div>
            </section>
            <section id="cancellazione" className="card grid gap-3 p-6">
              <h2 className="display-md">Cancellazione</h2>
              <p className="body-md">{cancellationNote(tour)}</p>
              {bookingDeadline && <p className="body-md">{bookingDeadline}</p>}
            </section>
            <GoogleMap tour={tour} />
            <section id="recensioni">
              <h2 className="display-md mb-4">Recensioni</h2>
              <TripAdvisorSection layout="card" />
              <OfficialTripAdvisorWidget />
            </section>
            <section
              className={`${panels.panelWhatsapp} rounded-xl p-7 text-on-dark`}
            >
              <div className={panels.panelTitleRow}>
                <MessageCircle
                  size={42}
                  className={`${panels.panelIcon} ${panels.panelIconWhatsapp}`}
                  aria-hidden
                />
                <h2 className="display-md !mb-0 !text-on-dark">
                  Hai dubbi o domande prima di prenotare?
                </h2>
              </div>
              <p className="body-sm mb-5 !text-hairline-soft">
                Il nostro team in italiano ti aiuta a organizzare la visita a
                Praga.
              </p>
              <a
                className="button-primary !bg-[var(--whatsapp)] !text-white hover:!bg-[#148a3e]"
                href={whatsappHref(
                  `Ciao FreeTourPraga, mi trovo nella pagina del tour ${tour.title} e vorrei un'informazione rapida sulla disponibilità.`,
                )}
              >
                Scrivici su WhatsApp
              </a>
            </section>
          </div>
          <BookingForm tour={tour} />
          <TourMobileBooking tour={tour} />
        </div>
      </div>
    </section>
  );
}

function TourInfoList({ items, field }: { items: string[]; field: string }) {
  return (
    <ul className={`${panels.panelList} body-md`}>
      {items.map((item, index) => (
        <li key={index} data-tour-field={`${field}.${index}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}
