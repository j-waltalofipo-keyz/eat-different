"use server";
// Navigation — SOPs: admin.md, menu-admin.md, order-queue.md → Actions. Every action re-checks the session.
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { setKitchenOpen, setReviewHidden, updateSettings } from "@/execution/admin/adminData";
import { parseMenuItemForm, saveMenuItem, setMenuFlag } from "@/execution/admin/menuAdmin";
import { checkPassword, issueSession, SESSION_COOKIE, SESSION_MS } from "@/execution/admin/session";
import { friendlyError, SETTINGS_CARDS, type SettingsCard } from "@/execution/admin/settingsForm";
import { processPhoto } from "@/execution/assets/processPhoto";
import { sendOpenAlert } from "@/execution/email/sendOpenAlert";
import { AppError } from "@/execution/lib/errors";
import { getEnv } from "@/execution/lib/env";
import { setFulfilled } from "@/execution/orders/orderQueue";
import { adminKey, requireAdmin } from "./auth";

export type FormState = { error?: string; ok?: string; at?: number } | undefined;

/** Expected failures → a plain sentence for the card; anything else is a real bug and throws. */
function explain(e: unknown): FormState {
  if (e instanceof ZodError) return { error: friendlyError(e), at: Date.now() };
  if (e instanceof AppError) return { error: e.message, at: Date.now() };
  throw e;
}

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

// ---- Kitchen + notify list ------------------------------------------------------------------
export async function toggleKitchen(open: boolean): Promise<void> {
  await requireAdmin();
  await setKitchenOpen(open);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function sendOpenAlertAction(): Promise<{ sent: number; failed: number }> {
  await requireAdmin();
  return sendOpenAlert();
}

// ---- Site / fund cards ------------------------------------------------------------------------
export async function saveCard(card: SettingsCard, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await updateSettings(SETTINGS_CARDS[card]((name) => form.get(name)));
  } catch (e) {
    return explain(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: "Saved", at: Date.now() };
}

// ---- Reviews --------------------------------------------------------------------------------
export async function toggleReviewHidden(id: number, hidden: boolean): Promise<void> {
  await requireAdmin();
  if (!Number.isInteger(id)) return;
  await setReviewHidden(id, hidden);
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---- Orders ---------------------------------------------------------------------------------
export async function markDone(orderId: string, done: boolean): Promise<void> {
  await requireAdmin();
  await setFulfilled(orderId, done);
  revalidatePath("/admin");
}

// ---- Menu -----------------------------------------------------------------------------------
export async function saveDish(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  let result: { itemId: string; photoFailed: boolean };
  try {
    const input = parseMenuItemForm(form);
    const file = form.get("photo");
    const photo = file instanceof Blob && file.size > 0 ? await processPhoto(file) : null;
    result = await saveMenuItem(input, photo);
  } catch (e) {
    return explain(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  const done = form.get("itemId") ? "updated" : "added";
  redirect(`/admin?tab=menu&saved=${result.photoFailed ? "photo-failed" : done}`);
}

export async function setDishFlag(itemId: string, flag: "hidden" | "sold_out", value: boolean): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await setMenuFlag(itemId, flag, value);
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}
