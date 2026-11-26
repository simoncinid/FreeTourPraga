import { SiteInlineText, SiteRichText, siteInlineEdit } from "@/components/SiteRichText";
import { RichInline } from "@/components/RichInline";
import { siteEdit } from "@/lib/visual-content";
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
  const groups = cmsGroups.map((group, editIndex) => ({
    editIndex: editIndex as number | undefined,
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
        editIndex: undefined,
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
          data-cms-background="hero"
          className={`${styles.hero} relative isolate overflow-hidden bg-navy text-white`}
        >
          <Image
            {...siteEdit("home.heroImage", "image")}
            src={h.heroImage}
            alt="Praga"
            fill
            preload
            sizes="(max-width: 767px) 0px, 100vw"
            className={`object-cover ${styles.heroPhotoDesktop}`}
          />
          <Image
            {...siteEdit("home.heroImageMobile", "image")}
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
              <p
                {...siteInlineEdit("home.heroEyebrow")}
                className="uppercase-tag mb-5 text-primary"
              >
                <SiteInlineText content={c} path="home.heroEyebrow">{h.heroEyebrow}</SiteInlineText>
              </p>
              <h1
                {...siteInlineEdit("home.heroTitle")}
                className="display-xl hero-title mb-5 !text-white"
              >
                <SiteInlineText content={c} path="home.heroTitle">{h.heroTitle}</SiteInlineText>
              </h1>
              <div className={styles.heroCtaBlock}>
                <SiteRichText content={c} path="home.heroBody" text={h.heroBody} className="body-md mb-8 !text-white/90" />
                <div className={styles.heroActions}>
                  <HeroTourCta
                    href={h.primaryHref}
                    label={h.primaryLabel}
                    labelHtml={c.formattedText?.["home-primaryLabel"]}
                    tours={tours.map((t) => ({
                      title: t.title,
                      imageUrl: t.imageUrl,
                      slug: t.slug,
                    }))}
                  />
                  <a
                    data-cms-hide-parent
                    className={`button-secondary ${styles.heroWhatsapp}`}
                    href={contentWhatsapp(
                      c,
                      "Ciao, vorrei informazioni sui tour.",
                    )}
                  >
                    <span {...siteInlineEdit("home.secondaryLabel")}>
                      <SiteInlineText content={c} path="home.secondaryLabel">{h.secondaryLabel}</SiteInlineText>
                    </span>
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
                        <strong
                          {...siteInlineEdit(`home.stats.${index}.value`)}
                          className={styles.benefitTitle}
                        >
                          <SiteInlineText content={c} path={`home.stats.${index}.value`}>
                          {titleWords.slice(0, titleMid).join(" ")}
                          {titleWords.length > 1 ? (
                            <>
                              {" "}
                              <br className={styles.benefitTitleBreak} />
                            </>
                          ) : null}
                          {titleWords.slice(titleMid).join(" ")}
                          </SiteInlineText>
                        </strong>
                        <p
                          {...siteInlineEdit(`home.stats.${index}.label`)}
                          className={styles.benefitLabel}
                        >
                          <SiteInlineText content={c} path={`home.stats.${index}.label`}>{item.label}</SiteInlineText>
                        </p>
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
          <p
            {...siteInlineEdit("home.toursEyebrow")}
            className="uppercase-tag mb-3 text-primary"
          >
            <SiteInlineText content={c} path="home.toursEyebrow">{h.toursEyebrow}</SiteInlineText>
          </p>
          <h2 {...siteInlineEdit("home.toursTitle")} className="display-lg mb-3">
            <SiteInlineText content={c} path="home.toursTitle">{h.toursTitle}</SiteInlineText>
          </h2>
          <SiteRichText content={c} path="home.toursBody" text={h.toursBody} className={`${styles.toursLead} body-md mb-8`} />
          {groups.length > 0 ? (
            <ExperienceRotator
              groups={groups}
              formattedText={c.formattedText}
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
            <p
              {...siteInlineEdit("home.trustEyebrow")}
              className="uppercase-tag mb-3 text-primary"
            >
              <SiteInlineText content={c} path="home.trustEyebrow">{h.trustEyebrow}</SiteInlineText>
            </p>
            <h2
              {...siteInlineEdit("home.trustTitle")}
              data-cms-multiline="true"
              className="display-lg !text-white"
            >
              <SiteInlineText content={c} path="home.trustTitle">
                {h.trustTitle.split(/(nostro ospite)/i).map((part, index) =>
                part.toLocaleLowerCase("it") === "nostro ospite" ? (
                  <span key={index} className={styles.trustAccent}>
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
              </SiteInlineText>
            </h2>
            <SiteRichText content={c} path="home.trustBody" text={h.trustBody} className="body-md mt-5 !text-white/85" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {h.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <article key={pillar.title} className={styles.trustCard}>
                  <div className={styles.trustCardHeading}>
                    <Icon size={36} className={styles.trustIcon} aria-hidden />
                    <h3 {...siteInlineEdit(`home.pillars.${index}.title`)} className="title-md !text-white">
                      <SiteInlineText content={c} path={`home.pillars.${index}.title`}>
                        {/<[a-z][\s\S]*>/i.test(pillar.title)
                          ? <RichInline html={pillar.title} />
                          : pillar.title}
                      </SiteInlineText>
                    </h3>
                  </div>
                  <SiteRichText content={c} path={`home.pillars.${index}.text`} text={pillar.text} className="body-sm mt-3 !text-white/80" />
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="editorial-section">
        <div className="container-page">
          <p
            {...siteInlineEdit("home.galleryEyebrow")}
            className="uppercase-tag mb-3 text-primary"
          >
            <SiteInlineText content={c} path="home.galleryEyebrow">{h.galleryEyebrow}</SiteInlineText>
          </p>
          <h2 {...siteInlineEdit("home.galleryTitle")} className="display-lg mb-3">
            <SiteInlineText content={c} path="home.galleryTitle">{h.galleryTitle}</SiteInlineText>
          </h2>
          <SiteRichText content={c} path="home.galleryBody" text={h.galleryBody} className={`${styles.galleryLead} body-md mb-8`} />
          <HomeGallery
            items={c.gallery.filter((item) => item.channel !== "useful")}
          />
        </div>
      </section>
      <section className="container-page py-12">
        <h2 {...siteInlineEdit("home.answersTitle")} className="display-lg mb-3">
          <SiteInlineText content={c} path="home.answersTitle">{h.answersTitle}</SiteInlineText>
        </h2>
        <SiteRichText content={c} path="home.answersBody" text={h.answersBody} className="mb-6" />
        <HomeAnswers items={c.answers} formattedText={c.formattedText} />
      </section>
      <MeetingPoints
        points={[
          {
            label: "Punto standard — Teatro degli Stati",
            address: c.globals.address,
            binding: "globals.address",
            addressHtml: c.formattedText?.["globals-address"],
            mapUrl: `https://www.google.com/maps?q=${encodeURIComponent(c.globals.address)}`,
          },
          ...(c.globals.castleMeetingAddress
            ? [
                {
                  label: "Castello di Praga con interni",
                  address: c.globals.castleMeetingAddress,
                  binding: "globals.castleMeetingAddress",
                  addressHtml: c.formattedText?.["globals-castleMeetingAddress"],
                  mapUrl: "https://maps.app.goo.gl/W3UdjsUfZNNMmhKF7",
                },
              ]
            : []),
        ]}
      />
      <TripAdvisorSection />
      {!!h.contentBlocks?.length && (
        <section className="container-page py-12">
          <SectionBlocks
            binding={{ scope: "site", path: ["home", "contentBlocks"] }}
            blocks={h.contentBlocks}
          />
        </section>
      )}
      <section className={`${styles.partnerSection} editorial-section`}>
        <div className="container-page">
          <div className={styles.partnerPanel}>
            <div className={styles.partnerCopy}>
              <p
                {...siteInlineEdit("home.partnerEyebrow")}
                className="uppercase-tag text-primary"
              >
                <SiteInlineText content={c} path="home.partnerEyebrow">{h.partnerEyebrow}</SiteInlineText>
              </p>
              <h2
                {...siteInlineEdit("home.partnerTitle")}
                data-cms-multiline="true"
                className="display-lg"
              >
                <SiteInlineText content={c} path="home.partnerTitle">
                {h.partnerTitle
                  .split(/(su misura)/i)
                  .map((part, index) =>
                    part.toLowerCase() === "su misura" ? (
                      <em key={index}>{part}</em>
                    ) : (
                      part
                    ),
                  )}
              </SiteInlineText>
            </h2>
              <SiteRichText content={c} path="home.partnerBody" text={h.partnerBody} className="body-md" />
              <Link
                href="/partner-europa"
                className={`button-primary ${styles.partnerCta}`}
              >
                <span {...siteInlineEdit("home.partnerLabel")}><SiteInlineText content={c} path="home.partnerLabel">{h.partnerLabel}</SiteInlineText></span>
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
