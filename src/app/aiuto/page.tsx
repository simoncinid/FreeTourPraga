import { InlineCopy } from "@/components/RichInline";
import { pageEdit } from "@/lib/visual-content";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { SectionBlocks } from "@/components/SectionBlocks";
import { RichContent } from "@/components/RichContent";
import ui from "@/components/public-ui.module.css";
import { contentWhatsapp } from "@/lib/platform/content";
import { publicPage, publicSiteContent } from "@/lib/platform/public";

export const dynamic = "force-dynamic";

const baseMetadata = {
  title: "Aiuto e gestione prenotazioni",
  description:
    "Gestisci il tour dal link ricevuto via email oppure contatta il team FreeTourPraga.",
  alternates: { canonical: "/aiuto" },
};

const steps = [
  {
    title: "Apri la conferma email",
    text: "Cerca il messaggio di conferma FreeTourPraga. Se non lo vedi, controlla anche spam e promozioni.",
  },
  {
    title: "Usa il link personale",
    text: "Nel messaggio trovi un link firmato per la tua prenotazione. Non serve creare un account.",
  },
  {
    title: "Consulta, sposta o cancella",
    text: "Dal link puoi vedere i dettagli, chiedere uno spostamento o cancellare, secondo le regole indicate in conferma.",
  },
] as const;

export default async function Page() {
  const [page, content] = await Promise.all([
    publicPage("aiuto"),
    publicSiteContent(),
  ]);
  const site = content.globals;
  const whatsappHref = contentWhatsapp(
    content,
    "Ciao, ho bisogno di assistenza con la mia prenotazione.",
  );

  return (
    <section className={`${ui.page} ${ui.help} section`}>
      <div className={`container-page ${ui.helpGrid}`}>
        <div className={ui.helpIntro}>
          <p
            {...pageEdit("aiuto", "subtitleHtml", "inline")}
            className={`${ui.eyebrow} uppercase-tag text-primary`}
          >
            <InlineCopy html={page?.subtitleHtml}>{page?.subtitle || "Assistenza"}</InlineCopy>
          </p>
          <h1 {...pageEdit("aiuto", "titleHtml", "inline")} className="display-xl">
            <InlineCopy html={page?.titleHtml}>{page?.title || "Come possiamo aiutarti?"}</InlineCopy>
          </h1>
          <div
            {...pageEdit(
              "aiuto",
              "bodyHtml", "html",
            )}
            className="body-md"
          >
            {page?.bodyHtml ? (
              <RichContent html={page.bodyHtml} />
            ) : (
              <p>
                {page?.body ||
                  "Per consultare, spostare o cancellare una prenotazione apri il link personale nella conferma ricevuta via email. Non serve creare un account."}
              </p>
            )}
          </div>
          <ol className={ui.helpSteps}>
            {steps.map((step) => (
              <li key={step.title} className={ui.helpStep}>
                <div>
                  <strong>{step.title}</strong>
                  <span>{step.text}</span>
                </div>
              </li>
            ))}
          </ol>
          {page?.contentBlocks?.length ? (
            <SectionBlocks blocks={page.contentBlocks} />
          ) : null}
        </div>

        <aside className={ui.helpPanel} aria-labelledby="help-actions-title">
          <h2 id="help-actions-title" className={ui.helpPanelTitle}>
            Serve altro?
          </h2>
          <p className={ui.helpPanelLead}>
            Se non trovi la conferma o il link non funziona, scrivici indicando
            nome e data del tour. Siamo disponibili{" "}
            {site.supportHours.toLocaleLowerCase("it")}.
          </p>
          <a className={ui.helpLink} href={whatsappHref}>
            <span>
              <strong>Scrivici su WhatsApp</strong>
              <small>
                {site.phone} · {site.supportHours}
              </small>
            </span>
            <ArrowUpRight size={18} aria-hidden />
          </a>
          <a className={ui.helpLink} href={`mailto:${site.email}`}>
            <span>
              <strong>Invia un’email</strong>
              <small>{site.email}</small>
            </span>
            <ArrowUpRight size={18} aria-hidden />
          </a>
          <Link className={ui.helpLink} href="/faq">
            <span>
              <strong>Domande frequenti</strong>
              <small>Risposte rapide su tour, pagamenti e ritrovo</small>
            </span>
            <ArrowUpRight size={18} aria-hidden />
          </Link>
          <Link className={ui.helpLink} href="/contatti">
            <span>
              <strong>Vai ai contatti</strong>
              <small>Modulo, orari e punto d’incontro</small>
            </span>
            <ArrowUpRight size={18} aria-hidden />
          </Link>
        </aside>
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("aiuto");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
