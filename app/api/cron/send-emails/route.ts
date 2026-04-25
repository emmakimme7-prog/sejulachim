import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { normalizeSources } from "@/lib/content/sources";
import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getBrandedFromEmail, getEmailLogoUrl } from "@/lib/email/brand";
import { renderDailyBriefEmail } from "@/lib/email/template";
import { createUnsubscribeToken } from "@/lib/mongodb/user-data";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { hasKakaoConfig, sendKakaoAlimtalk } from "@/lib/solapi/kakao";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getKstDateParts } from "@/lib/utils";

// 카카오톡 플랫폼 자기홍보로 심사 반려될 수 있어 치환.
function sanitizeForKakao(text: string): string {
  return text.replace(/카카오톡/g, "메신저").replace(/카카오 채널/g, "SNS 채널");
}

function buildKakaoVariables(user: { id: string; email: string }, cards: EmailCard[]): Record<string, string> {
  const nickname = user.email?.split("@")[0] ?? "회원";
  const [c1, c2, c3] = cards;
  return {
    "#{nickname}": nickname,
    "#{category1}": c1?.mainInterest ?? "소식",
    "#{title1}": c1?.title ?? "",
    "#{summary1}": sanitizeForKakao(c1?.shortSummary ?? ""),
    "#{action1}": sanitizeForKakao(c1?.actionLine ?? ""),
    "#{category2}": c2?.mainInterest ?? "소식",
    "#{title2}": c2?.title ?? "",
    "#{summary2}": sanitizeForKakao(c2?.shortSummary ?? ""),
    "#{action2}": sanitizeForKakao(c2?.actionLine ?? ""),
    "#{category3}": c3?.mainInterest ?? "소식",
    "#{title3}": c3?.title ?? "",
    "#{summary3}": sanitizeForKakao(c3?.shortSummary ?? ""),
    "#{action3}": sanitizeForKakao(c3?.actionLine ?? "")
  };
}

type EmailCard = {
  title: string;
  shortSummary: string;
  actionLine: string;
  sources: ReturnType<typeof normalizeSources>;
  mainInterest?: string;
};

async function logJob(jobName: string, status: string, details: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('sj_job_logs').insert({
    job_name: jobName,
    status,
    details,
    run_at: new Date().toISOString()
  });
}

function toEmailCard(item: Record<string, unknown>, mainInterest?: string): EmailCard | null {
  if (!item.short_summary || !item.action_line) {
    return null;
  }

  return {
    title: String(item.title ?? ""),
    shortSummary: String(item.short_summary ?? ""),
    actionLine: String(item.action_line ?? ""),
    sources: normalizeSources(item),
    mainInterest: mainInterest ?? String(item.category ?? item.main_interest ?? "")
  };
}

async function findLatestApprovedCard(mainInterest: string, subInterest?: string | null) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from('sj_content_items')
    .select("*")
    .eq("approval_status", "approved")
    .eq("category", mainInterest)
    .or("summary_status.eq.done,ai_status.eq.completed")
    .not("short_summary", "is", null)
    .not("action_line", "is", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1);

  if (subInterest) {
    query = query.eq("sub_interest", subInterest);
  }

  const { data } = await query.maybeSingle();
  return data ? toEmailCard(data) : null;
}

