"use client";
// SOP: admin.md → Login.
import { useActionState } from "react";
import { login } from "./actions";
import { inputCls, PrimaryButton } from "./ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-semibold text-cream/85">
        Password
        <input name="password" type="password" autoComplete="current-password" required autoFocus className={inputCls} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-ember/15 px-4 py-3 text-sm text-[#ffb3bd]">
          {state.error}
        </p>
      )}
      <PrimaryButton pending={pending} pendingLabel="Checking…" className="w-full">
        Open the office
      </PrimaryButton>
    </form>
  );
}
