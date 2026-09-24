"use client";
// Minimal functional forms; Phase S styles them.
import { useActionState } from "react";
import type { Settings } from "@/execution/schemas";
import { login, saveSettings } from "./actions";

const input = "mt-1 w-full rounded bg-white/10 p-2 text-cream";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-3">
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      {state?.error && <p className="text-red-400">{state.error}</p>}
      <button disabled={pending} className="rounded bg-gold p-2 font-bold text-ink">
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

const dollars = (cents: number) => (cents / 100).toFixed(2);

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const field = (name: string, label: string, value: string, type = "text") => (
    <label>
      {label}
      <input name={name} type={type} defaultValue={value} className={input} />
    </label>
  );
  return (
    <form action={action} className="grid gap-3">
      {field("fund_per_order", "Truck fund $ per food order", dollars(settings.fund_per_order_cents))}
      {field("fund_goal", "Truck fund goal $ (private)", dollars(settings.fund_goal_cents))}
      {field("donation_min", "Donation minimum $", dollars(settings.donation_min_cents))}
      {field("donation_max", "Donation maximum $", dollars(settings.donation_max_cents))}
      {field("donation_presets", "Donation preset buttons $ (comma-separated)", settings.donation_presets_cents.map(dollars).join(", "))}
      {field("pickup_address", "Pickup address (shown only after payment)", settings.pickup_address ?? "")}
      {field("pickup_instructions", "Pickup instructions", settings.pickup_instructions ?? "")}
      {field("google_review_url", "Google review link (https://…)", settings.google_review_url ?? "", "url")}
      {state?.error && <p className="text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-green-400">{state.ok}</p>}
      <button disabled={pending} className="rounded bg-gold p-2 font-bold text-ink">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
