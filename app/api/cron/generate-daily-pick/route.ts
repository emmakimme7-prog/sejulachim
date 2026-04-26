import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

import { getServerEnv } from "@/lib/env";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { getKstDateParts } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function logJob(jobName: string, status: string, details: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from('sj_job_logs').insert({
    job_name: jobName,
    status,
    details,
    run_at: new Date().toISOString()
  });
  if (error) {
    console.error("[generate-daily-pick] failed to write job log:", error);
  }
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  if (!isAuthorizedCronRequest(request, getServerEnv().CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { date } = getKstDateParts();
  const jobName = "generate-daily-pick";
  const force = request.nextUrl.searchParams.get("force") === "1";

  try {
    const { data: existing } = await supabase
      .from('sj_daily_picks')
      .select("id, status")
      .eq("pick_date", date)
      .maybeSingle();

    if (!force && existing?.status === "processing") {
      await logJob(jobName, "skipped", `${date} daily pick is already processing`);
      return NextResponse.json({ ok: true, skipped: true, reason: "processing" });
    }

    if (!force && existing?.status === "ready") {
      const { count } = await supabase
        .from('sj_daily_pick_items')
        .select("id", { count: "exact", head: true })
        .eq("daily_pick_id", existing.id);

      if ((count ?? 0) === 3) {
        await logJob(jobName, "skipped", `${date} daily pick already exists`);
        return NextResponse.json({ ok: true, skipped: true });
      }
    }

    const { data: dailyPick, error: dailyPickError } = await supabase
      .from('sj_daily_picks')
      .upsert(
        {
          pick_date: date,
          generated_at: new Date().toISOString(),
          status: "processing"
        },
        { onConflict: "pick_date" }
      )
      .select("id")
      .single();
    if (dailyPickError || !dailyPick?.id) {
      throw new Error(`DAILY_PICK_UPSERT_FAILED:${dailyPickError?.message ?? "missing id"}`);
    }

    const [must, useful, action] = await Promise.all([
      supabase
        .from('sj_content_items')
        .select("id")
        .eq("summary_type", "MUST")
        .eq("approval_status", "approved")
        .or("summary_status.eq.done,ai_status.eq.completed")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('sj_content_items')
        .select("id")
        .eq("summary_type", "USEFUL")
        .eq("approval_status", "approved")
        .or("summary_status.eq.done,ai_status.eq.completed")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('sj_content_items')
        .select("id")
        .eq("summary_type", "ACTION")
        .eq("approval_status", "approved")
        .or("summary_status.eq.done,ai_status.eq.completed")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (must.error || useful.error || action.error) {
      throw new Error(
        `CONTENT_QUERY_FAILED:${must.error?.message ?? ""}|${useful.error?.message ?? ""}|${action.error?.message ?? ""}`
      );
    }

    const selected = [must.data?.id, useful.data?.id, action.data?.id].filter(Boolean);
    if (selected.length !== 3 || !dailyPick) {
      await supabase.from('sj_daily_picks').update({ status: "failed" }).eq("pick_date", date);
      await logJob(jobName, "failed", "Not enough approved items for all summary types");
      return NextResponse.json({ error: "Insufficient content" }, { status: 409 });
    }

    const { error: deleteError } = await supabase.from('sj_daily_pick_items').delete().eq("daily_pick_id", dailyPick.id);
    if (deleteError) {
      throw new Error(`DAILY_PICK_ITEMS_DELETE_FAILED:${deleteError.message}`);
    }

    const { error: insertError } = await supabase.from('sj_daily_pick_items').insert([
      { daily_pick_id: dailyPick.id, content_item_id: must.data!.id, position: 1 },
      { daily_pick_id: dailyPick.id, content_item_id: useful.data!.id, position: 2 },
      { daily_pick_id: dailyPick.id, content_item_id: action.data!.id, position: 3 }
    ]);
    if (insertError) {
      throw new Error(`DAILY_PICK_ITEMS_INSERT_FAILED:${insertError.message}`);
    }

    const { error: readyError } = await supabase.from('sj_daily_picks').update({ status: "ready" }).eq("id", dailyPick.id);
    if (readyError) {
      throw new Error(`DAILY_PICK_READY_UPDATE_FAILED:${readyError.message}`);
    }

    await logJob(jobName, "success", `${date} daily pick generated`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected generation error";
    await logJob(jobName, "failed", message);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
