import { redirect } from "next/navigation";
import { isAdmin } from "../auth";
import { LoginForm } from "../forms";

export const metadata = { title: "E.D. Admin", robots: { index: false } };
export const dynamic = "force-dynamic"; // per-request session check; never prerender

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-2xl font-bold">E.D. Admin</h1>
      <LoginForm />
    </main>
  );
}
