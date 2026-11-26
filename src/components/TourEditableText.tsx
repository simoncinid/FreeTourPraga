import type { Tour } from "@/lib/types";
import { InlineCopy } from "./RichInline";

export function tourTextHtml(tour: Tour, path: string) {
  if (path === "fareRequirements" || path === "cancellationClause")
    return tour.formattedCopy?.[path];
  if (path.startsWith("itineraryGroups."))
    return tour.itineraryGroups?.[Number(path.split(".")[1])]?.titleHtml;
  return tour.formattedCopy?.labels?.[path.replaceAll(".", "-")];
}

export function TourEditableText({
  tour,
  path,
  text,
  fallback = text,
  editable = true,
}: {
  tour: Tour;
  path: string;
  text: string;
  fallback?: string;
  editable?: boolean;
}) {
  return (
    <span
      data-tour-field={path}
      data-tour-kind={editable ? "plain" : undefined}
      data-tour-fallback={editable ? fallback : undefined}
    >
      <InlineCopy html={tourTextHtml(tour, path)}>{text}</InlineCopy>
    </span>
  );
}
