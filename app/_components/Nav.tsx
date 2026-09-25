"use client";
import { cartCount } from "@/execution/site/cart";
import { useCart } from "./cart/CartProvider";

export function Nav() {
  const { cart, setDrawerOpen } = useCart();
  const count = cartCount(cart);
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between bg-ink/85 px-4 py-3 backdrop-blur sm:px-8">
      <a href="#top" className="font-brush text-3xl text-gold" aria-label="Eat. Different. — home">
        E.D.
      </a>
      <div className="hidden gap-6 font-display text-sm uppercase tracking-widest sm:flex">
        <a href="#menu" className="hover:text-gold">Menu</a>
        <a href="#truck" className="hover:text-gold">The Truck</a>
        <a href="#eddie" className="hover:text-gold">Eddie</a>
        <a href="#reviews" className="hover:text-gold">Reviews</a>
      </div>
      <div className="flex items-center gap-2">
        {count > 0 && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full border-2 border-gold px-4 py-2 font-display uppercase tracking-wider text-gold"
          >
            Your order · {count}
          </button>
        )}
        <a href="#menu" className="rounded-full bg-gold px-5 py-2 font-display uppercase tracking-wider text-ink">
          Order
        </a>
      </div>
    </nav>
  );
}
