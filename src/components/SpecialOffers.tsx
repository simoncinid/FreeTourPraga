import { siteEdit } from "@/lib/visual-content";
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
          <span {...siteEdit("home.specialOffersTitle")}>
            {h.specialOffersTitle ||
              "Offerte speciali tramite servizio clienti"}
          </span>
        </summary>
        <p {...siteEdit("home.specialOffersNote")} className={styles.note}>
          {h.specialOffersNote}
        </p>
        <ul className={styles.list}>
          {h.specialOffers.map((o, i) => (
            <li key={i} className={styles.row}>
              <span
                {...siteEdit(`home.specialOffers.${i}.label`)}
                className={styles.label}
              >
                {o.label}
              </span>
              <strong
                {...siteEdit(`home.specialOffers.${i}.priceCents`, "money")}
                data-cms-currency={h.specialOffersCurrency || "EUR"}
                className={styles.price}
              >
                {formatMoney(o.priceCents, h.specialOffersCurrency)}
              </strong>
            </li>
          ))}
        </ul>
        <Link href="/contatti" className={`button-secondary ${styles.cta}`}>
          <span {...siteEdit("home.specialOffersCtaLabel")}>
            {h.specialOffersCtaLabel || "Contattaci per le offerte"}
          </span>
        </Link>
      </details>
    </section>
  );
}
