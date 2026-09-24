// Server environment, validated once. Never import from client components.
import { z } from "zod";

const EnvSchema = z.object({
  SQUARE_ENVIRONMENT: z.enum(["sandbox", "production"]),
  SQUARE_ACCESS_TOKEN: z.string().min(1),
  SQUARE_LOCATION_ID: z.string().min(1),
  SQUARE_WEBHOOK_SIGNATURE_KEY: z.string().optional(),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  OWNER_EMAIL: z.email(),
  SITE_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
  APP_SECRET: z.string().min(32),
  // Optional so the public site runs without it; /admin login stays disabled until it's set.
  ADMIN_PASSWORD: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .refine((v) => v === undefined || v.length >= 12, "ADMIN_PASSWORD must be at least 12 characters"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Throws listing the invalid key names only — never values. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const keys = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
    throw new Error(`invalid or missing env: ${keys.join(", ")}`);
  }
  return (cached = parsed.data);
}
