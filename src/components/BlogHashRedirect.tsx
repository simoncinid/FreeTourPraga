"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vecchi link /blog#slug → pagina articolo /blog/slug */
export function BlogHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    router.replace(`/blog/${hash}`);
  }, [router]);

  return null;
}
