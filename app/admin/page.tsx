// Navigation — SOP: architecture/admin.md. Private owner dashboard (functional; styled in Phase S).
import { getAdminStats, listAllReviews } from "@/execution/admin/adminData";
import { computeProgress } from "@/execution/fund/computeProgress";
import { formatUsd } from "@/execution/lib/money";
import { getSettings } from "@/execution/settings";
import { logout, sendOpenAlertAction, toggleKitchen, toggleReviewHidden } from "./actions";
import { requireAdmin } from "./auth";
import { SettingsForm } from "./forms";

export const metadata = { title: "E.D. Admin", robots: { index: false } };
export const dynamic = "force-dynamic"; // per-request session check; never prerender

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ alert?: string }> }) {
  await requireAdmin();
  const [settings, stats, reviews, { alert }] = await Promise.all([getSettings(), getAdminStats(), listAllReviews(), searchParams]);
  const fund = computeProgress(stats.fundTotalCents, settings.fund_goal_cents, new Date());
  const [sent, failed] = (alert ?? "").split("-");

  return (
    <main className="mx-auto grid max-w-2xl gap-8 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">E.D. Admin</h1>
        <form action={logout}>
          <button className="underline">Log out</button>
        </form>
      </header>

      <section className="grid gap-2">
        <h2 className="text-xl font-bold">Kitchen</h2>
        <p>
          The kitchen is <strong>{settings.kitchen_open ? "OPEN — taking orders" : "CLOSED — menu is view-only"}</strong>.
        </p>
        <form action={toggleKitchen}>
          <input type="hidden" name="open" value={String(!settings.kitchen_open)} />
          <button className="rounded bg-gold p-2 font-bold text-ink">{settings.kitchen_open ? "Close the kitchen" : "Open the kitchen"}</button>
        </form>
      </section>

      <section className="grid gap-1">
        <h2 className="text-xl font-bold">Truck fund (private)</h2>
        <p>
          {formatUsd(stats.fundTotalCents)} of {formatUsd(settings.fund_goal_cents)} — the public site shows only <strong>{fund.percent}%</strong>.
        </p>
      </section>

      <section className="grid gap-2">
        <h2 className="text-xl font-bold">&ldquo;We&rsquo;re open&rdquo; alert</h2>
        <p>{stats.subscribers} people on the notify list.</p>
        {alert && (
          <p>
            Last send: {sent} sent, {failed} failed.
          </p>
        )}
        <form action={sendOpenAlertAction}>
          <button className="rounded border border-gold p-2">Email the notify list now</button>
        </form>
      </section>

      <section className="grid gap-2">
        <h2 className="text-xl font-bold">Settings</h2>
        <SettingsForm settings={settings} />
      </section>

      <section className="grid gap-2">
        <h2 className="text-xl font-bold">Reviews</h2>
        <p className="text-sm opacity-80">Hide spam or abuse only — never a review just because it&rsquo;s low.</p>
        {reviews.length === 0 && <p>No reviews yet.</p>}
        <ul className="grid gap-3">
          {reviews.map((r) => (
            <li key={r.id} className={`rounded border border-white/20 p-3 ${r.hidden ? "opacity-50" : ""}`}>
              <p>
                <strong>{r.displayName}</strong> · {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)} · {new Date(r.createdAt).toLocaleDateString()}
                {r.hidden && " · HIDDEN"}
              </p>
              <p>{r.body}</p>
              <form action={toggleReviewHidden}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="hidden" value={String(!r.hidden)} />
                <button className="underline">{r.hidden ? "Unhide" : "Hide as spam/abuse"}</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
