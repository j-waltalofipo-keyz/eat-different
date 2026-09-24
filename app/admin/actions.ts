"use server";
// Navigation — SOP: architecture/admin.md → Actions. Each action re-checks the session.
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { setKitchenOpen, setReviewHidden, updateSettings } from "@/execution/admin/adminData";
import { checkPassword, issueSession, SESSION_COOKIE, SESSION_MS } from "@/execution/admin/session";
import { parseSettingsForm } from "@/execution/admin/settingsForm";
import { sendOpenAlert } from "@/execution/email/sendOpenAlert";
import { getEnv } from "@/execution/lib/env";
import { adminKey, requireAdmin } from "./auth";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const env = getEnv();
  const key = adminKey();
  if (!env.ADMIN_PASSWORD || !key) return { error: "Admin login isn't set up yet — ADMIN_PASSWORD is empty." };
  if (!checkPassword(String(form.get("password") ?? ""), env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "Wrong password." };
  }
  (await cookies()).set(SESSION_COOKIE, issueSession(Date.now(), key), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function toggleKitchen(form: FormData): Promise<void> {
  await requireAdmin();
  await setKitchenOpen(form.get("open") === "true");
  revalidatePath("/admin");
}

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await updateSettings(parseSettingsForm((name) => form.get(name)));
  } catch (e) {
    if (e instanceof ZodError) return { error: e.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`).join(" · ") };
    throw e;
  }
  revalidatePath("/admin");
  return { ok: "Saved." };
}

export async function toggleReviewHidden(form: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  await setReviewHidden(id, form.get("hidden") === "true");
  revalidatePath("/admin");
}

export async function sendOpenAlertAction(): Promise<void> {
  await requireAdmin();
  const { sent, failed } = await sendOpenAlert();
  redirect(`/admin?alert=${sent}-${failed}`);
}
