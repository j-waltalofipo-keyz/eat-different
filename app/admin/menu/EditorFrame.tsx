// SOP: menu-admin.md. Page chrome shared by "Add a dish" and "Edit".
import Link from "next/link";

export function EditorFrame({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink pb-10 text-cream">
      <main className="mx-auto grid max-w-5xl gap-6 px-4 pt-5 sm:px-6">
        <Link href="/admin?tab=menu" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-3 text-cream/70 hover:bg-cream/10 hover:text-cream">
          ← Back to menu
        </Link>
        <header>
          <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">{title}</h1>
          <p className="mt-2 text-cream/60">{hint}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
