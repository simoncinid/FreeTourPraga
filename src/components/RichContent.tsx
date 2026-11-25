import { sanitizeRichText } from "@/lib/rich-text";
import styles from "./rich-content.module.css";

export function RichContent({ html }: { html: string }) {
  return <div className={`rich-content ${styles.content}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />;
}
