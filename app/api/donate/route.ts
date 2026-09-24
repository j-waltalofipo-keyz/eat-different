// Navigation — SOP: architecture/donations.md (open even when the kitchen is closed)
import { jsonBody, respond } from "@/execution/lib/http";
import { DonationRequestSchema } from "@/execution/schemas";
import { getSettings } from "@/execution/settings";
import { createDonationCheckout } from "@/execution/square/createDonationCheckout";

export async function POST(req: Request) {
  return respond(async () => {
    const { amountCents } = DonationRequestSchema.parse(await jsonBody(req));
    return createDonationCheckout(amountCents, await getSettings());
  });
}
