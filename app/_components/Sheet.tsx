"use client";
// Native <dialog>: Esc closes, focus stays inside, backdrop click closes. site-pages.md → Accessibility.
import { useEffect, useRef } from "react";

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
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const shape =
    side === "right"
      ? "ml-auto mr-0 h-dvh max-h-none w-full sm:max-w-md"
      : "mb-0 mt-auto w-full max-w-2xl max-h-[92dvh] rounded-t-3xl sm:mb-auto sm:rounded-3xl";

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`${shape} overflow-hidden bg-ink p-0 text-cream backdrop:bg-black/70 backdrop:backdrop-blur-sm`}
    >
      <div className="relative h-full max-h-[inherit] overflow-y-auto overscroll-contain p-5 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-2xl leading-none hover:bg-cream/20"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
