import { MeetingPoints } from "@/components/MeetingPoints";
import { SectionBlocks } from "@/components/SectionBlocks";
import { contentWhatsapp } from "@/lib/platform/content";
import Image from "next/image";
import styles from "./home.module.css";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Headset,
  Languages,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { ExperienceRotator } from "@/components/ExperienceRotator";
import { HomeGallery } from "@/components/HomeGallery";
import { HomeAnswers } from "@/components/HomeAnswers";
import { HeroTourCta } from "@/components/HeroTourCta";
import { catalog, publicPage, publicSiteContent } from "@/lib/platform/public";
import type { SiteContent } from "@/lib/platform/content";
import type { Tour } from "@/lib/types";

export const dynamic = "force-dynamic";

const featureIcons = [Languages, ShieldCheck, CalendarDays, Headset];
const pillarIcons = [ShieldCheck, Users, MapPin, Headset];

/** Tab homepage: una categoria admin con almeno un tour pubblicato. */
function groupsFromCatalog(
  tours: Tour[],
  cmsGroups: SiteContent["home"]["groups"],
) {
  const assigned = new Set<string>();
  const groups = cmsGroups.map((group) => ({
    title: group.title,
    subtitle: group.subtitle,
    items: group.items.map((item) => {
      const tour = tours.find((t) =>
        [t.canonicalPath, `/tour/${t.slug}`, `/tour/${t.slug}/`].includes(
          item.href,
        ),
      );
      if (tour) {
        assigned.add(tour.id);
        return { title: item.title, tour };
      }
      return { title: item.title, href: item.href };
    }),
  }));
  for (const tour of tours.filter((t) => !assigned.has(t.id))) {
    const existing = groups.find(
      (g) =>
        g.title.toLocaleLowerCase("it") ===
        tour.category.toLocaleLowerCase("it"),
    );
    if (existing) existing.items.push({ title: tour.title, tour });
    else
      groups.push({
        title: tour.category,
        subtitle: "",
        items: [{ title: tour.title, tour }],
      });
  }
  return groups;
}

