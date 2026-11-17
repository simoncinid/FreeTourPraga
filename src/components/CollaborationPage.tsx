import Image from "next/image";
import { InquiryForm } from "@/components/InquiryForm";
import { ContentBlock } from "@/components/ContentBlock";
import { publicPage } from "@/lib/platform/public";

export async function CollaborationPage({ pageKey, title, body, points, partner = false }: {
  pageKey: string; title: string; body: string; points: string[]; partner?: boolean;
}) {
  const page = await publicPage(pageKey);
  if (page) return <><ContentBlock page={page} /><div className="container-page mb-16 max-w-3xl"><InquiryForm partner={partner} /></div></>;
  return <section className="section"><div className="container-page grid items-start gap-12 lg:grid-cols-2"><div><Image src="/images/illustrated/handshake.webp" alt="" width={72} height={72} /><h1 className="display-xl my-5">{title}</h1><p className="body-md mb-8">{body}</p><ul className="grid list-disc gap-4 pl-5">{points.map((point) => <li key={point}>{point}</li>)}</ul><p className="mt-8">Scrivici indicando il tipo di collaborazione che ti interessa e raccontaci il tuo progetto.</p></div><InquiryForm partner={partner} /></div></section>;
}
