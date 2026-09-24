// Navigation — SOP: architecture/checkout.md
import { AppError } from "@/execution/lib/errors";
import { jsonBody, respond } from "@/execution/lib/http";
import { CheckoutRequestSchema } from "@/execution/schemas";
import { canCheckout, getSettings } from "@/execution/settings";
import { createCheckout } from "@/execution/square/createCheckout";
import { getMenu } from "@/execution/square/getMenu";
import { priceCart } from "@/execution/square/priceCart";

export async function POST(req: Request) {
  return respond(async () => {
    const body = CheckoutRequestSchema.parse(await jsonBody(req));
    if (!canCheckout("FOOD", await getSettings())) {
      throw new AppError("KITCHEN_CLOSED", 409, "The kitchen is closed right now. Join the list and we'll tell you when it opens.");
    }
    const priced = priceCart(body, await getMenu({ fresh: true }));
    return createCheckout({ priced, customerName: body.customerName, note: body.note });
  });
}
