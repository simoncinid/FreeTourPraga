"use client";

import { SiteInlineText, SiteRichText, siteInlineEdit } from "./SiteRichText";
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

function AnswerCard({ item, index, formattedText }: { item: Answer; index: number; formattedText?: SiteContent["formattedText"] }) {
  return (
    <article className={`card p-6 ${styles.answerCard}`}>
      <h3
        {...siteInlineEdit(`answers.${index}.question`)}
        className={`title-md mb-3 ${styles.answerTitle}`}
      >
        <SiteInlineText content={{ formattedText }} path={`answers.${index}.question`}>{item.question}</SiteInlineText>
      </h3>
      <SiteRichText content={{ formattedText }} path={`answers.${index}.answer`} text={item.answer} />
    </article>
  );
}

export function HomeAnswers({ items, formattedText }: { items: Answer[]; formattedText?: SiteContent["formattedText"] }) {
  if (!items.length) return null;
  const pages = chunkPairs(items);

  return (
    <div className={styles.answers}>
      <div className={styles.answersDesktop}>
        {items.map((item) => (
          <AnswerCard
            key={item.question}
            item={item}
            index={items.indexOf(item)}
            formattedText={formattedText}
          />
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
                <AnswerCard
                  key={item.question}
                  item={item}
                  index={items.indexOf(item)}
            formattedText={formattedText}
                />
              ))}
            </div>
          ))}
        </CardCarousel>
      </div>
    </div>
  );
}
