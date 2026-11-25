"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { siteEdit } from "@/lib/visual-content";
import { RichContent } from "./RichContent";

export function FaqAccordion({
  items,
}: {
  items: { q: string; a: string; answerHtml?: string }[];
}) {
  const [visible, setVisible] = useState(10);
  return (
    <div className="grid gap-4">
      {items.slice(0, visible).map((item, index) => (
        <details name="domande-frequenti" key={item.q} className="card">
          <summary className="font-bold cursor-pointer">
            <span {...siteEdit(`faqs.${index}.q`)}>{item.q}</span>
            <Plus size={18} aria-hidden />
          </summary>
          {item.answerHtml ? (
            <div
              className="p-5"
              {...siteEdit(`faqs.${index}.answerHtml`, "html")}
            >
              <RichContent html={item.answerHtml} />
            </div>
          ) : (
            <p {...siteEdit(`faqs.${index}.answerHtml`, "html")}>{item.a}</p>
          )}
        </details>
      ))}
      {visible < items.length && (
        <button
          type="button"
          className="button-secondary justify-self-center"
          onClick={() => setVisible((current) => current + 10)}
        >
          Leggi di più
        </button>
      )}
    </div>
  );
}
