"use client";
// PENDING → re-render every 3 s (≈60 s max). PAID → clear the browser cart once.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OrderPoller({ clearCart }: { clearCart: boolean }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (clearCart) {
      try {
        localStorage.removeItem("ed-cart-v1");
      } catch {}
      return;
    }
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > 20) {
        clearInterval(id);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [clearCart, router]);

  return gaveUp ? <p className="text-cream/80">Still confirming. Refresh this page in a moment.</p> : null;
}
