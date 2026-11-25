import { TripadvisorShowcase } from "@/components/TripadvisorShowcase";
import {
  loadTripadvisorScore,
  tripadvisorReviews,
} from "@/lib/tripadvisor-listing";
import { tripAdvisor } from "@/lib/site";

export async function TripAdvisorOfficial() {
  const live = await loadTripadvisorScore().catch(() => null);

  return (
    <TripadvisorShowcase
      rating={live?.rating ?? tripAdvisor.rating}
      reviewCount={live?.reviewCount ?? tripAdvisor.reviewCount}
      reviews={tripadvisorReviews}
      profileUrl={tripAdvisor.profileUrl}
    />
  );
}
