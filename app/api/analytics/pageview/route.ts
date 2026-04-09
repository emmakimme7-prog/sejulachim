import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const EXCLUDED_IPS = (process.env.ANALYTICS_EXCLUDED_IPS ?? "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
  );
}

function isBot(ua: string | null): boolean {
  if (!ua) return false;
  const u = ua.toLowerCase();
  return /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|semrush|ahref|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|chatgpt|headlesschrome|phantomjs|wget|curl|python-requests|go-http-client|java\/|httpclient|scrapy|node-fetch|axios/.test(u);
}

function parseDeviceType(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  const u = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/.test(u)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(u)) return "mobile";
  return "desktop";
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (clientIp && EXCLUDED_IPS.includes(clientIp)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const userAgentHeader = request.headers.get("user-agent") ?? null;
    if (isBot(userAgentHeader)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = await request.json();
    const path = typeof body.path === "string" ? body.path.trim().slice(0, 500) : null;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim().slice(0, 64) : null;

    if (!path || !sessionId) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const referrer = typeof body.referrer === "string" ? body.referrer.trim().slice(0, 1000) : null;
    const language = typeof body.language === "string" ? body.language.trim().slice(0, 20) : null;
    const screenWidth = typeof body.screenWidth === "number" ? body.screenWidth : null;
    const utmSource = typeof body.utm_source === "string" ? body.utm_source.trim().slice(0, 200) : null;
    const utmMedium = typeof body.utm_medium === "string" ? body.utm_medium.trim().slice(0, 200) : null;
    const utmCampaign = typeof body.utm_campaign === "string" ? body.utm_campaign.trim().slice(0, 200) : null;

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
    const country = request.headers.get("x-vercel-ip-country")?.slice(0, 10) ?? null;
    const deviceType = parseDeviceType(userAgent);

    const supabase = createAdminSupabaseClient();
    await supabase.from("page_views").insert({
      session_id: sessionId,
      path,
      referrer,
      user_agent: userAgent,
      country,
      device_type: deviceType,
      language,
      screen_width: screenWidth,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
