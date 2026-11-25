import { pageEditorKey } from "@/lib/content-routing";
import { readState } from "@/lib/platform/store";
import { contentSections, pageLabels } from "@/lib/content-sections";
import { notFound, redirect } from "next/navigation";

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
  "partner-europa",
  "email",
  "canali",
  "richieste",
  "impostazioni",
  "report",
  "audit",
  "pre-tour",
  "supporto",
  "utenti",
];

export default async function Page({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  if (section[0] === "sito") redirect("/admin/contenuti");
  if (!allowed.includes(section[0]) || section.length > 2) notFound();
  if (
    section[0] === "contenuti" &&
    section[1] &&
    section[1] !== "articoli" &&
    !Object.hasOwn(contentSections, section[1]) &&
    !Object.hasOwn(pageLabels, section[1]) &&
    !Object.hasOwn(
      (await readState({ generateSlots: false })).pages,
      pageEditorKey(section[1]),
    )
  )
    notFound();
  return null;
}
