import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accedi o registrati",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const c = await publicSiteContent();
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="display-xl mb-6">Accedi o registrati</h1>
        <p className="body-md mb-8">
          Prenoti senza creare un account. Nella email di conferma trovi il
          link per consultare, modificare o cancellare la prenotazione.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/tour" className="button-primary">
            I nostri tour
          </Link>
          <a
            className="button-secondary"
            href={contentWhatsapp(
              c,
              "Ciao, vorrei aiuto con una prenotazione.",
            )}
          >
            <MessageCircle size={18} />
            Scrivici su WhatsApp
          </a>
        </div>
        <p className="body-sm mt-10">
          <Link href="/accesso" className="underline">
            Accesso staff
          </Link>
        </p>
      </div>
    </section>
  );
}
