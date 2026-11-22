"use client";

import { CardCarousel } from "./CardCarousel";
import styles from "@/app/home.module.css";
import type { SiteContent } from "@/lib/platform/content";

type Answer = SiteContent["answers"][number];

function chunkPairs(items: Answer[]) {
  const pages: Answer[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pages.push(items.slice(i, i + 2));
  }
  return pages;
}

function AnswerCard({ item }: { item: Answer }) {
  return (
    <article className={`card p-6 ${styles.answerCard}`}>
      <h3 className={`title-md mb-3 ${styles.answerTitle}`}>{item.question}</h3>
      <p>{item.answer}</p>
    </article>
  );
}

export function HomeAnswers({ items }: { items: Answer[] }) {
  if (!items.length) return null;
  const pages = chunkPairs(items);

  return (
    <div className={styles.answers}>
      <div className={styles.answersDesktop}>
        {items.map((item) => (
          <AnswerCard key={item.question} item={item} />
        ))}
      </div>
      <div className={styles.answersMobile}>
        <CardCarousel
          label="Prima di prenotare"
          hideNav
          peekMobile
          autoPlay={false}
        >
          {pages.map((pair, index) => (
            <div key={index} className={styles.answersPage}>
              {pair.map((item) => (
                <AnswerCard key={item.question} item={item} />
              ))}
            </div>
          ))}
        </CardCarousel>
      </div>
    </div>
  );
}
