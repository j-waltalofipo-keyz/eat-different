// SOP: architecture/checkout.md steps 5–8. Food order → Square hosted checkout (PICKUP, ASAP).
import { randomUUID } from "node:crypto";
import type { Square } from "square";
import { db, square } from "../lib/clients";
import { getEnv } from "../lib/env";
import { AppError } from "../lib/errors";
import { toCents } from "../lib/money";
import { hashToken, newViewToken } from "../lib/token";
import type { PricedCart } from "./priceCart";

type LinkRequest = NonNullable<Parameters<ReturnType<typeof square>["checkout"]["paymentLinks"]["create"]>[0]>;

/** Pure. */
export function buildFoodPaymentLink(a: {
  priced: PricedCart;
  customerName: string;
  note: string | null;
  locationId: string;
  siteUrl: string;
  viewToken: string;
  idempotencyKey: string;
}): LinkRequest {
  const lineItems: Square.OrderLineItem[] = a.priced.lines.map((l) => ({
    catalogObjectId: l.variationId,
    quantity: String(l.qty),
    modifiers: l.modifiers.map((m) => ({ catalogObjectId: m.id, quantity: String(m.qty) })),
  }));
  return {
    idempotencyKey: a.idempotencyKey,
    order: {
      locationId: a.locationId,
      metadata: { kind: "FOOD" },
      lineItems,
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickupDetails: {
            scheduleType: "ASAP",
            recipient: { displayName: a.customerName },
            ...(a.note ? { note: a.note } : {}),
          },
        },
      ],
    },
    checkoutOptions: { allowTipping: true, redirectUrl: `${a.siteUrl}/order/${a.viewToken}` },
  };
}

/** IO. Creates the Square link and the PENDING order row. */
export async function createCheckout(a: {
  priced: PricedCart;
  customerName: string;
  note: string | null;
}): Promise<{ checkoutUrl: string; orderId: string }> {
  const env = getEnv();
  const viewToken = newViewToken();
  const res = await square().checkout.paymentLinks.create(
    buildFoodPaymentLink({
      ...a,
      locationId: env.SQUARE_LOCATION_ID,
      siteUrl: env.SITE_URL,
      viewToken,
      idempotencyKey: randomUUID(),
    }),
  );
  const link = res.paymentLink;
  if (!link?.url || !link.orderId) throw new AppError("SQUARE_ERROR", 502, "Square didn't return a checkout link.");

  const squareTotal = toCents(res.relatedResources?.orders?.[0]?.totalMoney);
  if (squareTotal !== a.priced.totalCents) {
    console.warn(`checkout total mismatch: square=${squareTotal} ours=${a.priced.totalCents} order=${link.orderId}`);
  }

  const { error } = await db().from("orders").insert({
    square_order_id: link.orderId,
    kind: "FOOD",
    status: "PENDING",
    total_cents: squareTotal || a.priced.totalCents,
    customer_name: a.customerName,
    view_token_hash: hashToken(viewToken),
  });
  if (error) throw new Error(`orders insert: ${error.message}`);

  return { checkoutUrl: link.url, orderId: link.orderId };
}
