import { redirect } from "next/navigation";
import { isAdmin } from "../auth";
import { LoginForm } from "../forms";

export const metadata = { title: "E.D. Kitchen Office", robots: { index: false } };
export const dynamic = "force-dynamic"; // per-request session check; never prerender

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_50%_30%,rgba(245,178,26,0.12),transparent_60%),#0b0b0b] px-4 text-cream">
      <div className="w-full max-w-sm rounded-3xl border border-cream/10 bg-[#131313] p-7 shadow-2xl">
        <p className="font-brush text-6xl text-gold">E.D.</p>
        <h1 className="mt-2 font-display text-2xl uppercase tracking-wide">Kitchen office</h1>
        <p className="mb-6 mt-1 text-sm text-cream/60">Orders, menu, hours and more — all in one place.</p>
        <LoginForm />
      </div>
    </main>
  );
}
