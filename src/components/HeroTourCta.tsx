"use client";
import { InlineCopy } from "./RichInline";
import { siteEdit } from "@/lib/visual-content";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./hero-tour-cta.module.css";

const MAX_THUMBS = 5;

export function HeroTourCta({
  href,
  label,
  labelHtml,
  tours,
}: {
  href: string;
  label: string;
  labelHtml?: string;
  tours: { title: string; imageUrl: string; slug: string }[];
}) {
  const thumbs = tours.slice(0, MAX_THUMBS);

  return (
    <Link href={href} data-cms-hide-parent className={`button-primary ${styles.cta}`}>
      <span
        {...siteEdit("home.primaryLabel")}
        data-cms-href={JSON.stringify({
          scope: "site",
          path: ["home", "primaryHref"],
        })}
        className={styles.label}
      >
        <InlineCopy html={labelHtml}>{label}</InlineCopy>
      </span>
      <span className={styles.thumbs} aria-hidden>
        {thumbs.map((tour, index) => (
          <span
            key={tour.slug}
            className={styles.thumb}
            style={{ ["--i" as string]: index }}
          >
            <Image
              src={tour.imageUrl}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </span>
        ))}
      </span>
      <ArrowRight size={18} className={styles.arrow} aria-hidden />
      <span className={styles.shine} aria-hidden />
    </Link>
  );
}