export default async function HomePage() {
  const [tours, c] = await Promise.all([catalog(), publicSiteContent()]);
  const h = c.home;
  const groups = groupsFromCatalog(tours, h.groups);
  return (
    <div className={styles.home}>
      <div className={styles.aboveFold}>
        <section
          className={`${styles.hero} relative isolate overflow-hidden bg-navy text-white`}
        >
          <Image
            src={h.heroImage}
            alt="Praga"
            fill
            preload
            sizes="(max-width: 767px) 0px, 100vw"
            className={`object-cover ${styles.heroPhotoDesktop}`}
          />
          <Image
            src={h.heroImageMobile || h.heroImage}
            alt="Praga"
            fill
            sizes="(max-width: 767px) 100vw, 0px"
            className={`object-cover ${styles.heroPhotoMobile}`}
          />
          <div className="hero-overlay" aria-hidden />
          <div
            className={`${styles.heroInner} container-page relative z-10 grid items-center py-20`}
          >
            <div className={styles.heroCopy}>
              <p className="uppercase-tag mb-5 text-primary">{h.heroEyebrow}</p>
              <h1 className="display-xl hero-title mb-5 !text-white">
                {h.heroTitle ===
                "Free Tour Praga in italiano: scopri la città con noi." ? (
                  <>
                    Free Tour Praga in italiano:
                    <br />
                    scopri la città con noi.
                  </>
                ) : h.heroTitle ===
                  "Scopri l'anima autentica di Praga, in totale sicurezza." ? (
                  <>
                    Scopri l&apos;anima autentica{" "}
                    <span className={styles.keepTogether}>di Praga,</span> in
                    totale sicurezza.
                  </>
                ) : h.heroTitle === "TOUR GUIDATI IN ITALIANO A PRAGA" ? (
                  <>
                    TOUR GUIDATI
                    <br className={styles.heroTitleBreak} /> IN ITALIANO
                    <br className={styles.heroTitleBreak} /> A PRAGA
                  </>
                ) : (
                  h.heroTitle
                )}
              </h1>
              <div className={styles.heroCtaBlock}>
                <p className="body-md mb-8 !text-white/90">{h.heroBody}</p>
                <div className={styles.heroActions}>
                  <HeroTourCta
                    href={h.primaryHref}
                    label={h.primaryLabel}
                    tours={tours.map((t) => ({
                      title: t.title,
                      imageUrl: t.imageUrl,
                      slug: t.slug,
                    }))}
                  />
                  <a
                    className={`button-secondary ${styles.heroWhatsapp}`}
                    href={contentWhatsapp(
                      c,
                      "Ciao, vorrei informazioni sui tour.",
                    )}
                  >
                    {h.secondaryLabel}
                    <span className={styles.heroWhatsappIcon} aria-hidden>
                      <Phone size={14} strokeWidth={2.25} />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {h.stats.length > 0 && (
          <section className={`${styles.stats} border-b bg-white py-8`}>
            <div className="container-page">
              <ul
                className={styles.benefits}
                aria-label="I vantaggi di prenotare con noi"
              >
                {h.stats.map((item, index) => {
                  const Icon = featureIcons[index % featureIcons.length];
                  const titleWords = item.value.trim().split(/\s+/);
                  const titleMid = Math.ceil(titleWords.length / 2);
                  return (
                    <li key={item.value} className={styles.benefit}>
                      <Icon
                        size={28}
                        className={styles.benefitIcon}
                        aria-hidden
                      />
                      <div>
                        <strong className={styles.benefitTitle}>
                          {titleWords.slice(0, titleMid).join(" ")}
                          {titleWords.length > 1 ? (
                            <>
                              {" "}
                              <br className={styles.benefitTitleBreak} />
                            </>
                          ) : null}
                          {titleWords.slice(titleMid).join(" ")}
                        </strong>
                        <p className={styles.benefitLabel}>{item.label}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </div>
      <section className="editorial-section">
        <div className="container-page">
          <p className="uppercase-tag mb-3 text-primary">{h.toursEyebrow}</p>
          <h2 className="display-lg mb-3">{h.toursTitle}</h2>
          <p className={`${styles.toursLead} body-md mb-8`}>{h.toursBody}</p>
          {groups.length > 0 ? (
            <ExperienceRotator
              groups={groups}
              intervalSeconds={h.carouselIntervalSeconds}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </section>
      <section
        className={`${styles.trust} editorial-section bg-navy text-on-dark`}
      >
        <div className="container-page grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="uppercase-tag mb-3 text-primary">{h.trustEyebrow}</p>
            <h2 className="display-lg !text-white">
              {h.trustTitle.split("\n").map((line, index) => (
                <span key={index} className="block">
                  {line.split(/(nostro ospite)/i).map((part, partIndex) =>
                    part.toLocaleLowerCase("it") === "nostro ospite" ? (
                      <span key={partIndex} className={styles.trustAccent}>
                        {part}
                      </span>
                    ) : (
                      part
                    ),
                  )}
                </span>
              ))}
            </h2>
            <p className="body-md mt-5 !text-white/85">{h.trustBody}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {h.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <article key={pillar.title} className={styles.trustCard}>
                  <div className={styles.trustCardHeading}>
                    <Icon size={36} className={styles.trustIcon} aria-hidden />
                    <h3 className="title-md !text-white">{pillar.title}</h3>
                  </div>
                  <p className="body-sm mt-3 !text-white/80">{pillar.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="editorial-section">
        <div className="container-page">
          <p className="uppercase-tag mb-3 text-primary">{h.galleryEyebrow}</p>
          <h2 className="display-lg mb-3">{h.galleryTitle}</h2>
          <p className={`${styles.galleryLead} body-md mb-8`}>
            {h.galleryBody}
          </p>
          <HomeGallery items={c.gallery} />
        </div>
      </section>
      <section className="container-page py-12">
        <h2 className="display-lg mb-3">{h.answersTitle}</h2>
        <p className="mb-6">{h.answersBody}</p>
        <HomeAnswers items={c.answers} />
      </section>
      <MeetingPoints
        points={[
          {
            label: "Punto standard — Teatro degli Stati",
            address: c.globals.address,
            mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(c.globals.address)}`,
          },
          ...(c.globals.castleMeetingAddress
            ? [
                {
                  label: "Castello di Praga con interni",
                  address: c.globals.castleMeetingAddress,
                  mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(c.globals.castleMeetingAddress)}`,
                },
              ]
            : []),
        ]}
      />
      <TripAdvisorSection />
      {!!h.contentBlocks?.length && (
        <section className="container-page py-12">
          <SectionBlocks blocks={h.contentBlocks} />
        </section>
      )}
      <section className={`${styles.partnerSection} editorial-section`}>
        <div className="container-page">
          <div className={styles.partnerPanel}>
            <div className={styles.partnerCopy}>
              <p className="uppercase-tag text-primary">{h.partnerEyebrow}</p>
              <h2 className="display-lg">
                {h.partnerTitle
                  .split(/(su misura)/i)
                  .map((part, index) =>
                    part.toLowerCase() === "su misura" ? (
                      <em key={index}>{part}</em>
                    ) : (
                      part
                    ),
                  )}
              </h2>
              <p className="body-md">{h.partnerBody}</p>
              <Link
                href="/partner-europa"
                className={`button-primary ${styles.partnerCta}`}
              >
                {h.partnerLabel}
                <ArrowRight
                  size={20}
                  className={styles.partnerCtaArrow}
                  aria-hidden
                />
              </Link>
            </div>
            <div className={styles.partnerArtwork}>
              <span className={styles.partnerOrbit} aria-hidden />
              <div className={styles.travelTicket}>
                <div className={styles.ticketTop}>
                  <span>FreeTourPraga</span>
                  <span>Viaggi su misura</span>
                </div>
                <div className={styles.ticketDestination}>
                  <span>Prossima fermata</span>
                  <strong>
                    PRAGA<span>↗</span>
                  </strong>
                </div>
                <div className={styles.ticketRoute}>
                  <span>La tua idea</span>
                  <span className={styles.routeLine} aria-hidden />
                  <span>Il nostro itinerario</span>
                </div>
                <div className={styles.ticketDetails}>
                  <span>Scuole & gruppi</span>
                  <span>Hotel & agenzie</span>
                </div>
                <div className={styles.ticketBottom}>
                  <span>
                    Un unico contatto.
                    <br />
                    <strong>Tutto in italiano.</strong>
                  </span>
                  <span className={styles.ticketStamp}>
                    Fatto per
                    <br />
                    <strong>VOI</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  const [p, c, historicalSeo] = await Promise.all([
    publicPage("homepage"),
    publicSiteContent(),
    publicPage("legacy-homepage-seo"),
  ]);
  const title =
    p?.seoTitle ||
    historicalSeo?.seoTitle ||
    `${c.globals.brandName} - Tour guidati in italiano`;
  const description =
    p?.seoDescription || historicalSeo?.seoDescription || c.globals.description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      type: "website",
      locale: "it_IT",
      images: [{ url: c.home.heroImage, alt: "Free Tour Praga in italiano" }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [c.home.heroImage],
    },
  };
}
