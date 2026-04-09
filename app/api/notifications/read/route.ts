import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/mongodb/content-data";

const schema = z.object({
  notificationId: z.string().trim().min(1).optional(),
  mode: z.enum(["single", "all"]).default("single")
});

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    const payload = schema.parse(await request.json());
    if (payload.mode === "all") {
      await markAllNotificationsRead(session.id);
    } else if (payload.notificationId) {
      await markNotificationRead(payload.notificationId, session.id);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "알림을 처리하지 못했습니다." }, { status: 400 });
  }
}
