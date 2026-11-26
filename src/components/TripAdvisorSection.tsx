import { publicSiteContent } from "@/lib/platform/public";
import { tripAdvisor } from "@/lib/site";
import {
  loadTripadvisorScore,
  tripadvisorReviews,
} from "@/lib/tripadvisor-listing";
import { TripAdvisorWidget } from "./TripAdvisorWidget";

export async function TripAdvisorSection({
  layout = "section",
}: {
  layout?: "section" | "card";
}) {
  const { globals: g, formattedText } = await publicSiteContent();
  const live = await loadTripadvisorScore().catch(() => null);
  const reviews = tripadvisorReviews.map((review) => ({
    author: review.author,
    place: "Praga",
    rating: review.rating,
    date: review.date,
    text: review.body,
    avatarUrl: review.avatar,
  }));

  return (
    <TripAdvisorWidget
      layout={layout}
      formattedText={formattedText}
      googleReviewUrl={g.googleReviewUrl}
      tripAdvisor={{
        profileUrl: g.tripAdvisorUrl || tripAdvisor.profileUrl,
        title: g.tripAdvisorTitle,
        body: g.tripAdvisorBody,
        rating: live?.rating ?? tripAdvisor.rating,
        reviewCount: live?.reviewCount ?? tripAdvisor.reviewCount,
        reviews,
      }}
    />
  );
}
