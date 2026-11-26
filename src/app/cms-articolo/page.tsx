import "@/components/blog-article.module.css";
import "@/components/rich-content.module.css";
import { notFound } from "next/navigation";
import { CmsPreviewMount } from "@/components/CmsPreviewMount";
import { session } from "@/lib/platform/security";

export const metadata = {
  title: "Anteprima articolo",
  robots: { index: false, follow: false },
};

export default async function ArticlePreviewPage() {
  const staff = await session();
  if (!staff || !["admin", "operator"].includes(staff.role)) notFound();
  return <CmsPreviewMount id="cms-article-preview" />;
}
