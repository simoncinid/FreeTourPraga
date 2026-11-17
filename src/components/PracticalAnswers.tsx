"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { guideForAnswer } from "@/lib/answer-guides";
import type { SiteContent } from "@/lib/platform/content";

type Guide = SiteContent["gallery"][number];
type Answer = SiteContent["answers"][number];

export function PracticalAnswers({
  items,
  gallery = [],
}: {
  items: Answer[];
  gallery?: Guide[];
}) {
  const router = useRouter();

  return (
    <ol className="grid gap-5 md:grid-cols-2">
      {items.map((item, index) => {
        const matched = guideForAnswer(item, gallery);
        const body = (
          <>
            <div className="flex items-center gap-3">
              <p className="font-display shrink-0 text-3xl leading-none text-primary">
                {index + 1}
              </p>
              <h3 className="title-md min-w-0">{item.question}</h3>
            </div>
            <p className="body-sm mt-3">
              <LinkedPhrase text={item.answer} />
            </p>
            {matched && (
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                Leggi articolo <ArrowUpRight size={15} aria-hidden />
              </span>
            )}
          </>
        );

        if (!matched) {
          return (
            <li key={item.question}>
              <div className="card h-full p-6">{body}</div>
            </li>
          );
        }

        return (
          <li key={item.question}>
            <div
              role="link"
              tabIndex={0}
              className="card h-full cursor-pointer p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
              onClick={() => router.push(matched.href)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(matched.href);
                }
              }}
            >
              {body}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LinkedPhrase({ text }: { text: string }) {
  const links: Record<string, string> = {
    "Partner Europa": "/partner-europa",
    "scheda del Free Tour": "/tour/free-tour-praga",
    "tour del Castello di Praga e Malá Strana": "/tour/castello/",
    "cambio euro-corona ceca": "/cambio-euro-corona-ceca/",
    "collegamenti dall’aeroporto": "/come-raggiungerci-dallaeroporto/",
    "ristoranti tipici": "/dove-mangiare-a-praga/",
  };
  const phrases = Object.keys(links).map((phrase) =>
    phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const parts = text.split(new RegExp(`(${phrases.join("|")})`, "g"));
  return (
    <>
      {parts.map((part, index) =>
        links[part] ? (
          <Link
            key={index}
            href={links[part]}
            className="font-semibold text-ink underline"
            onClick={(event) => event.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          part
        ),
      )}
    </>
  );
}
