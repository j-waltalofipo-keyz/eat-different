// SOP: site-pages.md §0 (D44). Owner-set strip above the nav; only rendered when on + non-empty.
export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div role="region" aria-label="Announcement" className="bg-gold px-4 py-2 text-center font-display text-sm uppercase tracking-wider text-ink sm:text-base">
      {text}
    </div>
  );
}
