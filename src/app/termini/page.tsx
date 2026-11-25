import { pageEdit } from "@/lib/visual-content";
import { RichContent } from "@/components/RichContent";
import { SectionBlocks } from "@/components/SectionBlocks";
import ui from "@/components/public-ui.module.css";
import Link from "next/link";
import { readState } from "@/lib/platform/store";
import { publicPage } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Termini e cancellazioni",
  alternates: { canonical: "/termini" },
};
export default async function Page() {
  const content = await publicPage("termini");
  const { settings: s } = await readState();
  return (
    <section className={`${ui.page} ${ui.legal} section`}>
      <div className="container-page max-w-3xl">
        <h1 {...pageEdit("termini", "title")} className="display-xl mb-7">
          {content?.title || "Termini di prenotazione"}
        </h1>
        <div
          {...pageEdit("termini", "bodyHtml", "html")}
          className="card grid gap-6 p-7"
        >
          {content ? (
            content.bodyHtml ? (
              <RichContent html={content.bodyHtml} />
            ) : (
              <p className="whitespace-pre-wrap">{content.body}</p>
            )
          ) : (
            <>
              <p>
                Il servizio è organizzato da Domenico Masini, ditta individuale,
                IČO 21191310, Kaprova 42/14, 11000 Praha – Staré Město,
                Repubblica Ceca. Le informazioni del tour specificano durata,
                lingua, punto d’incontro, tariffe e servizi inclusi.
              </p>
              <h2 className="display-md">Prenotazione e pagamento</h2>
              <p>
                Il prezzo e la valuta sono indicati nella scheda del tour. Il
                riepilogo mostra il totale e i metodi di pagamento disponibili
                prima della conferma.
              </p>
              <h2 className="display-md">Sconti e partecipanti</h2>
              <p>
                Gli eventuali sconti sono indicati nel riepilogo. Le fasce d’età
                e le tariffe sono indicate nella scheda del tour. Anche i
                bambini che partecipano gratuitamente occupano un posto.
              </p>
              <h2 className="display-md">Modifiche e cancellazioni</h2>
              <p>
                Puoi modificare o cancellare la singola prenotazione dal link
                ricevuto via email, senza account, oppure contattare lo staff.
                Le modifiche dipendono dai posti disponibili. La scheda del tour
                e la conferma indicano il termine per la cancellazione gratuita
                e il rimborso applicabile. Se la scheda non indica una politica
                specifica, puoi cancellare fino a {s.cancellationHours} ore
                prima per ricevere il rimborso integrale. Dopo questo termine il
                rimborso è del {s.lateRefundPercent}%.
              </p>
              <p>
                I rimborsi sono effettuati sul metodo di pagamento originale e
                seguono i tempi del circuito di pagamento. Se un tour viene
                annullato dall’organizzatore, lo staff contatta il cliente per
                concordare una soluzione o gestire il rimborso.
              </p>
              <h2 className="display-md">Comunicazioni e assistenza</h2>
              <p>
                Conserva la conferma email e il codice prenotazione. Presentati
                al punto d’incontro con anticipo. Per esigenze particolari o
                richieste non gestibili online usa la pagina{" "}
                <Link href="/contatti" className="underline">
                  contatti
                </Link>
                .
              </p>
              <p className="text-sm">
                Condizioni aggiornate al 25 novembre 2026.
              </p>
            </>
          )}
        </div>
        <SectionBlocks
          binding={{ scope: "page", key: "termini", path: ["contentBlocks"] }}
          blocks={content?.contentBlocks}
        />
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("termini");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
