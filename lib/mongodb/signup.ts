import "server-only";

import { Resend } from "resend";

import { DEMO_ARCHIVE_ITEMS } from "@/lib/content/demo-data";
import { normalizeSources } from "@/lib/content/sources";
import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getBrandedFromEmail, getEmailLogoUrl } from "@/lib/email/brand";
import { renderDailyBriefEmail } from "@/lib/email/template";
import { createUnsubscribeToken, upsertSubscriberSignup } from "@/lib/mongodb/user-data";
import { getMongoDb } from "@/lib/mongodb/client";
import { getSlmCollections } from "@/lib/mongodb/collections";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const upsertMongoSignup = upsertSubscriberSignup;

export async function sendSignupPreviewEmail(input: { email: string; userId: unknown; interests: string[] }) {
  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const rawToken = await createUnsubscribeToken(String(input.userId));

  const selectedInterestCards = input.interests.flatMap((interest) =>
    DEMO_ARCHIVE_ITEMS.filter((item) => item.main_interest === interest).slice(0, 3)
  );

  const fallbackCards = DEMO_ARCHIVE_ITEMS.filter(
    (item) => !selectedInterestCards.some((selected) => selected.slug === item.slug)
  );

  const cards = [...selectedInterestCards, ...fallbackCards].slice(0, Math.max(input.interests.length * 3, 3)).map((item) => ({
    title: item.title,
    shortSummary: item.short_summary,
    actionLine: item.action_line,
    sources: normalizeSources(item)
  }));
  const response = await resend.emails.send({
    from: getBrandedFromEmail(),
    to: input.email,
    subject: "세줄아침 첫 브리핑을 보내드립니다",
    html: renderDailyBriefEmail({
      cards,
      unsubscribeUrl: `${env.APP_URL}/unsubscribe?token=${rawToken}`,
      logoUrl: getEmailLogoUrl()
    })
  });

  if (response.error) {
    throw new Error(`RESEND_SEND_FAILED:${response.error.message}`);
  }

  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    await supabase.from('sj_email_logs').insert({
      user_id: String(input.userId),
      status: "sent",
      provider_message_id: response.data?.id ?? null,
      sent_at: new Date().toISOString(),
      mode: "signup_preview",
      created_at: new Date().toISOString()
    });
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  await collections.emailLogs.insertOne({
    user_id: String(input.userId),
    status: "sent",
    provider_message_id: response.data?.id ?? null,
    sent_at: new Date().toISOString(),
    mode: "signup_preview",
    created_at: new Date().toISOString()
  });
}
