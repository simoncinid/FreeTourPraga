import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ui from "@/components/public-ui.module.css";

export default function NotFound() {
  return (
    <section className={`${ui.page} ${ui.notFound} section`}>
      <div className="container-page max-w-2xl text-center">
        <Image
          src="/images/prague-diorama.webp"
          alt=""
          width={180}
          height={120}
          className="mx-auto mb-5 object-contain"
        />
        <p className="uppercase-tag mb-4 text-primary">
          404 · Pagina non trovata
        </p>
        <h1 className="display-lg mb-5">Ritroviamo la strada.</h1>
        <p className="body-md mx-auto mb-7 max-w-md">
          Questa pagina non è disponibile. Torna alla home o scopri i nostri
          tour in italiano a Praga.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="button-primary">
            Torna alla home <ArrowRight size={16} />
          </Link>
          <Link href="/tour" className="button-secondary">
            Esplora i tour
          </Link>
        </div>
      </div>
    </section>
  );
}
