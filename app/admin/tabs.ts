// SOP: admin.md → Layout. Plain module (not "use client") so the server page can validate ?tab=.
export const TABS = ["orders", "menu", "site", "fund", "reviews"] as const;
export type Tab = (typeof TABS)[number];

export const asTab = (raw: string | undefined, kitchenOpen: boolean): Tab =>
  (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : kitchenOpen ? "orders" : "menu";
