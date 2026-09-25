"use client";
// SOP: architecture/reviews.md + site-pages.md §8. Real reviews only; every rating shows;
// Google button for every successful reviewer, only when a Google link is set (D30).
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicReview, ReviewSummary } from "@/execution/reviews/listReviews";
import { Sheet } from "./Sheet";

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-1", "-rotate-2", "rotate-3"];

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} out of 5 stars`} className="tracking-widest text-ember">
    {"★".repeat(n)}
    <span className="text-ink/20">{"★".repeat(5 - n)}</span>
  </span>
);

function ReviewForm({ googleReviewUrl, onDone }: { googleReviewUrl: string | null; onDone: () => void }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          receiptNumber: f.get("receipt"),
          email: f.get("email"),
          rating,
          displayName: f.get("name"),
          body: f.get("body"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(
          data.error === "INVALID_INPUT"
            ? "Check the fields: your name, a real email, and at least 10 characters of review."
            : (data.message ?? "Couldn't post your review. Try again."),
        );
      }
    } catch {
      setError("Couldn't post your review. Check your connection and try again.");
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="grid gap-4 pt-6">
        <p className="font-brush text-5xl text-gold">Fa&rsquo;afetai!</p>
        <p>Your review is up. Thank you for eating different.</p>
        {googleReviewUrl && (
          <a href={googleReviewUrl} target="_blank" rel="noopener" className="justify-self-start rounded-full bg-gold px-6 py-3 font-display uppercase tracking-wider text-ink">
            Review us on Google too
          </a>
        )}
        <button type="button" onClick={onDone} className="justify-self-start underline">
          Close
        </button>
      </div>
    );
  }

  const input = "min-h-11 rounded-xl bg-cream/10 px-4 py-2";
  return (
    <form onSubmit={submit} className="mt-4 grid gap-4">
      <p className="text-sm text-cream/70">
        Reviews are from real customers only. Use the receipt number and email from your Square receipt.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-medium">Receipt #</span>
          <input name="receipt" required maxLength={20} autoComplete="off" className={input} />
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Email used at checkout</span>
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
      </div>
      <fieldset className="grid gap-2">
        <legend className="font-medium">Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={`grid h-11 w-11 place-items-center rounded-full text-2xl ${n <= rating ? "text-gold" : "text-cream/25"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1">
        <span className="font-medium">Name to show</span>
        <input name="name" required maxLength={40} autoComplete="given-name" className={input} />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Your review</span>
        <textarea name="body" required minLength={10} maxLength={1000} rows={4} className={input} />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-ember/20 p-3 text-sm">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-gold px-6 py-3 font-display text-lg uppercase tracking-wider text-ink disabled:opacity-50">
        {busy ? "Posting…" : "Post my review"}
      </button>
    </form>
  );
}

export function Reviews({ reviews, summary, googleReviewUrl }: { reviews: PublicReview[]; summary: ReviewSummary; googleReviewUrl: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <section id="reviews" className="scroll-mt-16 bg-gold px-4 py-20 text-ink sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">
            What <span className="font-brush">KC</span> says
          </h2>
          {summary.count > 0 && (
            <p className="mt-3 text-lg">
              <Stars n={Math.round(summary.average ?? 0)} /> {summary.average} from {summary.count} review{summary.count === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <button type="button" onClick={() => setOpen(true)} className="min-h-12 rounded-full bg-ink px-6 py-3 font-display uppercase tracking-wider text-gold">
          Leave a review
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-12 max-w-md font-brush text-3xl leading-snug">Be the first to review E.D. Your receipt # is on your Square receipt.</p>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <figure key={`${r.createdAt}-${i}`} className={`relative m-0 bg-cream p-5 shadow-[0_18px_30px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:rotate-0 hover:scale-[1.03] ${TILTS[i % TILTS.length]}`}>
              <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-ink/15" aria-hidden />
              <p className="text-xl">
                <Stars n={r.rating} />
              </p>
              <blockquote className="m-0 mt-2 font-brush text-xl leading-snug">{r.body}</blockquote>
              <figcaption className="mt-3 font-display text-sm uppercase tracking-widest">
                — {r.displayName} · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} label="Leave a review">
        <h3 className="pr-12 font-display text-4xl uppercase">Leave a review</h3>
        {open && <ReviewForm googleReviewUrl={googleReviewUrl} onDone={() => setOpen(false)} />}
      </Sheet>
    </section>
  );
}
