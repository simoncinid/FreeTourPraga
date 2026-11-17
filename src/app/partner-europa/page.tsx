import ui from "@/components/public-ui.module.css";
import {publicPage} from "@/lib/platform/public";
import {ContentBlock} from "@/components/ContentBlock";
export const dynamic="force-dynamic";
import Image from "next/image";
import { InquiryForm } from "@/components/InquiryForm";
const baseMetadata = {
  title: "Partner Europa",
  description: "Tour in italiano per scuole, gruppi, hotel e agenzie a Praga.",
  alternates: { canonical: "/partner-europa" },
};
export default async function Page() {
 const page=await publicPage("partner-europa"); if(page)return <><ContentBlock page={page}/><div className="container-page mb-16 max-w-3xl"><InquiryForm partner/></div></>;
  return (
    <section className={`${ui.page} ${ui.partner} section`}>
      <div className="container-page grid items-start gap-16 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className={`${ui.eyebrow} uppercase-tag mb-4 text-primary`}>Partner Europa</p>
          <h1 className="display-xl mb-5">
            Grandi esperienze.
            <br />
            Organizzate insieme.
          </h1>
          <p className="body-md mb-10">
            Scuole in viaggio, gruppi da accompagnare, ospiti da consigliare:
            siamo il tuo riferimento locale per scoprire Praga in italiano.
          </p>
          {[
            [
              "/images/illustrated/group.webp",
              "Scuole e gruppi",
              "Itinerari e ritmi adatti a chi viaggia insieme.",
            ],
            [
              "/images/illustrated/hotel.webp",
              "Hotel e agenzie",
              "Un contatto dedicato per organizzare le visite dei tuoi ospiti.",
            ],
            [
              "/images/illustrated/handshake.webp",
              "Collabora con noi",
              "Affiliazioni e codici per riconoscere le prenotazioni dei tuoi clienti.",
            ],
          ].map(([icon, title, text]) => (
            <div key={String(title)} className={`${ui.partnerBenefit} mb-7 flex gap-4`}>
              <Image src={icon} alt="" width={56} height={56} sizes="56px" className={ui.partnerIcon} />
              <div>
                <h2 className="title-md mb-2">{String(title)}</h2>
                <p className="body-sm">{String(text)}</p>
              </div>
            </div>
          ))}
        </div>
        <InquiryForm partner />
      </div>
    </section>
  );
}

export async function generateMetadata(){const p=await publicPage("partner-europa");return {...baseMetadata,...(p?.seoTitle?{title:p.seoTitle}:{}),...(p?.seoDescription?{description:p.seoDescription}:{})};}
