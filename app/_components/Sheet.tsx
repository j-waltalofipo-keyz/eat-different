"use client";
import React, { useEffect, useCallback } from "react";

export function Sheet({
  open,
  onClose,
  label,
  side = "bottom",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: "bottom" | "right";
  children: React.ReactNode;
}) {
  // Lock body scroll on mobile/desktop when open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.body.setAttribute("data-sheet-open", "true");
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.removeAttribute("data-sheet-open");
      };
    }
  }, [open]);

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isRight = side === "right";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center"
    >
      {/* Dark backdrop overlay (tapping closes modal) */}
      <div
        className="fixed inset-0 bg-black/85 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sheet Container - 100% iOS Safari & Android Compatible */}
      <div
        className={`relative z-10 w-full bg-[#0d0d0d] text-cream shadow-[0_-20px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden transition-all duration-300 ${
          isRight
            ? "ml-auto mr-0 h-full sm:max-w-md border-l border-gold/30"
            : "max-h-[88vh] sm:max-h-[85vh] max-w-2xl rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-gold/40"
        }`}
      >
        {/* Top Pull Bar Indicator for Mobile */}
        {!isRight && (
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-cream/25 shrink-0" aria-hidden="true" />
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-full bg-cream/15 text-2xl font-bold text-cream hover:bg-cream/25 active:scale-95 transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* Scrollable Content Container with Momentum Touch Scrolling */}
        <div className="relative flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>
  );
}
