import { SiteInlineText, SiteRichText, siteInlineEdit } from "./SiteRichText";
import { siteEdit } from "@/lib/visual-content";
import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { formatMoney } from "@/lib/format";
import styles from "./special-offers.module.css";

export async function SpecialOffers() {
  const content = await publicSiteContent();
  const { home: h } = content;
  if (!h.specialOffers?.length) return null;
  return (
    <section className={`container-page py-10 ${styles.section}`}>
      <details className={`card p-6 ${styles.panel}`}>
        <summary className={`display-md ${styles.summary}`}>
          <span {...siteInlineEdit("home.specialOffersTitle")}>
            <SiteInlineText content={content} path="home.specialOffersTitle">{h.specialOffersTitle ||
              "Offerte speciali tramite servizio clienti"}</SiteInlineText>
          </span>
        </summary>
        <SiteRichText content={content} path="home.specialOffersNote" text={h.specialOffersNote ?? ""} className={styles.note} />
        <ul className={styles.list}>
          {h.specialOffers.map((o, i) => (
            <li key={i} className={styles.row}>
              <span
                {...siteInlineEdit(`home.specialOffers.${i}.label`)}
                className={styles.label}
              >
                <SiteInlineText content={content} path={`home.specialOffers.${i}.label`}>{o.label}</SiteInlineText>
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
          <span {...siteInlineEdit("home.specialOffersCtaLabel")}>
            <SiteInlineText content={content} path="home.specialOffersCtaLabel">{h.specialOffersCtaLabel || "Contattaci per le offerte"}</SiteInlineText>
          </span>
        </Link>
      </details>
    </section>
  );
}
