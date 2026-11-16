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
            <LinkedPhrase
              text={item.answer}
              phrase="Partner Europa"
              href="/partner-europa"
            />
          </p>
        </li>
      ))}
    </ol>
  );
}

function LinkedPhrase({
  text,
  phrase,
  href,
}: {
  text: string;
  phrase: string;
  href: string;
}) {
  const [before, ...rest] = text.split(phrase);
  if (!rest.length) return text;
  return (
    <>
      {before}
      {rest.map((part, index) => (
        <span key={index}>
          <Link href={href} className="font-semibold text-ink underline">
            {phrase}
          </Link>
          {part}
        </span>
      ))}
    </>
  );
}
