import Image from "next/image";
import Link from "next/link";
import { guidePath } from "@/lib/public-paths";
import { guideImage } from "@/lib/guide-media";
import type { SiteContent } from "@/lib/platform/content";

export function HomeGallery({ items }: { items: SiteContent["gallery"] }) {
  if (!items.length) return null;
  return (
    <div className="home-blog-carousel" aria-label="Ultimi articoli del blog">
      {items.slice(0, 3).map((photo) => (
        <Link key={photo.title} href={guidePath(photo)} className="card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card">
          <figure>
            <div className="relative aspect-[4/3]">
              <Image src={guideImage(photo)} alt={photo.title} fill sizes="(min-width:768px) 33vw, 86vw" className="object-cover" />
            </div>
            <figcaption className="p-5">
              <strong className="title-md">{photo.title}</strong>
              <p className="body-sm mt-2">{photo.caption}</p>
            </figcaption>
          </figure>
        </Link>
      ))}
    </div>
  );
}
