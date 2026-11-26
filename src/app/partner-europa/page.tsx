import { InlineCopy } from "@/components/RichInline";
import { partnerEdit } from "@/lib/visual-content";
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
        formatted={page}
        pageKey="partner-europa"
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
        <SectionBlocks
          binding={{
            scope: "page",
            key: "partner-europa",
            path: ["contentBlocks"],
          }}
          blocks={page?.contentBlocks}
        />
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
                    {...partnerEdit(p.id, "imageUrl", "image")}
                    src={p.imageUrl}
                    alt={p.name}
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-contain"
                  />
                )}
                <h3 {...partnerEdit(p.id, "name")} className="display-md">
                  <InlineCopy html={p.formattedText?.name}>{p.name}</InlineCopy>
                </h3>
                <p
                  {...partnerEdit(p.id, "description")}
                  className="whitespace-pre-wrap"
                >
                  <InlineCopy html={p.formattedText?.description}>{p.description}</InlineCopy>
                </p>
                {p.email && (
                  <a {...partnerEdit(p.id, "email")} href={`mailto:${p.email}`}>
                    <InlineCopy html={p.formattedText?.email}>{p.email}</InlineCopy>
                  </a>
                )}
                {p.phone && (
                  <a {...partnerEdit(p.id, "phone")} href={`tel:${p.phone}`}>
                    <InlineCopy html={p.formattedText?.phone}>{p.phone}</InlineCopy>
                  </a>
                )}
                <a
                  {...partnerEdit(p.id, "website", "link", p.website)}
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
