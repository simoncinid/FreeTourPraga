import { SectionBlocks } from "@/components/SectionBlocks";
import Image from "next/image";
import { readState } from "@/lib/platform/store";
import { CollaborationPage } from "@/components/CollaborationPage";
import { publicPage } from "@/lib/platform/public";
import { partnerBenefits } from "@/lib/collaboration-content";

export const dynamic = "force-dynamic";

const baseMetadata = {
  title: "Partner Europa",
  description: "Tour in italiano per scuole, gruppi, hotel e agenzie a Praga.",
  alternates: { canonical: "/partner-europa" },
};

export default async function Page() {
  const page = await publicPage("partner-europa");
  const partners =
    (await readState()).partners?.filter((p) => p.published && !p.deleted) ??
    [];
  return (
    <>
      <CollaborationPage
        eyebrow={page?.subtitle || "Partner Europa"}
        title="Partner Europa"
        titleLines={
          page?.title
            ? [page.title]
            : ["Grandi esperienze.", "Organizzate insieme."]
        }
        body={
          page?.body ||
          "Scuole in viaggio, gruppi da accompagnare, ospiti da consigliare: siamo il tuo riferimento locale per scoprire Praga in italiano."
        }
        formVariant="partner"
        benefits={page?.benefits ?? partnerBenefits}
      />
      <div className="container-page pb-8">
        <SectionBlocks blocks={page?.contentBlocks} />
      </div>
      {partners.length > 0 && (
        <section className="container-page pb-16">
          <h2 className="display-lg mb-6">I nostri partner in Europa</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => (
              <article
                key={p.id}
                className="card grid content-start gap-4 overflow-hidden p-6"
              >
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-contain"
                  />
                )}
                <h3 className="display-md">{p.name}</h3>
                <p className="whitespace-pre-wrap">{p.description}</p>
                {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
                {p.phone && <a href={`tel:${p.phone}`}>{p.phone}</a>}
                <a
                  href={`/api/platform/partner/${encodeURIComponent(p.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-primary"
                >
                  Visita il sito
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export async function generateMetadata() {
  const p = await publicPage("partner-europa");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
