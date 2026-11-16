import { publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
import ui from "@/components/public-ui.module.css";
import Link from "next/link";
import { Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";

export const dynamic = "force-dynamic";

export default async function Page() {
  const page = await publicPage("aiuto");
  if (page) return <ContentBlock page={page} />;
  const c = await publicSiteContent();
  const g = c.globals;
  return (
    <section className={`${ui.page} ${ui.help} section`}>
      <div className="container-page max-w-3xl">
        <p className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}>Assistenza</p>
        <h1 className="display-xl mb-4">Siamo qui per aiutarti.</h1>
        <p className="body-md mb-8">
          Il team in italiano risponde {g.supportHours.toLocaleLowerCase("it")}{" "}
          per informazioni sui tour, il punto d&apos;incontro e l&apos;organizzazione
          del soggiorno.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className="button-primary"
            href={contentWhatsapp(
              c,
              "Ciao, ho bisogno di aiuto per un tour a Praga.",
            )}
          >
            <MessageCircle size={18} />
            Scrivici su WhatsApp
          </a>
          <a className="button-secondary" href={`mailto:${g.email}`}>
            <Mail size={18} />
            {g.email}
          </a>
        </div>
        <div className="mt-10 grid gap-3 text-sm">
          <Link className="underline" href="/informazioni-utili">
            Informazioni utili <ArrowUpRight size={16} />
          </Link>
          <Link className="underline" href="/faq">
            Domande frequenti <ArrowUpRight size={16} />
          </Link>
          <Link className="underline" href="/contatti">
            Contatti <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

const baseMetadata = {
  title: "Aiuto",
  description:
    "Assistenza FreeTourPraga su WhatsApp ed email, tutti i giorni dalle 9:00 alle 19:00.",
  alternates: { canonical: "/aiuto" },
};

export async function generateMetadata() {
  const page = await publicPage("aiuto");
  return { ...baseMetadata, ...(page?.seoTitle ? { title: page.seoTitle } : {}), ...(page?.seoDescription ? { description: page.seoDescription } : {}) };
}
