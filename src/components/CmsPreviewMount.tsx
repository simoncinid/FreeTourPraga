"use client";

import { useEffect, useRef } from "react";

export function CmsPreviewMount({ id }: { id: string }) {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mount.current) mount.current.dataset.cmsMounted = "true";
  }, []);
  return <div id={id} ref={mount} />;
}

export function observePreviewMounts(doc: Document, update: () => void) {
  const observer = new MutationObserver(update);
  observer.observe(doc.body, {
    attributes: true,
    attributeFilter: ["data-cms-mounted"],
    subtree: true,
  });
  update();
  return () => observer.disconnect();
}
