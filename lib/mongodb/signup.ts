import "server-only";

import { Resend } from "resend";

import { DEMO_ARCHIVE_ITEMS } from "@/lib/content/demo-data";
import { normalizeSources } from "@/lib/content/sources";
import { getStoredCategoryForMainInterest } from "@/lib/content/sub-interests";
import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getBrandedFromEmail, getEmailLogoUrl } from "@/lib/email/brand";
import { renderDailyBriefEmail } from "@/lib/email/template";
import { createUnsubscribeToken, upsertSubscriberSignup } from "@/lib/mongodb/user-data";
import { getMongoDb } from "@/lib/mongodb/client";
import { getSlmCollections } from "@/lib/mongodb/collections";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const upsertMongoSignup = upsertSubscriberSignup;

type BriefCard = {
  title: string;
  shortSummary: string;
  actionLine: string;
  sources: ReturnType<typeof normalizeSources>;
};

async function fetchLatestApprovedCardForInterest(interest: string): Promise<BriefCard | null> {
  if (!hasSupabaseServerEnv()) return null;
  const supabase = createAdminSupabaseClient();
  const storedCategory = getStoredCategoryForMainInterest(interest);
  const { data } = await supabase
    .from('sj_content_items')
    .select("title, short_summary, action_line, sources, source_name, source_url")
    .eq("approval_status", "approved")
    .eq("category", storedCategory)
    .or("summary_status.eq.done,ai_status.eq.completed")
    .not("short_summary", "is", null)
    .not("action_line", "is", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data || !data.short_summary || !data.action_line) return null;
  return {
    title: String(data.title ?? ""),
    shortSummary: String(data.short_summary),
    actionLine: String(data.action_line),
    sources: normalizeSources(data)
  };
}

export async function sendSignupPreviewEmail(input: { email: string; userId: unknown; interests: string[] }) {
  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const rawToken = await createUnsubscribeToken(String(input.userId));

  // 선택한 관심사별로 실제 발송용 콘텐츠를 1건씩 가져옴 (daily cron과 동일한 로직)
  const realCards = (
    await Promise.all(input.interests.map((interest) => fetchLatestApprovedCardForInterest(interest)))
  ).filter((card): card is BriefCard => card !== null);

  let cards: BriefCard[] = realCards;
  // 운영 콘텐츠가 부족한 초기·테스트 환경에서만 데모 데이터로 보강
  if (cards.length < input.interests.length) {
    const demoCards = input.interests
      .flatMap((interest) =>
        DEMO_ARCHIVE_ITEMS.filter((item) => item.main_interest === interest).slice(0, 1)
      )
      .map((item) => ({
        title: item.title,
        shortSummary: item.short_summary,
        actionLine: item.action_line,
        sources: normalizeSources(item)
      }));
    cards = [...cards, ...demoCards].slice(0, Math.max(input.interests.length, 3));
  }
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