async function buildUserCards(userId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: selections } = await supabase
    .from('sj_user_interest_selections')
    .select("main_interest, sub_interest, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const cards: EmailCard[] = [];
  const seenTitles = new Set<string>();

  for (const selection of (selections ?? []).slice(0, 3)) {
    const subInterestCard = selection.sub_interest
      ? await findLatestApprovedCard(selection.main_interest, selection.sub_interest)
      : null;

    const card = subInterestCard ?? (await findLatestApprovedCard(selection.main_interest));
    if (card) {
      card.mainInterest = selection.main_interest;
    }

    if (!card || seenTitles.has(card.title)) {
      continue;
    }

    seenTitles.add(card.title);
    cards.push(card);
  }

  if (cards.length < 3) {
    const { data: fallbackItems } = await supabase
      .from('sj_content_items')
      .select("*")
      .eq("approval_status", "approved")
      .or("summary_status.eq.done,ai_status.eq.completed")
      .not("short_summary", "is", null)
      .not("action_line", "is", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(12);

    for (const item of fallbackItems ?? []) {
      const card = toEmailCard(item);
      if (!card || seenTitles.has(card.title)) {
        continue;
      }

      seenTitles.add(card.title);
      cards.push(card);

      if (cards.length === 3) {
        break;
      }
    }
  }

  return cards;
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const env = getServerEnv();
  if (!isAuthorizedCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const supabase = createAdminSupabaseClient();
  const resend = new Resend(env.RESEND_API_KEY);
  const { date } = getKstDateParts();
  const jobName = "send-daily-emails";

  try {
    const now = new Date().toISOString();
    const { data: dailyPick } = await supabase
      .from('sj_daily_picks')
      .upsert(
        {
          pick_date: date,
          generated_at: now,
          status: "ready"
        },
        { onConflict: "pick_date" }
      )
      .select("id")
      .single();

    if (!dailyPick?.id) {
      throw new Error("DAILY_PICK_MISSING");
    }

    // 7:30 KST 일괄 발송 — 활성/구독 중인 모든 사용자.
    // 채널 컬럼(delivery_kakao, delivery_email, phone, marketing_consent_at)은 DB에 있으면 가져옴
    const { data: users } = await supabase
      .from('sj_users')
      .select("id, email, phone, delivery_kakao, delivery_email, marketing_consent_at")
      .eq("is_active", true)
      .is("unsubscribed_at", null);

    const kakaoEnabled = hasKakaoConfig();
    let sentEmailCount = 0;
    let sentKakaoCount = 0;
    let skippedKakaoCount = 0;

    for (const user of users ?? []) {
      const userId = String(user.id);
      const hasMarketingConsent = Boolean(user.marketing_consent_at);
      // 광고성 수신 동의 없으면 어떤 채널로도 발송 안 함 (정보통신망법 대응 + "미수신" 가입자).
      const useKakao = hasMarketingConsent && kakaoEnabled && user.delivery_kakao === true && Boolean(user.phone);
      const useEmail = hasMarketingConsent && user.delivery_email === true;

      const { data: existingLog } = await supabase
        .from('sj_email_logs')
        .select("id")
        .eq("user_id", userId)
        .eq("daily_pick_id", dailyPick.id)
        .maybeSingle();

      const cards = await buildUserCards(userId);
      if (cards.length !== 3) {
        if (!existingLog) {
          await supabase.from('sj_email_logs').insert({
            user_id: userId,
            daily_pick_id: dailyPick.id,
            status: "failed",
            provider_message_id: null,
            sent_at: new Date().toISOString(),
            mode: "daily",
            created_at: new Date().toISOString()
          });
        }
        continue;
      }

      // === KAKAO 발송 ===
      if (useKakao && user.phone) {
        const { data: existingKakaoLog } = await supabase
          .from('sj_kakao_logs')
          .select("id")
          .eq("user_id", userId)
          .eq("daily_pick_id", dailyPick.id)
          .eq("mode", "daily")
          .maybeSingle();

        if (!existingKakaoLog) {
          const { data: pendingKakaoLog } = await supabase
            .from('sj_kakao_logs')
            .insert({
              user_id: userId,
              daily_pick_id: dailyPick.id,
              status: "pending",
              mode: "daily",
              created_at: now
            })
            .select("id")
            .single();

          const variables = buildKakaoVariables({ id: userId, email: user.email }, cards);
          const result = await sendKakaoAlimtalk({ to: String(user.phone), variables });

          if (result.ok) {
            if (pendingKakaoLog?.id) {
              await supabase
                .from('sj_kakao_logs')
                .update({
                  status: "sent",
                  provider_group_id: result.groupId,
                  provider_message_id: result.messageId,
                  sent_at: new Date().toISOString()
                })
                .eq("id", pendingKakaoLog.id);
            }
            sentKakaoCount += 1;
          } else {
            console.warn("[cron:send-emails] kakao send failed", { userId, reason: result.reason, detail: result.detail });
            if (pendingKakaoLog?.id) {
              await supabase
                .from('sj_kakao_logs')
                .update({
                  status: "failed",
                  error_detail: `${result.reason}:${result.detail ?? ""}`.slice(0, 500),
                  sent_at: new Date().toISOString()
                })
                .eq("id", pendingKakaoLog.id);
            }
            skippedKakaoCount += 1;
          }
        }
      }

      // === EMAIL 발송 ===
      if (!useEmail || existingLog) {
        continue;
      }

      const { data: pendingLog } = await supabase
        .from('sj_email_logs')
        .insert({
          user_id: userId,
          daily_pick_id: dailyPick.id,
          status: "pending",
          provider_message_id: null,
          sent_at: now,
          mode: "daily",
          created_at: now
        })
        .select("id")
        .single();

      const rawToken = await createUnsubscribeToken(userId);

      let sendResult: { data: { id?: string } | null } | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          sendResult = await resend.emails.send({
            from: getBrandedFromEmail(),
            to: user.email,
            subject: "세줄아침 오늘의 세 줄 소식",
            html: renderDailyBriefEmail({
              cards,
              unsubscribeUrl: `${env.APP_URL}/unsubscribe?token=${rawToken}`,
              logoUrl: getEmailLogoUrl()
            })
          });
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (lastError) {
        console.error("[cron:send-emails] send failed", { userId, email: user.email, error: lastError });
        if (pendingLog?.id) {
          await supabase.from('sj_email_logs').update({ status: "failed", sent_at: new Date().toISOString() }).eq("id", pendingLog.id);
        }
      } else {
        if (pendingLog?.id) {
          await supabase
            .from('sj_email_logs')
            .update({
              status: "sent",
              provider_message_id: sendResult?.data?.id ?? null,
              sent_at: new Date().toISOString()
            })
            .eq("id", pendingLog.id);
        }
        sentEmailCount += 1;
      }
    }

    await logJob(
      jobName,
      "success",
      `${date} 07:30KST email=${sentEmailCount} kakao=${sentKakaoCount} kakao_fail=${skippedKakaoCount}`
    );
    return NextResponse.json({ ok: true, sentEmailCount, sentKakaoCount, skippedKakaoCount });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unexpected send error";
    await logJob(jobName, "failed", details);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
