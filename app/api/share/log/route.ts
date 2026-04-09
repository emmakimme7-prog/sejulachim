import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { addJobLog } from "@/lib/mongodb/user-data";
import { z } from "zod";

const shareLogSchema = z.object({
  event: z.enum(["open", "copy_link", "copy_qr", "kakao"]),
  url: z.string().trim().min(1).max(1000)
});

export async function POST(request: NextRequest) {
  try {
    const payload = shareLogSchema.parse(await request.json());
    const session = await getCurrentUserSession();
    const detailParts = [
      session?.id ? `user=${session.id}` : null,
      session?.email ? `email=${session.email}` : null,
      `event=${payload.event}`,
      `url=${payload.url}`
    ].filter(Boolean);

    await addJobLog("share.action", "success", detailParts.join(" "));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "공유 로그를 저장하지 못했습니다." }, { status: 400 });
  }
}
