// Navigation — SOP: architecture/reviews.md
import { jsonBody, respond } from "@/execution/lib/http";
import { listReviews } from "@/execution/reviews/listReviews";
import { submitReview } from "@/execution/reviews/submitReview";
import { ReviewSubmitSchema } from "@/execution/schemas";
import { getSettings } from "@/execution/settings";

export async function GET() {
  return respond(async () => listReviews());
}

export async function POST(req: Request) {
  return respond(async () => {
    const input = ReviewSubmitSchema.parse(await jsonBody(req));
    return submitReview(input, (await getSettings()).google_review_url);
  });
}
