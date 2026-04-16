import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

import { getServerEnv } from "@/lib/env";
import { isAuthorizedCronRequest } from "@/lib/security/request";

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatKstDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request, getServerEnv().CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "혈압 관리";
  const date = request.nextUrl.searchParams.get("date") ?? formatKstDate(new Date());

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SejulachimBot/1.0; +https://sejulachim.studiobyyou.kr)"
      },
      cache: "no-store"
    });

    const status = response.status;
    const xml = await response.text();
    const xmlLength = xml.length;

    // Parse items
    const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
    const titles: string[] = [];
    const pubDates: string[] = [];

    for (const block of itemBlocks.slice(0, 10)) {
      const titleMatch = block.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
      const pubDateMatch = block.match(/<pubDate(?:\s[^>]*)?>([\s\S]*?)<\/pubDate>/i);
      titles.push(titleMatch?.[1]?.trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") ?? "(no title)");
      pubDates.push(pubDateMatch?.[1]?.trim() ?? "(no date)");
    }

    const prevDate = addDays(date, -1);
    const nextDate = addDays(date, 1);
    const allowedDates = new Set([prevDate, date, nextDate]);

    const kstDates = pubDates.map(d => {
      try { return formatKstDate(new Date(d)); } catch { return "invalid"; }
    });
    const passFilter = kstDates.map(d => allowedDates.has(d));

    return NextResponse.json({
      query,
      url,
      date,
      allowedDates: [prevDate, date, nextDate],
      httpStatus: status,
      xmlLength,
      totalItems: itemBlocks.length,
      sample: titles.map((t, i) => ({
        title: t.slice(0, 80),
        pubDate: pubDates[i],
        kstDate: kstDates[i],
        passFilter: passFilter[i]
      }))
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      query,
      url
    }, { status: 500 });
  }
}
