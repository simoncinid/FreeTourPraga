import Link from "next/link";

export function PracticalAnswers({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <ol className="grid gap-5 md:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.question} className="card p-6">
          <div className="flex items-center gap-3">
            <p className="font-display shrink-0 text-3xl leading-none text-primary">
              {index + 1}
            </p>
            <h3 className="title-md min-w-0">{item.question}</h3>
          </div>
          <p className="body-sm mt-3">
            <LinkedPhrase text={item.answer} />
          </p>
        </li>
      ))}
    </ol>
  );
}

function LinkedPhrase({
  text,
}: {
  text: string;
}) {
  const links: Record<string, string> = {
    "Partner Europa": "/partner-europa",
    "scheda del Free Tour": "/tour/free-tour-praga",
    "tour del Castello di Praga e Malá Strana": "/tour/castello/",
    "cambio euro-corona ceca": "/cambio-euro-corona-ceca/",
    "collegamenti dall’aeroporto": "/come-raggiungerci-dallaeroporto/",
    "ristoranti tipici": "/dove-mangiare-a-praga/",
  };
  const phrases = Object.keys(links).map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${phrases.join("|")})`, "g"));
  return (
    <>
      {parts.map((part, index) => links[part]
        ? <Link key={index} href={links[part]} className="font-semibold text-ink underline">{part}</Link>
        : part)}
    </>
  );
}
