import Image from "next/image";
import styles from "./home.module.css";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { ExperienceRotator } from "@/components/ExperienceRotator";
import { HomeGallery } from "@/components/HomeGallery";
import { HeroTourCta } from "@/components/HeroTourCta";
import { catalog, publicPage, publicSiteContent } from "@/lib/platform/public";
import type { SiteContent } from "@/lib/platform/content";
import type { Tour } from "@/lib/types";

export const dynamic = "force-dynamic";

const featureIcons = [
  "/images/illustrated/italian.webp",
  "/images/illustrated/shield.webp",
  "/images/illustrated/calendar.webp",
  "/images/illustrated/support.webp",
];
const pillarIcons = [
  "/images/illustrated/shield.webp",
  "/images/illustrated/group.webp",
  "/images/illustrated/pin.webp",
  "/images/illustrated/support.webp",
];

/** Tab homepage: una categoria admin con almeno un tour pubblicato. */
function groupsFromCatalog(
  tours: Tour[],
  cmsGroups: SiteContent["home"]["groups"],
) {
  const subtitleByKey = new Map(
    cmsGroups.map((group) => [
      group.title.trim().toLocaleLowerCase("it"),
      group.subtitle,
    ]),
  );
  const order = cmsGroups.map((group) =>
    group.title.trim().toLocaleLowerCase("it"),
  );
  const byCategory = new Map<string, Tour[]>();
  for (const tour of tours) {
    const title = tour.category.trim() || "Altri tour";
    const list = byCategory.get(title) ?? [];
    list.push(tour);
    byCategory.set(title, list);
  }
  return [...byCategory.keys()]
    .sort((a, b) => {
      const ia = order.indexOf(a.toLocaleLowerCase("it"));
      const ib = order.indexOf(b.toLocaleLowerCase("it"));
      if (ia === -1 && ib === -1) return a.localeCompare(b, "it");
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map((title) => ({
      title,
      subtitle:
        subtitleByKey.get(title.toLocaleLowerCase("it")) ||
        "Esperienze selezionate in questa categoria.",
      items: (byCategory.get(title) ?? []).map((tour) => ({
        title: tour.title,
        tour,
      })),
    }));
}

export default async function HomePage() {
  const [tours, c] = await Promise.all([
    catalog(),
    publicSiteContent(),
  ]);
  const h = c.home;
  const groups = groupsFromCatalog(tours, h.groups);
  return (
    <div className={styles.home}>
      <div className={styles.aboveFold}>
        <section className={`${styles.hero} relative isolate overflow-hidden bg-navy text-white`}>
          <Image
            src={h.heroImage}
            alt="Praga"
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
          <div className="hero-overlay" aria-hidden />
          <div className={`${styles.heroInner} container-page relative z-10 grid items-center py-20`}>
            <div className={`${styles.heroCopy} max-w-2xl`}>
              <p className="uppercase-tag mb-5 text-primary">
                {h.heroEyebrow}
              </p>
              <h1 className="display-xl hero-title mb-5 !text-white">
                {(h.heroTitle) === "Scopri l'anima autentica di Praga, in totale sicurezza." ? <>Scopri l&apos;anima autentica <span className={styles.keepTogether}>di Praga,</span> in totale sicurezza.</> : h.heroTitle}
              </h1>
              <div className={styles.heroCtaBlock}>
                <p className="body-md mb-8 !text-white/90">{h.heroBody}</p>
                <HeroTourCta
                  href={h.primaryHref}
                  label={h.primaryLabel}
                  tours={tours.map((t) => ({
                    title: t.title,
                    imageUrl: t.imageUrl,
                    slug: t.slug,
                  }))}
                />
              </div>
            </div>
          </div>
        </section>
        {h.stats.length > 0 && (
          <section className={`${styles.stats} border-b bg-white py-10`}>
            <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {h.stats.map((item, index) => {
                const icon = featureIcons[index % featureIcons.length];
                return (
                  <div key={item.value} className={`${styles.benefit} flex`}>
                    <Image
                      src={icon}
                      alt=""
                      width={56}
                      height={56}
                      sizes="56px"
                      className={styles.benefitIcon}
                    />
                    <div>
                      <strong className="title-md block">{item.value}</strong>
                      <p className="body-sm mt-1">{item.label}</p>
                    </div>
                  </div>
                );
              })}
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
            <ExperienceRotator groups={groups} />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </section>
      <section className={`${styles.trust} editorial-section bg-navy text-on-dark`}>
        <div className="container-page grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="uppercase-tag mb-3 text-primary">{h.trustEyebrow}</p>
            <h2 className="display-lg !text-white">
              {h.trustTitle.split("\n").map((line, index) => (
                <span key={index} className="block">
                  {line.split(/(nostro ospite)/i).map((part, partIndex) =>
                    part.toLocaleLowerCase("it") === "nostro ospite" ? (
                      <span key={partIndex} className={styles.trustAccent}>{part}</span>
                    ) : part,
                  )}
                </span>
              ))}
            </h2>
            <p className="body-md mt-5 !text-white/85">{h.trustBody}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {h.pillars.map((pillar, index) => {
              const icon = pillarIcons[index % pillarIcons.length];
              return (
                <article
                  key={pillar.title}
                  className={styles.trustCard}
                >
                  <div className={styles.trustCardHeading}>
                    <Image
                      src={icon}
                      alt=""
                      width={48}
                      height={48}
                      sizes="48px"
                      className={styles.trustIcon}
                    />
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
          <p className={`${styles.galleryLead} body-md mb-8`}>{h.galleryBody}</p>
          <HomeGallery items={c.gallery} />
        </div>
      </section>
      <TripAdvisorSection />
      <section className={`${styles.partnerSection} editorial-section`}>
        <div className="container-page">
          <div className={styles.partnerPanel}>
            <div className={styles.partnerCopy}>
              <p className="uppercase-tag text-primary">{h.partnerEyebrow}</p>
              <h2 className="display-lg">{h.partnerTitle.split(/(su misura)/i).map((part, index) => part.toLowerCase() === "su misura" ? <em key={index}>{part}</em> : part)}</h2>
              <p className="body-md">{h.partnerBody}</p>
              <Link href="/partner-europa" className={`button-primary ${styles.partnerCta}`}>
                {h.partnerLabel}
                <ArrowRight size={20} className={styles.partnerCtaArrow} aria-hidden />
              </Link>
            </div>
            <div className={styles.partnerArtwork}>
              <span className={styles.partnerOrbit} aria-hidden />
              <div className={styles.travelTicket}>
                <div className={styles.ticketTop}><span>FreeTourPraga</span><span>Viaggi su misura</span></div>
                <div className={styles.ticketDestination}><span>Prossima fermata</span><strong>PRAGA<span>↗</span></strong></div>
                <div className={styles.ticketRoute}><span>La tua idea</span><span className={styles.routeLine} aria-hidden /><span>Il nostro itinerario</span></div>
                <div className={styles.ticketDetails}><span>Scuole & gruppi</span><span>Hotel & agenzie</span></div>
                <div className={styles.ticketBottom}><span>Un unico contatto.<br /><strong>Tutto in italiano.</strong></span><span className={styles.ticketStamp}>Fatto per<br /><strong>VOI</strong></span></div>
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
  const title = p?.seoTitle || historicalSeo?.seoTitle || `${c.globals.brandName} - Tour guidati in italiano`;
  const description = p?.seoDescription || historicalSeo?.seoDescription || c.globals.description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", type: "website", locale: "it_IT", images: [{ url: c.home.heroImage, alt: "Free Tour Praga in italiano" }] },
    twitter: { card: "summary_large_image" as const, title, description, images: [c.home.heroImage] },
  };
}
