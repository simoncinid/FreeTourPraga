import {
  estimatedEuroPrice,
  tourHeadlinePrice,
} from "@/lib/participant-pricing";
import { CmsPreviewMount } from "@/components/CmsPreviewMount";
import { SectionBlocks } from "@/components/SectionBlocks";
import { bookingDeadlineNote, cancellationNote } from "@/lib/tour-rules";
import ui from "@/components/public-ui.module.css";
import type { Metadata } from "next";
import { TourGallery } from "@/components/TourGallery";
import { tourPhotos } from "@/lib/tour-gallery";
import "@/components/rich-content.module.css";
import { notFound } from "next/navigation";
import { Clock3, Info, PackageCheck, Ticket, Users, MessageCircle } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { TourMobileBooking } from "@/components/TourMobileBooking";
import { GoogleMap } from "@/components/GoogleMap";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { TourInfoList, TourItinerary } from "@/components/TourDetailLists";
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
import { RemovedTourText } from "@/components/RemovedContentStyles";
import { TourEditableText } from "@/components/TourEditableText";
import { RichInline } from "@/components/RichInline";
import { richHasText } from "@/lib/rich-text";

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
  const query = await searchParams;
  const previewId = query?.["cms-tour"];
  let editing = false;
  let globalCancellation: string | undefined;
  if (typeof previewId === "string") {
    const staff = await session();
    if (staff && ["admin", "operator"].includes(staff.role)) {
      editing = true;
      const state = await readState({ generateSlots: false });
      globalCancellation = cancellationNote(undefined, state.settings);
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
  if (editing && query?.["cms-card"] === "1") return (
    <div className="mx-auto max-w-md py-8"><CmsPreviewMount id="cms-tour-card" /></div>
  );
  const price = tourHeadlinePrice(tour);
  const adultEuro = estimatedEuroPrice(
    tour.priceCategories?.find(({ id }) => id === "adults")?.estimatedEuroCents,
  );
  const duration = tour.durationLabel || minutesToLabel(tour.durationMinutes);
  const bookingDeadline = bookingDeadlineNote(tour);
  const content = await publicSiteContent();
  const whatsappHref = (m: string) => contentWhatsapp(content, m);
  const copy = tour.detailCopy ?? {};
  const label = (key: keyof NonNullable<typeof tour.detailCopy>, fallback: string) => (
    <TourEditableText tour={tour} path={`detailCopy.${key}`} text={copy[key]?.trim() || fallback} fallback={fallback} />
  );

  return (
    <section data-tour-id={tour.id} className={`${ui.page} ${ui.detail} pb-20 pt-10`}>
      <RemovedTourText tour={tour} />
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
            {richHasText(tour.formattedCopy?.title) ? (
              <RichInline
                as="h1"
                html={tour.formattedCopy!.title!}
                className="display-xl tour-detail-title mb-0 min-w-0"
                data-tour-field="formattedCopy.title"
                data-tour-kind="inline"
              />
            ) : (
              <h1
                data-tour-field="formattedCopy.title"
                data-tour-kind="inline"
                className="display-xl tour-detail-title mb-0 min-w-0"
              >
                {tour.title}
              </h1>
            )}
            <div className={ui.detailOffer}>
              <div className={ui.detailPrice}>
                <span>
                  {label(
                    "priceLabel",
                    price.isFree ? "Prezzo" : "Tariffa intera adulti",
                  )}
                </span>
                <strong>
                  {adultEuro
                    ? formatMoney(price.priceCents, tour.currency)
                    : price.text}
                </strong>
                {adultEuro && (
                  <span>
                    {adultEuro} {label("pricePersonLabel", "a persona")}
                  </span>
                )}
                {price.isFree && tour.suggestedContribution && (
                  <span>Offerta consigliata {tour.suggestedContribution}</span>
                )}
              </div>
              <div className={ui.detailMeta}>
                <span>
                  <Clock3 size={15} aria-hidden />{" "}
                  <TourEditableText tour={tour} path="durationLabel" text={duration} fallback={minutesToLabel(tour.durationMinutes)} />
                </span>
                <span>
                  <Users size={15} aria-hidden />{" "}
                  {label("guidePrefix", "Guida in")}{" "}
                  <span>{tour.language}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {editing ? <CmsPreviewMount id="cms-tour-gallery" /> : <TourGallery
          key={tour.id}
          title={tour.title}
          photos={tourPhotos(tour)}
          editPaths={tourPhotos(tour).map((photo) =>
            photo.url === tour.imageUrl
              ? "imageUrl"
              : `galleryImages.${tourGalleryImages(tour).findIndex((p) => p.url === photo.url)}.url`,
          )}
        />}

        <nav aria-label="Sezioni del tour" className={ui.tourSectionNav}>
          {(
            [
              ["esperienza", label("navDescrizione", "Descrizione")],
              ["dettagli", label("navItinerario", "Itinerario")],
              ["incontro", label("navInfo", "Informazioni utili")],
              ["cancellazione", label("navCancellazione", "Cancellazione")],
              ["punto-incontro", label("navIncontro", "Punto di incontro")],
              ["recensioni", label("navRecensioni", "Recensioni")],
            ] as const
          ).map(([id, text]) => (
            <a key={id} href={`#${id}`} data-tour-hide-parent>
              {text}
            </a>
          ))}
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-10">
            <section id="esperienza">
              <h2 className="display-md mb-4">
                {label("headingDescrizione", "Descrizione")}
              </h2>
              <div
                className="body-md"
                data-tour-field="descriptionHtml"
                data-tour-kind="html"
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
              <h2 className="display-md mb-4">
                {label("headingItinerario", "Itinerario")}
              </h2>
              {editing ? <CmsPreviewMount id="cms-tour-highlights" /> : <TourItinerary tour={tour} />}
            </section>
            <section id="incontro">
              <h2 className="display-md mb-4">
                {label("headingInfo", "Informazioni utili")}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`card p-6 ${panels.practicalPanel}`}>
                  <h3 className="display-sm mb-3 flex items-center gap-2"><PackageCheck aria-hidden /> {label("headingIncluso", "Incluso")}</h3>
                  {editing ? <CmsPreviewMount id="cms-tour-inclusions" /> : <TourInfoList tour={tour} field="inclusions" />}
                  {editing ? (
                    <CmsPreviewMount id="cms-tour-exclusions" />
                  ) : (
                    <TourInfoList
                      tour={tour}
                      field="exclusions"
                      heading={
                        <h3 className="display-sm mb-3 mt-5">
                          {label("headingEscluso", "Non incluso")}
                        </h3>
                      }
                    />
                  )}
                </div>
                <div className={`card p-6 ${panels.practicalPanel}`}>
                  <h3 className="display-sm mb-3 flex items-center gap-2"><Info aria-hidden /> {label("headingPratiche", "Informazioni pratiche")}</h3>
                  <ul className={`${panels.practicalList} body-md mb-3`}>
                    {(tour.operatingDays || tour.departureTime) && (
                      <li>
                        <Clock3 size={17} aria-hidden /> <span><strong>Partenze</strong> ·{" "}
                        {[tour.operatingDays, tour.departureTime]
                          .filter(Boolean)
                          .join(" · ")}</span>
                      </li>
                    )}
                    <li>
                      <Clock3 size={17} aria-hidden /> <span><strong>Durata</strong> · {duration}</span>
                    </li>
                    {!!tour.arrivalMinutes && (
                      <li>
                        <Clock3 size={17} aria-hidden /> <span>Arriva {tour.arrivalMinutes} minuti prima della partenza.</span>
                      </li>
                    )}
                    {(tour.fareRequirements || editing) && <li><Ticket size={17} aria-hidden /><TourEditableText tour={tour} path="fareRequirements" text={tour.fareRequirements || "Requisiti tariffari facoltativi"} fallback="Requisiti tariffari facoltativi" /></li>}
                  </ul>
                  {editing ? <CmsPreviewMount id="cms-tour-safetyNotes" /> : <TourInfoList tour={tour} field="safetyNotes" />}
                </div>
              </div>
            </section>
            <section id="cancellazione" className="card grid gap-3 p-6">
              <h2 className="display-md">
                {label("headingCancellazione", "Cancellazione")}
              </h2>
              <p className="body-md whitespace-pre-wrap">
                <TourEditableText tour={tour} path="cancellationClause" text={cancellationNote(tour)} fallback={globalCancellation} />
              </p>
              {bookingDeadline && <p className="body-md">{bookingDeadline}</p>}
            </section>
            <GoogleMap tour={tour} preview={editing} />
            <section id="recensioni">
              <h2 className="display-md mb-4">
                {label("headingRecensioni", "Recensioni")}
              </h2>
              <TripAdvisorSection layout="card" />
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
                  {label(
                    "whatsappTitle",
                    "Hai dubbi o domande prima di prenotare?",
                  )}
                </h2>
              </div>
              <p className="body-sm mb-5 !text-hairline-soft">
                {label(
                  "whatsappBody",
                  "Il nostro team in italiano ti aiuta a organizzare la visita a Praga.",
                )}
              </p>
              <a
                data-tour-hide-parent
                className="button-primary !bg-[var(--whatsapp)] !text-white hover:!bg-[#148a3e]"
                href={whatsappHref(
                  `Ciao FreeTourPraga, mi trovo nella pagina del tour ${tour.title} e vorrei un'informazione rapida sulla disponibilità.`,
                )}
              >
                {label("whatsappCta", "Scrivici su WhatsApp")}
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
