import { contentSections, pageLabels } from "@/lib/content-sections";
import { notFound, redirect } from "next/navigation";
import { publicPage } from "@/lib/platform/public";

export const metadata = {
  title: "Spazio di gestione",
  robots: { index: false, follow: false },
};

const allowed = [
  "sito",
  "contenuti",
  "tour",
  "calendario",
  "prenotazioni",
  "prezzi",
  "sconti",
  "last-minute",
  "affiliati",
  "email",
  "canali",
  "richieste",
  "impostazioni",
  "report",
  "audit",
  "pre-tour",
];

export default async function Page({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  if (section[0] === "sito") redirect("/admin/contenuti");
  if (section[0] === "contenuti" && section[1] === "informazioni-utili")
    redirect("/admin/contenuti/faq");
  if (section[0] === "contenuti" && section[1] === "tour-privati")
    redirect("/admin/contenuti/pagine");
  if (!allowed.includes(section[0]) || section.length > 2) notFound();
  if (
    section[0] === "contenuti" &&
    section[1] &&
    !Object.hasOwn(contentSections, section[1]) &&
    !Object.hasOwn(pageLabels, section[1]) &&
    !(section[1].startsWith("legacy:") && await publicPage(section[1]))
  )
    notFound();
  return null;
}
