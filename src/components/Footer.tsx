import ui from "./public-ui.module.css";
import Link from "next/link";
import { canonicalPath } from "@/lib/public-paths";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
import { SocialLinks } from "./SocialLinks";
export async function Footer() {
  const c = await publicSiteContent();
  const g = c.globals;
  return (
    <footer className={`${ui.footer} border-t-4 border-primary bg-navy text-white`}>
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <strong className="font-display text-2xl">{g.brandName}</strong>
          <p className="mt-4 text-sm text-white/85">{g.footerText}</p>
        </div>
        <div>
          <h2 className="mb-4 font-normal text-white">Contatti</h2>
          <div className="grid gap-3 text-sm text-white/85">
            <a href={contentWhatsapp(c, "Ciao, vorrei assistenza sui tour.")}>
              WhatsApp · {g.supportHours}
            </a>
            <a href={`mailto:${g.email}`}>{g.email}</a>
            <a href={`tel:${g.phone.replaceAll(" ", "")}`}>{g.phone}</a>
            <p>{g.address}</p>
          </div>
        </div>
        <div>
          <h2 className="mb-4 font-normal text-white">Informazioni</h2>
          <div className={`${ui.footerLinks} mb-5 grid gap-x-6 gap-y-3 text-sm`}>
            {g.navigation
              .filter(
                (n) =>
                  n.href !== "/account" &&
                  n.href !== "/accesso" &&
                  n.href !== "/faq",
              )
              .map((n) => (
                <Link key={`${n.href}-${n.label}`} href={n.href.startsWith("/") ? canonicalPath(n.href) : n.href}>
                  {n.label}
                </Link>
              ))}
            <Link href="/faq">Domande frequenti</Link>
            <Link href="/privacy">Privacy e cookie</Link>
            <Link href="/termini">Termini e cancellazioni</Link>
          </div>
          <SocialLinks compact />
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 text-sm text-white/80">
          <p>{g.footerNote}</p>
          <Link href="/accesso" className="underline underline-offset-4">
            Area staff
          </Link>
        </div>
      </div>
    </footer>
  );
}
