// SOP: architecture/donations.md. Any in-range amount → Square hosted checkout, no fulfillment.
import { randomUUID } from "node:crypto";
import { db, square } from "../lib/clients";
import { getEnv } from "../lib/env";
import { AppError } from "../lib/errors";
import { formatUsd, toMoney } from "../lib/money";
import type { Settings } from "../schemas";

type LinkRequest = NonNullable<Parameters<ReturnType<typeof square>["checkout"]["paymentLinks"]["create"]>[0]>;

/** Pure. */
export function validateDonation(
  amountCents: number,
  settings: Pick<Settings, "donation_min_cents" | "donation_max_cents">,
): void {
  if (!Number.isInteger(amountCents) || amountCents < settings.donation_min_cents || amountCents > settings.donation_max_cents) {
    throw new AppError(
      "DONATION_AMOUNT",
      422,
      `Donations can be ${formatUsd(settings.donation_min_cents)} to ${formatUsd(settings.donation_max_cents)}.`,
    );
  }
}

/** Pure. */
export function buildDonationPaymentLink(a: {
  amountCents: number;
  locationId: string;
  siteUrl: string;
  idempotencyKey: string;
}): LinkRequest {
  return {
    idempotencyKey: a.idempotencyKey,
    order: {
      locationId: a.locationId,
      metadata: { kind: "DONATION" },
      lineItems: [{ name: "E.D. Truck Fund Donation", quantity: "1", basePriceMoney: toMoney(a.amountCents) }],
    },
    checkoutOptions: { allowTipping: false, redirectUrl: `${a.siteUrl}/donate/thanks` },
    paymentNote: "Support for a small business — not tax-deductible",
  };
}

/** IO. Validates against settings, creates the link and the PENDING order row. */
export async function createDonationCheckout(
  amountCents: number,
  settings: Pick<Settings, "donation_min_cents" | "donation_max_cents">,
): Promise<{ checkoutUrl: string; orderId: string }> {
  validateDonation(amountCents, settings);
  const env = getEnv();
  const res = await square().checkout.paymentLinks.create(
    buildDonationPaymentLink({
      amountCents,
      locationId: env.SQUARE_LOCATION_ID,
      siteUrl: env.SITE_URL,
      idempotencyKey: randomUUID(),
    }),
  );
  const link = res.paymentLink;
  if (!link?.url || !link.orderId) throw new AppError("SQUARE_ERROR", 502, "Square didn't return a checkout link.");

  const { error } = await db().from("orders").insert({
    square_order_id: link.orderId,
    kind: "DONATION",
    status: "PENDING",
    total_cents: amountCents,
  });
  if (error) throw new Error(`orders insert: ${error.message}`);

  return { checkoutUrl: link.url, orderId: link.orderId };
}
