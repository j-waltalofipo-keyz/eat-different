// Pure: each /admin settings card → its own validated patch (dollars → cents, "" → null). SOP: admin.md → Actions.
import { z } from "zod";
import { WeekHoursSchema } from "../schemas";

type Get = (name: string) => unknown;

const str = (v: unknown) => String(v ?? "").trim();
const text = (max: number) => z.string().trim().max(max).transform((s) => s || null);
const https = z
  .string()
  .trim()
  .transform((s) => s || null)
  .refine((s) => s === null || /^https:\/\/\S+$/.test(s), "must be a full link starting with https://");
const dollarsToCents = (v: unknown): number => {
  const s = str(v).replace(/[$,\s]/g, "");
  return s === "" ? NaN : Math.round(Number(s) * 100);
};

export const FundSchema = z
  .object({
    fund_per_order_cents: z.number().int().min(0),
    fund_goal_cents: z.number().int().positive(),
    donation_min_cents: z.number().int().min(100),
    donation_max_cents: z.number().int().positive(),
    donation_presets_cents: z.array(z.number().int()).max(6),
  })
  .refine((s) => s.donation_min_cents <= s.donation_max_cents, { path: ["donation_max_cents"], message: "max must be ≥ min" })
  .refine((s) => s.donation_presets_cents.every((p) => p >= s.donation_min_cents && p <= s.donation_max_cents), {
    path: ["donation_presets_cents"],
    message: "presets must be within min..max",
  });

export const PickupSchema = z.object({
  pickup_area: text(60),
  pickup_address: text(500),
  pickup_instructions: text(500),
});

export const HoursFormSchema = z.object({ hours: WeekHoursSchema, hours_note: text(80) });

export const AnnouncementSchema = z
  .object({ announcement_on: z.boolean(), announcement_text: text(140) })
  .refine((a) => !a.announcement_on || a.announcement_text !== null, {
    path: ["announcement_text"],
    message: "type a message before turning the banner on",
  });

export const DrinkSchema = z.object({ drink_of_the_day: text(60) });

export const LinksSchema = z.object({
  google_review_url: https,
  instagram_url: https,
  tiktok_url: https,
  facebook_url: https,
});

export type SettingsPatch =
  | z.infer<typeof FundSchema>
  | z.infer<typeof PickupSchema>
  | z.infer<typeof HoursFormSchema>
  | z.infer<typeof AnnouncementSchema>
  | z.infer<typeof DrinkSchema>
  | z.infer<typeof LinksSchema>;

export const parseFundForm = (get: Get) =>
  FundSchema.parse({
    fund_per_order_cents: dollarsToCents(get("fund_per_order")),
    fund_goal_cents: dollarsToCents(get("fund_goal")),
    donation_min_cents: dollarsToCents(get("donation_min")),
    donation_max_cents: dollarsToCents(get("donation_max")),
    donation_presets_cents: str(get("donation_presets")).split(/[,\s]+/).filter(Boolean).map(dollarsToCents),
  });

export const parsePickupForm = (get: Get) =>
  PickupSchema.parse({
    pickup_area: str(get("pickup_area")),
    pickup_address: str(get("pickup_address")),
    pickup_instructions: str(get("pickup_instructions")),
  });

/** Fields per day d (0 = Mon): `d{d}_open` ("on" when open), `d{d}_from`, `d{d}_to` ("HH:MM"). */
export const parseHoursForm = (get: Get) =>
  HoursFormSchema.parse({
    hours: Array.from({ length: 7 }, (_, d) => (get(`d${d}_open`) ? { open: str(get(`d${d}_from`)), close: str(get(`d${d}_to`)) } : null)),
    hours_note: str(get("hours_note")),
  });

export const parseAnnouncementForm = (get: Get) =>
  AnnouncementSchema.parse({ announcement_on: Boolean(get("announcement_on")), announcement_text: str(get("announcement_text")) });

export const parseDrinkForm = (get: Get) => DrinkSchema.parse({ drink_of_the_day: str(get("drink_of_the_day")) });

export const parseLinksForm = (get: Get) =>
  LinksSchema.parse({
    google_review_url: str(get("google_review_url")),
    instagram_url: str(get("instagram_url")),
    tiktok_url: str(get("tiktok_url")),
    facebook_url: str(get("facebook_url")),
  });

export const SETTINGS_CARDS = {
  fund: parseFundForm,
  pickup: parsePickupForm,
  hours: parseHoursForm,
  announcement: parseAnnouncementForm,
  drink: parseDrinkForm,
  links: parseLinksForm,
} as const;
export type SettingsCard = keyof typeof SETTINGS_CARDS;

const LABELS: Record<string, string> = {
  fund_per_order_cents: "$ per order",
  fund_goal_cents: "Goal",
  donation_min_cents: "Donation minimum",
  donation_max_cents: "Donation maximum",
  donation_presets_cents: "Preset buttons",
  pickup_area: "Pickup area",
  pickup_address: "Pickup address",
  pickup_instructions: "Pickup instructions",
  hours_note: "Hours note",
  announcement_text: "Banner message",
  drink_of_the_day: "Drink of the day",
  google_review_url: "Google review link",
  instagram_url: "Instagram link",
  tiktok_url: "TikTok link",
  facebook_url: "Facebook link",
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Plain-words one-liner from a zod error: "Friday: closing time must be after opening time". */
export function friendlyError(e: z.ZodError): string {
  return e.issues
    .map((i) => {
      const [field, idx] = i.path;
      const where = field === "hours" && typeof idx === "number" ? DAYS[idx] : LABELS[String(field)];
      const msg = i.code === "too_big" && i.origin === "string" ? `keep it to ${Number(i.maximum)} characters or fewer` : i.message;
      return where ? `${where}: ${msg}` : msg;
    })
    .filter((m, i, all) => all.indexOf(m) === i)
    .join(" · ");
}
