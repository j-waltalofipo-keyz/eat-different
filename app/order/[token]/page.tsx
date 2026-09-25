// Navigation — SOP: architecture/site-pages.md → /order/[token]. Pickup address only when PAID
// (Invariant 3). Referrer-Policy: no-referrer is set in next.config.ts for /order/*.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatUsd } from "@/execution/lib/money";
import { getOrderView } from "@/execution/orders/getOrderView";
import { OrderPoller } from "./OrderPoller";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your E.D. order", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const view = await getOrderView((await params).token);
  if (!view) notFound();

  const paid = view.status === "PAID";
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl content-center gap-6 px-4 py-16">
      <a href="/" className="font-brush text-4xl text-gold">
        E.D.
      </a>

      {view.status === "PENDING" && (
        <>
          <h1 className="font-display text-5xl uppercase leading-none">Confirming your payment…</h1>
          <p className="text-cream/80">This usually takes a few seconds. This page refreshes on its own.</p>
          <OrderPoller clearCart={false} />
        </>
      )}

      {paid && view.kind === "FOOD" && (
        <>
          <OrderPoller clearCart />
          <p className="font-brush text-6xl leading-none text-gold">Fa&rsquo;afetai{view.customerName ? `, ${view.customerName}` : ""}!</p>
          <h1 className="font-display text-4xl uppercase leading-tight">Your order is in. Eddie&rsquo;s on it.</h1>
          <dl className="grid gap-4 rounded-2xl border-2 border-gold/60 p-5">
            <div>
              <dt className="font-display text-sm uppercase tracking-widest text-cream/60">Receipt #</dt>
              <dd className="font-brush text-3xl">{view.receiptNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-display text-sm uppercase tracking-widest text-cream/60">Total</dt>
              <dd className="text-xl">{formatUsd(view.totalCents)}</dd>
            </div>
            <div>
              <dt className="font-display text-sm uppercase tracking-widest text-cream/60">Pickup</dt>
              <dd className="text-xl">
                {view.pickup?.address ?? "Eddie will share pickup details."}
                {view.pickup?.instructions && <p className="mt-1 text-base text-cream/80">{view.pickup.instructions}</p>}
              </dd>
            </div>
          </dl>
          <p className="text-cream/80">
            Keep your receipt # handy. After you eat, you can use it to{" "}
            <a href="/#reviews" className="text-gold underline">
              review your plate
            </a>
            .
          </p>
        </>
      )}

      {paid && view.kind === "DONATION" && (
        <>
          <p className="font-brush text-6xl text-gold">Fa&rsquo;afetai!</p>
          <h1 className="font-display text-4xl uppercase">Thanks for chipping in for the truck.</h1>
        </>
      )}

      {view.status === "REFUNDED" && (
        <>
          <h1 className="font-display text-4xl uppercase">This order was refunded.</h1>
          <p className="text-cream/80">Questions? Reach out to Eddie.</p>
        </>
      )}

      <a href="/" className="justify-self-start rounded-full border-2 border-cream px-6 py-3 font-display uppercase tracking-wider">
        Back to E.D.
      </a>
    </main>
  );
}
