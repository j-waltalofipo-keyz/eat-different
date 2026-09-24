import seedJson from "@/architecture/menu-seed.json";
import { SeedSchema, type Seed } from "../schemas";

let cached: Seed | null = null;

/** The owner-confirmed menu seed, validated. */
export function loadSeed(): Seed {
  return (cached ??= SeedSchema.parse(seedJson));
}

export const norm = (s: string | null | undefined): string => (s ?? "").trim().toLowerCase();
