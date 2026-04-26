import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

import { generateDailyContentForDate } from "@/lib/content/auto-generate";
import { getServerEnv } from "@/lib/env";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getKstDateParts } from "@/lib/utils";

async function logJob(jobName: string, status: string, details: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('sj_job_logs').insert({
    job_name: jobName,
    status,
    details,
    run_at: new Date().toISOString()
  });
}

async function handleCron(request: NextRequest) {
  if (!isAuthorizedCronRequest(request, getServerEnv().CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedDate = request.nextUrl.searchParams.get("date")?.trim();
  const { date: kstDate } = getKstDateParts();
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : kstDate;
  const jobName = "generate-daily-content";

  try {
    const result = await generateDailyContentForDate(date);
    await logJob(
      jobName,
      "success",
      [
        `${result.date} count=${result.count}`,
        `thumbnails ${result.thumbnail.generated}/${result.thumbnail.attempted}`,
        `audio ${result.audio.generated}/${result.audio.attempted}`
      ].join(" | ")
    );
    return NextResponse.json({ ok: true, date: result.date, count: result.count });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack ? error.stack.split("\n").slice(0, 6).join(" | ") : "";
    const details = `[${date}] ${message}${stack ? ` :: ${stack}` : ""}`.slice(0, 1500);
    console.error("[generate-daily-content] failed", error);
    await logJob(jobName, "failed", details);
    return NextResponse.json({ error: "Job failed", message, date }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
