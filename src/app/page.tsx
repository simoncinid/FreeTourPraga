import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Headset,
  Languages,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { ExperienceRotator } from "@/components/ExperienceRotator";
import { PracticalAnswers } from "@/components/PracticalAnswers";
import { catalog, publicPage, publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp, type SiteContent } from "@/lib/platform/content";
import { guideAnchor } from "@/lib/format";
import type { Tour } from "@/lib/types";

export const dynamic = "force-dynamic";

const featureIcons = [Languages, BadgeCheck, CalendarCheck, MessageCircle];
const pillarIcons = [ShieldCheck, Users, MapPin, Headset];

function liveGroups(groups: SiteContent["home"]["groups"], tours: Tour[]) {
  const bySlug = new Map(tours.map((tour) => [tour.slug, tour]));
  return groups.map((group) => ({
    title: group.title,
    subtitle: group.subtitle,
    items: group.items.map((item) => {
      const slug = item.href.startsWith("/tour/")
        ? item.href.slice("/tour/".length)
        : "";
      const tour = slug ? bySlug.get(slug) : undefined;
      return tour
        ? { title: item.title, tour }
        : { title: item.title, href: "/contatti" };
    }),
  }));
}

export default async function HomePage() {
  const [tours, page, c] = await Promise.all([
    catalog(),
    publicPage("homepage"),
    publicSiteContent(),
  ]);
  const h = c.home;
  const groups = liveGroups(h.groups, tours);
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image
          src={h.heroImage}
          alt="Praga"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="hero-overlay" aria-hidden />
        <div className="container-page relative z-10 grid min-h-[570px] items-center py-20">
          <div className="max-w-2xl">
            <p className="uppercase-tag mb-5 text-primary">
              {page?.subtitle || h.heroEyebrow}
            </p>
            <h1 className="display-xl hero-title mb-5 !text-white">
              {page?.title || h.heroTitle}
            </h1>
            <p className="body-md mb-8 max-w-xl !text-white/90">
              {page?.body || h.heroBody}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={h.primaryHref} className="button-primary">
                {h.primaryLabel}
                <ArrowRight size={18} />
              </Link>
              <a
                className="button-secondary hero-cta"
                href={contentWhatsapp(
                  c,
                  "Ciao, vorrei informazioni sui tour in italiano.",
                )}
              >
                <MessageCircle size={18} />
                {h.secondaryLabel}
              </a>
            </div>
          </div>
        </div>
      </section>
      {h.stats.length > 0 && (
        <section className="border-b bg-white py-10">
          <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {h.stats.map((item, index) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <div key={item.value} className="flex gap-4">
                  <Icon className="mt-0.5 shrink-0 text-primary" size={28} />
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
      <section className="editorial-section">
        <div className="container-page">
          <p className="uppercase-tag mb-3 text-primary">{h.toursEyebrow}</p>
          <h2 className="display-lg mb-3">{h.toursTitle}</h2>
          <p className="body-md mb-8 max-w-3xl">{h.toursBody}</p>
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
      <section className="editorial-section bg-navy text-on-dark">
        <div className="container-page grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="uppercase-tag mb-3 text-primary">{h.trustEyebrow}</p>
            <h2 className="display-lg !text-white">
              {h.trustTitle.split("\n").map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="body-md mt-5 !text-white/85">{h.trustBody}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {h.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <article
                  key={pillar.title}
                  className="rounded-lg border border-white/15 bg-white/5 p-5"
                >
                  <Icon size={24} className="mb-4 text-primary" />
                  <h3 className="title-md !text-white">{pillar.title}</h3>
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
          <p className="body-md mb-8 max-w-3xl">{h.galleryBody}</p>
          {c.gallery.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.gallery.map((photo) => (
                <Link
                  key={photo.title}
                  href={`/blog#${guideAnchor(photo.title)}`}
                  className="card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <figure>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={photo.imageUrl}
                        alt={photo.title}
                        fill
                        sizes="(min-width:1024px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="p-5">
                      <strong className="title-md">{photo.title}</strong>
                      <p className="body-sm mt-2">{photo.caption}</p>
                    </figcaption>
                  </figure>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      {c.answers.length > 0 && (
        <section className="editorial-section bg-surface-soft">
          <div className="container-page">
            <h2 className="display-lg mb-4">{h.answersTitle}</h2>
            <p className="body-md mb-8 max-w-3xl">{h.answersBody}</p>
            <PracticalAnswers items={c.answers} />
          </div>
        </section>
      )}
      <section className="editorial-section">
        <div className="container-page max-w-4xl">
          <p className="uppercase-tag mb-3 text-primary">{h.partnerEyebrow}</p>
          <h2 className="display-lg mb-4">{h.partnerTitle}</h2>
          <p className="body-md mb-6">{h.partnerBody}</p>
          <Link href="/partner-europa" className="button-primary">
            {h.partnerLabel}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <TripAdvisorSection />
    </>
  );
}

export async function generateMetadata() {
  const [p, c] = await Promise.all([
    publicPage("homepage"),
    publicSiteContent(),
  ]);
  return {
    title: p?.seoTitle || `${c.globals.brandName} - Tour guidati in italiano`,
    description: p?.seoDescription || c.globals.description,
  };
}
