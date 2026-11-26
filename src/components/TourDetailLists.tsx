import { Check, Info, Ticket, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Tour } from "@/lib/types";
import { richHasText } from "@/lib/rich-text";
import { RichContent } from "./RichContent";
import { TourEditableText } from "./TourEditableText";
import { TourHighlights } from "./TourHighlights";
import panels from "./tour-panels.module.css";

export type TourInfoField = "inclusions" | "exclusions" | "safetyNotes";

export function TourItinerary({
  tour,
  editable = false,
}: {
  tour: Tour;
  editable?: boolean;
}) {
  const highlights = tour.highlights.map((text, index) => ({
    text,
    html: tour.formattedCopy?.highlights?.[index] ?? undefined,
    index,
    images: (tour.highlightGalleries?.[index] || []).slice(0, 4),
  }));
  const groups = (tour.itineraryGroups ?? [])
    .map((group, index) => ({ ...group, index }))
    .filter(({ start }) => start < highlights.length);
  if (!groups.length)
    return <TourHighlights items={highlights} editable={editable} />;
  return groups.map((group, index) => (
    <div key={group.start} className="mb-5 last:mb-0">
      <h3 className="display-sm mb-3">
        <TourEditableText tour={tour} path={`itineraryGroups.${group.index}.title`} text={group.title} editable={editable} />
      </h3>
      <TourHighlights
        items={highlights.slice(group.start, groups[index + 1]?.start)}
        editable={editable}
      />
    </div>
  ));
}

export function tourInfoEntries(tour: Tour, field: TourInfoField) {
  return (tour[field] ?? [])
    .map((item, index) => {
      const html = tour.formattedCopy?.[field]?.[index];
      const formatted =
        typeof html === "string" && richHasText(html) ? html : "";
      const plain = item.trim();
      if (!plain && !formatted) return null;
      return { item: plain, formatted, index };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
}

export function TourInfoList({
  tour,
  field,
  heading,
}: {
  tour: Tour;
  field: TourInfoField;
  heading?: ReactNode;
}) {
  const Icon =
    field === "inclusions" ? Check : field === "exclusions" ? X : Info;
  const entries = tourInfoEntries(tour, field);
  if (!entries.length) return null;
  return (
    <>
      {heading}
      <ul className={`${panels.practicalList} body-md`}>
        {entries.map(({ item, formatted, index }) => {
          const ItemIcon =
            field === "safetyNotes" && /bigliett|tram|trasport/i.test(item)
              ? Ticket
              : Icon;
          return (
            <li key={`${field}-${index}-${formatted.slice(0, 24) || item.slice(0, 24)}`}>
              <ItemIcon
                size={17}
                aria-hidden
                className={
                  field === "inclusions"
                    ? "text-success"
                    : field === "exclusions"
                      ? "text-red-700"
                      : ""
                }
              />
              <div
                data-tour-field={`formattedCopy.${field}.${index}`}
                data-tour-kind="html"
              >
                <RichContent html={formatted || `<p>${item}</p>`} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
