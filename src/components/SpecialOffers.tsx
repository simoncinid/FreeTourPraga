import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { formatMoney } from "@/lib/format";
import styles from "./special-offers.module.css";

export async function SpecialOffers() {
  const { home: h } = await publicSiteContent();
  if (!h.specialOffers?.length) return null;
  return (
    <section className={`container-page py-10 ${styles.section}`}>
      <details className={`card p-6 ${styles.panel}`}>
        <summary className={`display-md ${styles.summary}`}>
          Offerte speciali tramite servizio clienti
        </summary>
        <p className={styles.note}>{h.specialOffersNote}</p>
        <ul className={styles.list}>
          {h.specialOffers.map((o, i) => (
            <li key={i} className={styles.row}>
              <span className={styles.label}>{o.label}</span>
              <strong className={styles.price}>
                {formatMoney(o.priceCents, h.specialOffersCurrency)}
              </strong>
            </li>
          ))}
        </ul>
        <Link href="/contatti" className={`button-secondary ${styles.cta}`}>
          Contattaci per le offerte
        </Link>
      </details>
    </section>
  );
}
