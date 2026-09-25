"use client";
// SOP: admin.md → Goal. Shared dashboard pieces: one look, big targets, plain words, "Saved ✓" on every card.
import { startTransition, useActionState, useEffect, useState } from "react";
import { saveCard, type FormState } from "./actions";
import type { SettingsCard } from "@/execution/admin/settingsForm";

export const inputCls =
  "min-h-12 w-full rounded-2xl border border-cream/15 bg-cream/[0.04] px-4 py-3 text-base text-cream placeholder:text-cream/30 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";

export function Card({ title, hint, badge, children, className = "" }: { title: string; hint?: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-cream/10 bg-[#131313] p-5 shadow-[0_1px_0_rgba(243,234,216,0.04)_inset] sm:p-6 ${className}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide">{title}</h2>
          {hint && <p className="mt-1 text-sm text-cream/60">{hint}</p>}
        </div>
        {badge}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-cream/85">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-cream/50">{hint}</p>}
    </div>
  );
}

export function Chip({ tone = "muted", children }: { tone?: "gold" | "ember" | "muted" | "ok"; children: React.ReactNode }) {
  const tones = {
    gold: "bg-gold/15 text-gold",
    ember: "bg-ember/20 text-[#ff8a98]",
    muted: "bg-cream/10 text-cream/70",
    ok: "bg-[#1f3d2a] text-[#8fe3a8]",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

/** A real checkbox (works in forms, keyboard, screen readers) drawn as a switch. */
export function Switch({
  name,
  checked,
  defaultChecked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (on: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const track = size === "lg" ? "h-9 w-16" : "h-7 w-12";
  const knob = size === "lg" ? "h-7 w-7 peer-checked:translate-x-7" : "h-5 w-5 peer-checked:translate-x-5";
  return (
    <label className={`relative inline-flex shrink-0 cursor-pointer items-center ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span className={`${track} rounded-full bg-cream/15 transition-colors peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50`} />
      <span className={`absolute left-1 ${knob} rounded-full bg-cream shadow transition-transform peer-checked:bg-ink`} />
    </label>
  );
}

/** "Saved ✓" that fades after a moment; errors stay until the next save. */
export function SaveStatus({ state }: { state: FormState }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!state?.at) return;
    setShown(true);
    if (!state.ok) return;
    const t = setTimeout(() => setShown(false), 2600);
    return () => clearTimeout(t);
  }, [state?.at, state?.ok]);
  if (!state || !shown) return null;
  return state.error ? (
    <p role="alert" className="rounded-2xl bg-ember/15 px-4 py-3 text-sm text-[#ffb3bd]">
      {state.error}
    </p>
  ) : (
    <p role="status" className="text-sm font-semibold text-[#8fe3a8]">
      ✓ {state.ok}
    </p>
  );
}

export function PrimaryButton({ children, pending, pendingLabel = "Saving…", className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean; pendingLabel?: string }) {
  return (
    <button
      {...rest}
      disabled={pending || rest.disabled}
      className={`min-h-12 rounded-full bg-gold px-7 font-display text-lg uppercase tracking-wider text-ink transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Submit handler that skips React's automatic form reset after an action. The reset un-ticks
 * controlled switches (desyncing them from what's on screen) and would wipe a chosen photo on an
 * error — so what Eddie typed stays exactly as typed (lesson 2026-09-24, admin.md).
 */
export function submitKeepingValues(dispatch: (form: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => dispatch(form));
  };
}

/** One settings card = one form = one Save. */
export function CardForm({ card, children, submitLabel = "Save" }: { card: SettingsCard; children: React.ReactNode; submitLabel?: string }) {
  const [state, action, pending] = useActionState(saveCard.bind(null, card), undefined);
  return (
    <form onSubmit={submitKeepingValues(action)} className="grid gap-4">
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton pending={pending}>{submitLabel}</PrimaryButton>
        <SaveStatus state={state} />
      </div>
    </form>
  );
}
