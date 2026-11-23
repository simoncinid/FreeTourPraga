import { siteEdit } from "@/lib/visual-content";
import { BrandIcon } from "./BrandIcon";
import { publicSiteContent } from "@/lib/platform/public";

export async function SocialLinks({ compact = false }: { compact?: boolean }) {
  const {
    globals: { socialLinks },
  } = await publicSiteContent();
  if (!socialLinks.length) return null;

  return (
    <div className={compact ? "flex flex-wrap gap-x-5 gap-y-2" : "grid gap-3"}>
      {socialLinks.map((link, index) => (
        <a
          {...siteEdit(`globals.socialLinks.${index}.url`, "link")}
          key={link.label}
          href={link.url}
          target="_blank"
          rel="me noreferrer"
          className={
            compact
              ? "inline-flex items-center gap-2 text-sm text-white/85"
              : "flex items-center justify-between rounded-sm border border-hairline-soft px-4 py-3 text-sm text-ink"
          }
        >
          <span className="inline-flex items-center gap-2">
            <BrandIcon name={link.label} />
            {link.label}
          </span>
        </a>
      ))}
    </div>
  );
}
