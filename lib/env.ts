import "server-only";

import { z } from "zod";

function normalizeEnvValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.replace(/\\n+$/g, "").trim();
  return normalized === "" ? undefined : normalized;
}

function normalizeEnvRecord(source: NodeJS.ProcessEnv) {
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, value]) => [key, normalizeEnvValue(value)])
      .filter(([, value]) => value !== undefined)
  );
}

const serverEnvSchema = z.object({
  APP_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB_NAME: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  PIXABAY_API_KEY: z.string().min(1).optional(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().min(1).optional(),
  COUPANG_PARTNERS_ACCESS_KEY: z.string().min(1).optional(),
  COUPANG_PARTNERS_SECRET_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(32),
  ADMIN_SESSION_SECRET: z.string().min(32),
  ADMIN_PASSWORD: z.string().min(12),
  ADMIN_EMAIL_ALLOWLIST: z.string().min(3)
});

const optionalServerEnvSchema = serverEnvSchema.partial();

export function getServerEnv() {
  return serverEnvSchema.parse(normalizeEnvRecord(process.env));
}

export function getOptionalServerEnv() {
  return optionalServerEnvSchema.parse(normalizeEnvRecord(process.env));
}

export function hasSupabaseServerEnv() {
  const parsed = optionalServerEnvSchema.safeParse(normalizeEnvRecord(process.env));
  if (!parsed.success) return false;

  return Boolean(parsed.data.SUPABASE_URL && parsed.data.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasMongoServerEnv() {
  const parsed = optionalServerEnvSchema.safeParse(normalizeEnvRecord(process.env));
  if (!parsed.success) return false;

  return Boolean(parsed.data.MONGODB_URI && parsed.data.MONGODB_DB_NAME);
}

export function getAdminAllowlist() {
  return getServerEnv()
    .ADMIN_EMAIL_ALLOWLIST.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
