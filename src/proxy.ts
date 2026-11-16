import { NextRequest, NextResponse } from "next/server";
import routes from "@/content/wordpress-routes.json";
import { canonicalPath } from "@/lib/public-paths";

const redirects: Record<string, string> = routes.redirects;
const ids: Record<string, string> = routes.wordpressIds;
const gone = new Set<string>(routes.gone);

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const preview = process.env.SITE_PREVIEW === "true";
  const path = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/, "")}/`;
  if (!["GET", "HEAD"].includes(request.method)) return NextResponse.next();

  // Old ?p= / ?page_id= permalinks continue to reach their actual published page.
  const id = url.pathname === "/" ? url.searchParams.get("p") || url.searchParams.get("page_id") : null;
  let target = (id && ids[id]) || redirects[path] || canonicalPath(url.pathname);
  if (target in redirects) target = redirects[target];
  const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://it.freetourpraga.com";
  const publicHost = (request.headers.get("host") || url.host).split(":")[0];
  const technicalHost = publicHost.endsWith(".up.railway.app");
  const redirectHost = !preview && technicalHost && new URL(canonicalOrigin).origin === "https://it.freetourpraga.com";
  if (target !== url.pathname || redirectHost) {
    if (redirectHost) {
      url.protocol = "https:"; url.host = "it.freetourpraga.com"; url.port = "";
    }
    url.pathname = target;
    if (id && ids[id]) { url.searchParams.delete("p"); url.searchParams.delete("page_id"); }
    return NextResponse.redirect(url, 301);
  }
  // These attachment URLs already return 410 on WordPress: do not revive them as soft 404s.
  if (gone.has(path)) return new NextResponse("<!doctype html><html lang=\"it\"><meta charset=\"utf-8\"><title>Contenuto rimosso</title><h1>Contenuto rimosso</h1><p>Questa pagina non è più disponibile.</p><a href=\"/tour/\">Scopri i tour a Praga</a></html>", {
    status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
  const response = NextResponse.next();
  if (preview) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/((?!api/|_next/|wp-content/|images/|icon.svg|favicon.ico).*)"] };
