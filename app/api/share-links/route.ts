import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { getServerEnv } from "@/lib/env";
import { createSharedLinkRecord } from "@/lib/mongodb/content-data";
import { findUserById } from "@/lib/mongodb/user-data";
import { isAvatarKey } from "@/lib/profile";

const shareLinkSchema = z.object({
  shareKey: z.string().trim().min(1).optional(),
  slugs: z.array(z.string().trim().min(1)).min(1).max(10),
  message: z.string().trim().max(50).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    const payload = shareLinkSchema.parse(await request.json());

    let nickname = "익명";
    let avatarKey: string | null = null;
    let userId = "anonymous";

    if (session) {
      const user = await findUserById(session.id);
      userId = session.id;
      nickname = typeof user?.nickname === "string" && user.nickname.trim() ? user.nickname : session.email.split("@")[0];
      avatarKey = isAvatarKey(user?.avatar_key) ? user.avatar_key : null;
    }

    const shareKey = await createSharedLinkRecord({
      userId,
      shareKey: payload.shareKey,
      slugs: payload.slugs,
      nickname,
      avatarKey,
      message: payload.message
    });
    const baseUrl = getServerEnv().APP_URL;
    return NextResponse.json({
      ok: true,
      shareKey,
      shareUrl: `${baseUrl}/shared-briefs?share=${shareKey}`
    });
  } catch {
    return NextResponse.json({ error: "공유 링크를 만들지 못했습니다." }, { status: 400 });
  }
}
