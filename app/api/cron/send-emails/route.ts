import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { normalizeSources } from "@/lib/content/sources";
import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getBrandedFromEmail, getEmailLogoUrl } from "@/lib/email/brand";
import { renderDailyBriefEmail } from "@/lib/email/template";
import { createUnsubscribeToken } from "@/lib/mongodb/user-data";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getKstDateParts } from "@/lib/utils";

type EmailCard = {
  title: string;
  shortSummary: string;
  actionLine: string;
  sources: ReturnType<typeof normalizeSources>;
  mainInterest?: string;
};

async function logJob(jobName: string, status: string, details: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("job_logs").insert({
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
    .from("content_items")
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
    .from("user_interest_selections")
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
      .from("content_items")
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
      .from("daily_picks")
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

    // 7:30 KST 일괄 발송 — 사용자별 delivery_time 필터 제거. 활성/구독 중인 모든 사용자에게 발송.
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .eq("is_active", true)
      .is("unsubscribed_at", null);

    let sentCount = 0;
    for (const user of users ?? []) {
      const userId = String(user.id);
      const { data: existingLog } = await supabase
        .from("email_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("daily_pick_id", dailyPick.id)
        .maybeSingle();

      if (existingLog) {
        continue;
      }

      const cards = await buildUserCards(userId);
      if (cards.length !== 3) {
        await supabase.from("email_logs").insert({
          user_id: userId,
          daily_pick_id: dailyPick.id,
          status: "failed",
          provider_message_id: null,
          sent_at: new Date().toISOString(),
          mode: "daily",
          created_at: new Date().toISOString()
        });
        continue;
      }

      const { data: pendingLog } = await supabase
        .from("email_logs")
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
          await supabase.from("email_logs").update({ status: "failed", sent_at: new Date().toISOString() }).eq("id", pendingLog.id);
        }
      } else {
        if (pendingLog?.id) {
          await supabase
            .from("email_logs")
            .update({
              status: "sent",
              provider_message_id: sendResult?.data?.id ?? null,
              sent_at: new Date().toISOString()
            })
            .eq("id", pendingLog.id);
        }
        sentCount += 1;
      }
    }

    await logJob(jobName, "success", `${date} 07:30KST sent=${sentCount}`);
    return NextResponse.json({ ok: true, sentCount });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unexpected send error";
    await logJob(jobName, "failed", details);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
