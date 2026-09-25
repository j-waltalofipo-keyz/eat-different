"use client";
// SOP: architecture/site-pages.md → Cart. Browser-only cart state (localStorage, try/catch).
import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { cartReducer, EMPTY_CART, parseStoredCart, type Cart, type CartAction } from "@/execution/site/cart";

const KEY = "ed-cart-v1";

type CartContext = {
  cart: Cart;
  dispatch: (action: CartAction) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {}
    dispatch({ type: "load", cart: parseStoredCart(raw) });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, loaded]);

  return <Ctx.Provider value={{ cart, dispatch, drawerOpen, setDrawerOpen }}>{children}</Ctx.Provider>;
}

export function useCart(): CartContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
