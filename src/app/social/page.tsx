import { SocialLinks } from "@/components/SocialLinks";
export const metadata = { title: "Social", description: "Segui FreeTourPraga sui canali social ufficiali.", alternates: { canonical: "/social" } };
export default function Page() {
  return <section className="section"><div className="container-page max-w-3xl"><h1 className="display-xl mb-5">Praga, anche sui social</h1><p className="body-md mb-8">Scopri scorci della città, racconti dai tour e idee per il tuo prossimo viaggio. Seguici sui canali ufficiali di FreeTourPraga.</p><SocialLinks /></div></section>;
}
