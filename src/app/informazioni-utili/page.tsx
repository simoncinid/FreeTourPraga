import { permanentRedirect, redirect } from "next/navigation";
import { publicPage } from "@/lib/platform/public";

export default async function Page() {
  if (await publicPage("legacy:/informazioni-utili-per-il-tuo-viaggio-a-praga/"))
    permanentRedirect("/informazioni-utili-per-il-tuo-viaggio-a-praga/");
  redirect("/#informazioni-utili");
}
