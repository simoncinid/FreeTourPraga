import Link from "next/link";
import { ArrowRight, Headset, MapPin, ShieldCheck, Users } from "lucide-react";
import { publicSiteContent } from "@/lib/platform/public";

export const dynamic = "force-dynamic";

const icons = [ShieldCheck, Users, MapPin, Headset];

export default async function Page() {
  const { home } = await publicSiteContent();
  return (
    <section className="section">
      <div className="container-page max-w-4xl">
        <p className="uppercase-tag mb-4 text-primary">Chi siamo</p>
        <h1 className="display-xl mb-6">
          {home.trustTitle.split("\n").map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="body-md mb-10 max-w-3xl">{home.trustBody}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {home.pillars.map((pillar, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article key={pillar.title} className="card p-6">
                <Icon className="mb-4 text-primary" size={26} />
                <h2 className="title-md">{pillar.title}</h2>
                <p className="body-sm mt-3">{pillar.text}</p>
              </article>
            );
          })}
        </div>
        <Link href="/tour" className="button-primary mt-10">
          I nostri tour
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

export const metadata = {
  title: "Chi siamo",
  description:
    "Guide certificate residenti a Praga, gruppi a numero chiuso e assistenza in italiano tutti i giorni.",
  alternates: { canonical: "/chi-siamo" },
};
