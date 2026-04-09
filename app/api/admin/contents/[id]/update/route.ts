import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { updateContentItem } from "@/lib/mongodb/content-data";
import { sanitizePlainText } from "@/lib/utils";
import { z } from "zod";

type RouteProps = {
  params: Promise<{ id: string }>;
};

const updateContentSchema = z.object({
  title: z.string().trim().min(4).max(160),
  category: z.string().trim().min(1).max(40),
  subInterest: z.string().trim().max(80).optional().or(z.literal("")),
  sourceName: z.string().trim().min(2).max(80),
  sourceUrl: z.url().max(500),
  sourceType: z.enum(["public", "news", "blog", "other"]),
  shortSummary: z.string().trim().min(1).max(1000),
  actionLine: z.string().trim().min(1).max(300),
  rawText: z.string().trim().min(10).max(10000),
  summaryType: z.enum(["MUST", "USEFUL", "ACTION"]),
  approvalStatus: z.enum(["pending", "approved", "rejected"]),
  aiStatus: z.enum(["pending", "completed", "failed"])
});

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await assertAdminRequest();
    const { id } = await params;
    const body = updateContentSchema.parse(await request.json());

    await updateContentItem(id, {
      title: sanitizePlainText(body.title, 160),
      category: sanitizePlainText(body.category, 40),
      subInterest: body.subInterest ? sanitizePlainText(body.subInterest, 80) : null,
      sourceName: sanitizePlainText(body.sourceName, 80),
      sourceUrl: body.sourceUrl,
      sourceType: body.sourceType,
      shortSummary: sanitizePlainText(body.shortSummary, 1000),
      actionLine: sanitizePlainText(body.actionLine, 300),
      rawText: sanitizePlainText(body.rawText, 10000),
      summaryType: body.summaryType,
      approvalStatus: body.approvalStatus,
      aiStatus: body.aiStatus
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "콘텐츠를 저장하지 못했습니다." }, { status: 400 });
  }
}
