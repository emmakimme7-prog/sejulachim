import "server-only";

import { getServerEnv } from "@/lib/env";

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return match?.[1]?.trim() ?? value.trim();
}

export function getBrandedFromEmail() {
  const env = getServerEnv();
  return `세줄아침 <${extractEmailAddress(env.RESEND_FROM_EMAIL)}>`;
}

export function getEmailLogoUrl() {
  const env = getServerEnv();
  return `${env.APP_URL.replace(/\/$/, "")}/threeline_morning_logo_v2.png`;
}
