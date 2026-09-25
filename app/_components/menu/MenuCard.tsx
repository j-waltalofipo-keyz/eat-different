// SOP: site-pages.md → Menu; menu-admin.md → card style. One card used by the site and the /admin live preview.
import Image from "next/image";
import { formatUsd } from "@/execution/lib/money";
import type { MenuItem } from "@/execution/schemas";

function Steam() {
  return (
    <svg viewBox="0 0 60 40" className="pointer-events-none absolute left-1/2 top-2 z-10 h-10 w-16 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
      {[10, 30, 50].map((x, i) => (
        <path key={x} d={`M${x} 38 C${x - 6} 28 ${x + 6} 20 ${x} 10 S${x + 4} 2 ${x} 0`} stroke="#f3ead8" strokeWidth="3" strokeLinecap="round" fill="none" className="motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </svg>
  );
}

/** Local crops (/images/…) have transparent edges → contain on the glow; real photos fill the frame. */
const isCrop = (url: string) => url.startsWith("/images/");

export type CardItem = Pick<MenuItem, "name" | "subtitle" | "description" | "priceCents" | "imageUrl" | "soldOut">;

export function MenuCard({ item, children }: { item: CardItem; children?: React.ReactNode }) {
  const url = item.imageUrl;
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-[#141414] transition-transform duration-300 ${
        item.soldOut ? "border-cream/20 opacity-60" : "border-gold/80 hover:-translate-y-2 motion-safe:hover:rotate-[-1deg]"
      }`}
    >
      <div
        className={`relative h-60 overflow-hidden ${
          url
            ? "bg-[radial-gradient(ellipse_at_50%_60%,rgba(245,178,26,0.16),transparent_62%),#0b0b0b]"
            : "bg-[repeating-linear-gradient(135deg,#1c1c1c_0_12px,#161616_12px_24px)]"
        }`}
      >
        {!item.soldOut && <Steam />}
        {url ? (
          <Image
            src={url}
            alt={item.name}
            fill
            sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw"
            unoptimized={url.startsWith("blob:")}
            className={`transition-transform duration-500 motion-safe:group-hover:scale-105 ${isCrop(url) ? "object-contain p-1" : "object-cover"}`}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-sm uppercase tracking-[0.3em] text-cream/35">Photo coming soon</span>
        )}
        <span className="absolute bottom-3 right-3 rotate-[-6deg] rounded-md bg-gold px-3 py-1 font-brush text-2xl text-ink shadow-md">
          {formatUsd(item.priceCents).replace(".00", "")}
        </span>
        {item.soldOut && <span className="absolute left-3 top-3 rotate-[-4deg] rounded bg-ember px-3 py-1 font-display uppercase tracking-widest text-cream">Sold out</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-3xl uppercase leading-tight text-gold">{item.name}</h3>
        {item.subtitle && <p className="font-brush text-lg text-cream">{item.subtitle}</p>}
        <p className="mt-3 text-sm text-cream/70">{item.description}</p>
        <span className="mt-5 self-start rounded-full bg-cream px-5 py-2 font-display uppercase tracking-wider text-ink transition-colors group-hover:bg-gold">
          {item.soldOut ? "Sold out" : "Build your plate +"}
        </span>
      </div>
      {children}
    </article>
  );
}
