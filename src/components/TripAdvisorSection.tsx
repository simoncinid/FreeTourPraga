import { publicSiteContent } from "@/lib/platform/public";
import { tripAdvisor } from "@/lib/site";
import { TripAdvisorWidget } from "./TripAdvisorWidget";

export async function TripAdvisorSection({
  layout = "section",
}: {
  layout?: "section" | "card";
}) {
  const { globals: g } = await publicSiteContent();
  return (
    <TripAdvisorWidget
      layout={layout}
      tripAdvisor={{
        profileUrl: g.tripAdvisorUrl || tripAdvisor.profileUrl,
        title: g.tripAdvisorTitle,
        body: g.tripAdvisorBody,
        rating: tripAdvisor.rating,
        reviewCount: tripAdvisor.reviewCount,
        reviews: tripAdvisor.reviews,
      }}
    />
  );
}
