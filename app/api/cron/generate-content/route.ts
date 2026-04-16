import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

import { generateDailyContentForDate } from "@/lib/content/auto-generate";
import { getServerEnv } from "@/lib/env";
import { isAuthorizedCronRequest } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getKstDateParts } from "@/lib/utils";

async function logJob(jobName: string, status: string, details: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("job_logs").insert({
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
    await logJob(jobName, "success", `${result.date} count=${result.count}`);
    return NextResponse.json({ ok: true, date: result.date, count: result.count });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unexpected generation error";
    await logJob(jobName, "failed", details);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
