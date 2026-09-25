// The Data Schema from CLAUDE.md, as code. Change CLAUDE.md first, then this file.
import { z } from "zod";

const email = z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.email());

// ---- Menu ------------------------------------------------------------------
export const ModifierListSchema = z.object({
  id: z.string(),
  name: z.string(),
  selection: z.enum(["SINGLE", "MULTIPLE"]),
  required: z.boolean(),
  maxQtyPerOption: z.number().int().min(1),
  options: z.array(z.object({ id: z.string(), name: z.string(), priceCents: z.number().int() })),
});

export const MenuItemSchema = z.object({
  variationId: z.string(),
  itemId: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  description: z.string(),
  priceCents: z.number().int(),
  imageUrl: z.string().nullable(),
  category: z.string(),
  soldOut: z.boolean(),
  modifierLists: z.array(ModifierListSchema),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type ModifierList = z.infer<typeof ModifierListSchema>;

// ---- Seed (architecture/menu-seed.json) --------------------------------------
export const SeedSchema = z.object({
  categories: z.array(z.object({ key: z.string(), name: z.string() })),
  modifierLists: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      selection: z.enum(["SINGLE", "MULTIPLE"]),
      required: z.boolean(),
      maxQtyPerOption: z.number().int().min(1),
      options: z.array(z.object({ key: z.string(), name: z.string(), priceCents: z.number().int().min(0) })),
    }),
  ),
  items: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      subtitle: z.string().nullable(),
      category: z.string(),
      priceCents: z.number().int().positive(),
      ingredients: z.array(z.string()),
      modifierLists: z.array(z.string()),
      image: z.string().nullable(),
    }),
  ),
});
export type Seed = z.infer<typeof SeedSchema>;

// ---- Requests ----------------------------------------------------------------
export const CheckoutRequestSchema = z.object({
  items: z
    .array(
      z.object({
        variationId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
        modifiers: z.array(z.object({ id: z.string().min(1), qty: z.number().int() })).max(20).default([]),
      }),
    )
    .min(1)
    .max(30),
  customerName: z.string().trim().min(1).max(60),
  note: z.string().trim().max(200).nullish().transform((n) => n || null),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export const DonationRequestSchema = z.object({ amountCents: z.number().int() });

export const ReviewSubmitSchema = z.object({
  receiptNumber: z.string().trim().min(1).max(20),
  email,
  rating: z.number().int().min(1).max(5),
  displayName: z.string().trim().min(1).max(40),
  body: z.string().trim().min(10).max(1000),
});
export type ReviewSubmit = z.infer<typeof ReviewSubmitSchema>;

export const NotifySchema = z.object({ email });

// ---- Database rows -----------------------------------------------------------
/** "HH:MM", 24 h. */
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** One day of display-only hours (D42): closed (null) or open → close, same day. */
export const DayHoursSchema = z
  .object({ open: z.string().regex(HHMM), close: z.string().regex(HHMM) })
  .refine((d) => d.close > d.open, { message: "closing time must be after opening time" })
  .nullable();
/** Mon → Sun. */
export const WeekHoursSchema = z.array(DayHoursSchema).length(7);
export type DayHours = z.infer<typeof DayHoursSchema>;
export type WeekHours = z.infer<typeof WeekHoursSchema>;
export const CLOSED_WEEK: WeekHours = [null, null, null, null, null, null, null];

export const SettingsSchema = z.object({
  kitchen_open: z.boolean(),
  fund_per_order_cents: z.number().int(),
  fund_goal_cents: z.number().int().positive(),
  donation_presets_cents: z.array(z.number().int()),
  donation_min_cents: z.number().int(),
  donation_max_cents: z.number().int(),
  pickup_address: z.string().nullable(),
  pickup_instructions: z.string().nullable(),
  google_review_url: z.string().nullable(),
  pickup_area: z.string().nullable(),
  hours: WeekHoursSchema.catch(CLOSED_WEEK), // tolerant read: bad data shows as "no hours", never a crash
  hours_note: z.string().nullable(),
  announcement_on: z.boolean(),
  announcement_text: z.string().nullable(),
  drink_of_the_day: z.string().nullable(),
  instagram_url: z.string().nullable(),
  tiktok_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const OrderRowSchema = z.object({
  square_order_id: z.string(),
  kind: z.enum(["FOOD", "DONATION"]),
  square_payment_id: z.string().nullable(),
  receipt_number: z.string().nullable(),
  buyer_email: z.string().nullable(),
  customer_name: z.string().nullable(),
  total_cents: z.number().int(),
  status: z.enum(["PENDING", "PAID", "REFUNDED"]),
  created_at: z.string(),
  paid_at: z.string().nullable(),
});
export type OrderRow = z.infer<typeof OrderRowSchema>;

export type LedgerReason = "ORDER" | "DONATION" | "REFUND";
export type LedgerRow = { square_order_id: string; reason: LedgerReason; amount_cents: number };

/** Payment fields the app cares about, normalized from webhook JSON or the SDK. */
export type PaymentFacts = {
  id: string;
  orderId: string | null;
  status: string;
  receiptNumber: string | null;
  buyerEmail: string | null;
  amountCents: number; // excludes tip
  tipCents: number;
  totalCents: number;
  refundedCents: number;
};
