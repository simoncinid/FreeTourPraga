import { CardCarousel } from "./CardCarousel";
import Image from "next/image";
import Link from "next/link";
import { guidePath } from "@/lib/public-paths";
import { guideImage } from "@/lib/guide-media";
import type { SiteContent } from "@/lib/platform/content";
import styles from "@/app/home.module.css";

export function HomeGallery({ items }: { items: SiteContent["gallery"] }) {
  if (!items.length) return null;
  return (
    <div className={styles.galleryCarousel}>
      <CardCarousel
        label="Ultimi articoli del blog"
        intervalMs={3000}
        limitToDotRowMobile
        equalHeight={false}
      >
        {items.map((photo) => (
          <Link
            key={photo.title}
            href={guidePath(photo)}
            className="card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card"
          >
            <figure>
              <div className="relative aspect-[4/3]">
                <Image
                  src={guideImage(photo)}
                  alt={photo.title}
                  fill
                  sizes="(min-width:768px) 33vw, 86vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-5">
                <strong className="title-md line-clamp-2">{photo.title}</strong>
                <p className="body-sm mt-2 line-clamp-3">{photo.caption}</p>
              </figcaption>
            </figure>
          </Link>
        ))}
      </CardCarousel>
      <Link href="/blog" className={styles.galleryAllArticles}>
        Vedi tutti gli articoli
      </Link>
    </div>
  );
}
