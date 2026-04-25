import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/auth/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function parseDeviceType(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  const u = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/.test(u)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(u)) return "mobile";
  return "desktop";
}

function parseReferrerDomain(referrer: string | null): string {
  if (!referrer) return "(직접 방문)";
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, "");
    return host || "(직접 방문)";
  } catch {
    return "(직접 방문)";
  }
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get("period") ?? "today";
  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;

  // KST today start
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstTodayStart = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset);

  // Realtime: distinct sessions in last 5 minutes
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const { data: realtimeRows } = await supabase
    .from('sj_page_views')
    .select("session_id")
    .gte("created_at", fiveMinAgo);
  const realtimeSessions = new Set(realtimeRows?.map((r) => r.session_id) ?? []).size;

  // Today stats
  const todayStart = kstTodayStart.toISOString();
  const { data: todayRows } = await supabase
    .from('sj_page_views')
    .select("session_id, path, referrer, device_type, user_agent, country, utm_source")
    .gte("created_at", todayStart);

  const todayPageviews = todayRows?.length ?? 0;
  const todayVisitors = new Set(todayRows?.map((r) => r.session_id) ?? []).size;

  // Daily trend
  let days = 7;
  if (period === "30d") days = 30;
  if (period === "today") days = 1;

  const trendStart = new Date(kstTodayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const { data: trendRows } = await supabase
    .from('sj_page_views')
    .select("session_id, path, created_at")
    .gte("created_at", trendStart.toISOString())
    .order("created_at", { ascending: true });

  // Group by KST date
  const dailyMap = new Map<string, { sessions: Set<string>; pageviews: number }>();
  for (const row of trendRows ?? []) {
    const rowKst = new Date(new Date(row.created_at).getTime() + kstOffset);
    const dateKey = `${rowKst.getUTCFullYear()}-${String(rowKst.getUTCMonth() + 1).padStart(2, "0")}-${String(rowKst.getUTCDate()).padStart(2, "0")}`;
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { sessions: new Set(), pageviews: 0 });
    }
    const entry = dailyMap.get(dateKey)!;
    entry.sessions.add(row.session_id);
    entry.pageviews += 1;
  }

  const dailyTrend = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(kstTodayStart.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000 + kstOffset);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const entry = dailyMap.get(key);
    dailyTrend.push({
      date: key,
      visitors: entry?.sessions.size ?? 0,
      pageviews: entry?.pageviews ?? 0,
    });
  }

  // Top pages today
  const pathCounts = new Map<string, number>();
  for (const row of todayRows ?? []) {
    pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
  }
  const topPages = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Referrer sources today (세션 기준 첫 referrer로 집계 — 세션당 1회)
  const sessionReferrerMap = new Map<string, string>();
  for (const row of todayRows ?? []) {
    if (!sessionReferrerMap.has(row.session_id)) {
      sessionReferrerMap.set(row.session_id, parseReferrerDomain(row.referrer));
    }
  }
  const referrerCounts = new Map<string, number>();
  for (const domain of sessionReferrerMap.values()) {
    referrerCounts.set(domain, (referrerCounts.get(domain) ?? 0) + 1);
  }
  const topReferrers = [...referrerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([domain, count]) => ({ domain, count }));

  // Device type today (세션 기준)
  const sessionDeviceMap = new Map<string, string>();
  for (const row of todayRows ?? []) {
    if (!sessionDeviceMap.has(row.session_id)) {
      // device_type 컬럼 없는 기존 데이터는 user_agent로 파싱
      const device = row.device_type ?? parseDeviceType(row.user_agent ?? null);
      sessionDeviceMap.set(row.session_id, device);
    }
  }
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 } as Record<string, number>;
  for (const device of sessionDeviceMap.values()) {
    deviceCounts[device] = (deviceCounts[device] ?? 0) + 1;
  }

  // Country today (세션 기준)
  const sessionCountryMap = new Map<string, string>();
  for (const row of todayRows ?? []) {
    if (!sessionCountryMap.has(row.session_id) && row.country) {
      sessionCountryMap.set(row.session_id, row.country);
    }
  }
  const countryCounts = new Map<string, number>();
  for (const country of sessionCountryMap.values()) {
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  // UTM source today (세션 기준)
  const sessionUtmMap = new Map<string, string>();
  for (const row of todayRows ?? []) {
    if (!sessionUtmMap.has(row.session_id) && row.utm_source) {
      sessionUtmMap.set(row.session_id, row.utm_source);
    }
  }
  const utmCounts = new Map<string, number>();
  for (const src of sessionUtmMap.values()) {
    utmCounts.set(src, (utmCounts.get(src) ?? 0) + 1);
  }
  const topUtmSources = [...utmCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return NextResponse.json({
    realtime: realtimeSessions,
    today: { visitors: todayVisitors, pageviews: todayPageviews },
    dailyTrend,
    topPages,
    topReferrers,
    deviceCounts,
    topCountries,
    topUtmSources,
  });
}
