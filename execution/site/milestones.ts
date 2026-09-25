// SOP: architecture/truck-fund.md + design-direction.md §8 (D27: truck parts only). Pure.

export const MILESTONES = [
  { at: 10, label: "Wheels" },
  { at: 25, label: "Grill" },
  { at: 50, label: "Awning" },
  { at: 75, label: "Crown" },
  { at: 100, label: "Keys" },
] as const;

export type TruckProgress = {
  reached: number[]; // milestone `at` values reached
  next: { at: number; label: string } | null;
  toNextPct: number; // 0–100: progress from the previous part to the next one
};

export function truckProgress(percent: number): TruckProgress {
  const p = Math.max(0, Math.min(100, percent));
  const reached = MILESTONES.filter((m) => p >= m.at).map((m) => m.at);
  const next = MILESTONES.find((m) => p < m.at) ?? null;
  const prevAt = reached.at(-1) ?? 0;
  const toNextPct = next ? Math.floor(((p - prevAt) / (next.at - prevAt)) * 100) : 100;
  return { reached, next: next ? { at: next.at, label: next.label } : null, toNextPct };
}
