"use client";
// SOPs: admin.md → Fund / Reviews tabs; truck-fund.md; reviews.md (hide spam/abuse only — never for a low rating).
import { useOptimistic, useTransition } from "react";
import { formatUsd } from "@/execution/lib/money";
import type { AdminReview } from "@/execution/admin/adminData";
import type { Settings } from "@/execution/schemas";
import { toggleReviewHidden } from "../actions";
import { Card, CardForm, Chip, Field, inputCls } from "../ui";

const dollars = (cents: number) => (cents / 100).toFixed(2);

export function FundTab({ settings: s, totalCents, percent }: { settings: Settings; totalCents: number; percent: number }) {
  return (
    <>
      <div>
        <h1 className="font-display text-4xl uppercase leading-none">Truck fund</h1>
        <p className="mt-1 text-sm text-cream/60">Dollars stay private to this page — the site only ever shows the percent.</p>
      </div>
      <Card title="Where it stands" badge={<Chip tone="ok">🔒 Private</Chip>}>
        <p className="font-brush text-5xl text-gold sm:text-6xl">{formatUsd(totalCents)}</p>
        <p className="text-cream/70">of {formatUsd(s.fund_goal_cents)} · the site shows <strong className="text-cream">{percent}%</strong></p>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-cream/10" aria-hidden>
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.min(100, (totalCents / s.fund_goal_cents) * 100)}%` }} />
        </div>
      </Card>
      <Card title="Fund settings" hint="Changes apply to orders and chip-ins from now on.">
        <CardForm card="fund">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="$ per food order" htmlFor="fund_per_order">
              <input id="fund_per_order" name="fund_per_order" inputMode="decimal" defaultValue={dollars(s.fund_per_order_cents)} className={inputCls} />
            </Field>
            <Field label="Goal $" htmlFor="fund_goal">
              <input id="fund_goal" name="fund_goal" inputMode="decimal" defaultValue={dollars(s.fund_goal_cents)} className={inputCls} />
            </Field>
            <Field label="Smallest chip-in $" htmlFor="donation_min" hint="Square's minimum is $1.">
              <input id="donation_min" name="donation_min" inputMode="decimal" defaultValue={dollars(s.donation_min_cents)} className={inputCls} />
            </Field>
            <Field label="Largest chip-in $" htmlFor="donation_max">
              <input id="donation_max" name="donation_max" inputMode="decimal" defaultValue={dollars(s.donation_max_cents)} className={inputCls} />
            </Field>
          </div>
          <Field label="Quick buttons $" htmlFor="donation_presets" hint="Up to 6, separated by commas — e.g. 5, 10, 25, 50">
            <input id="donation_presets" name="donation_presets" defaultValue={s.donation_presets_cents.map((c) => c / 100).join(", ")} className={inputCls} />
          </Field>
        </CardForm>
      </Card>
    </>
  );
}

function ReviewRow({ r }: { r: AdminReview }) {
  const [hidden, setHidden] = useOptimistic(r.hidden);
  const [, start] = useTransition();
  const flip = () =>
    start(async () => {
      setHidden(!hidden);
      await toggleReviewHidden(r.id, !hidden);
    });
  return (
    <li className={`rounded-3xl border border-cream/10 bg-[#131313] p-5 transition-opacity ${hidden ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {r.displayName} <span className="ml-1 tracking-widest text-gold">{"★".repeat(r.rating)}<span className="text-cream/25">{"★".repeat(5 - r.rating)}</span></span>
        </p>
        <p className="text-sm text-cream/50">
          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {hidden && <Chip>Hidden</Chip>}
        </p>
      </div>
      <p className="mt-2 text-cream/85">{r.body}</p>
      <button type="button" onClick={flip} className="mt-3 min-h-11 rounded-full border border-cream/20 px-5 text-sm hover:bg-cream/10">
        {hidden ? "Show it again" : "Hide — spam or abuse"}
      </button>
    </li>
  );
}

export function ReviewsTab({ reviews }: { reviews: AdminReview[] }) {
  return (
    <>
      <div>
        <h1 className="font-display text-4xl uppercase leading-none">Reviews</h1>
        <p className="mt-1 text-sm text-cream/60">
          Only hide spam or abuse — never a review just because it&rsquo;s low. That keeps you on the right side of the FTC and Google.
        </p>
      </div>
      {reviews.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-cream/15 px-6 py-10 text-center text-cream/60">No reviews yet. They show up here the moment someone posts.</p>
      ) : (
        <ul className="grid gap-3">
          {reviews.map((r) => (
            <ReviewRow key={r.id} r={r} />
          ))}
        </ul>
      )}
    </>
  );
}
