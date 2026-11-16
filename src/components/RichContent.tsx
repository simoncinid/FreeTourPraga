import { sanitizeRichText } from "@/lib/rich-text";
import styles from "./rich-content.module.css";

export function RichContent({ html }: { html: string }) {
  return <div className={styles.content} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />;
}
