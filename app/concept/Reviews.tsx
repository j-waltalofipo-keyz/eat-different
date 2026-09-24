// Concept — design-direction.md §7 Reviews: taped polaroid cards. Content is SAMPLE copy only;
// the real site shows verified reviews from /api/reviews.
const SAMPLES = [
  { name: "Sample reviewer", stars: 5, text: "Placeholder: real, verified reviews from customers appear here.", tilt: "-rotate-3" },
  { name: "Sample reviewer", stars: 4, text: "Placeholder: every rating shows — the good and the honest.", tilt: "rotate-2" },
  { name: "Sample reviewer", stars: 5, text: "Placeholder: tap “Review us on Google” after posting here.", tilt: "-rotate-1" },
];

export function Reviews() {
  return (
    <section id="reviews" className="bg-gold px-4 py-20 text-ink sm:px-8">
      <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">
        What <span className="font-brush">KC</span> says
      </h2>
      <div className="mt-12 grid gap-10 sm:grid-cols-3">
        {SAMPLES.map((r, i) => (
          <figure
            key={i}
            className={`relative bg-cream p-4 pb-6 shadow-[0_18px_30px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:rotate-0 hover:scale-[1.03] ${r.tilt}`}
          >
            <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-ink/15" aria-hidden />
            <span className="absolute right-3 top-3 rounded bg-ember px-2 py-0.5 font-display text-xs uppercase tracking-widest text-cream">Sample</span>
            <div className="grid h-40 place-items-center bg-ink/10 font-display text-sm uppercase tracking-[0.3em] text-ink/40">Photo</div>
            <p className="mt-3 text-xl tracking-widest text-ember" aria-label={`${r.stars} out of 5 stars`}>
              {"★".repeat(r.stars)}
              <span className="text-ink/20">{"★".repeat(5 - r.stars)}</span>
            </p>
            <blockquote className="mt-2 font-brush text-xl leading-snug">{r.text}</blockquote>
            <figcaption className="mt-3 font-display text-sm uppercase tracking-widest">— {r.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink px-4 py-16 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="font-brush text-7xl text-gold sm:text-9xl">E.D.</p>
          <p className="mt-2 font-display text-xl uppercase tracking-widest">Eat. Different. · Kansas City, MO</p>
          <p className="mt-1 text-cream/70">Made with alofa in KC.</p>
        </div>
        <form className="rounded-2xl border-2 border-gold/60 p-5" aria-label="Notify me (concept)">
          <p className="font-display text-2xl uppercase">Kitchen closed? Get the heads-up.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input disabled type="email" placeholder="you@email.com" className="flex-1 rounded-full bg-cream/10 px-5 py-3 text-cream placeholder:text-cream/40" />
            <button disabled type="button" className="rounded-full bg-gold px-6 py-3 font-display uppercase tracking-wider text-ink opacity-80">
              Notify me
            </button>
          </div>
          <p className="mt-2 text-xs text-cream/50">Concept — not connected yet.</p>
        </form>
      </div>
    </footer>
  );
}
