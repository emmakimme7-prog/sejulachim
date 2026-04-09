import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { createNotification, createSharedComment, getSharedLinkRecord } from "@/lib/mongodb/content-data";
import { findUserById, sendCommentNotificationEmail } from "@/lib/mongodb/user-data";

const commentSchema = z.object({
  shareKey: z.string().trim().min(1),
  parentId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(30).optional(),
  content: z.string().trim().min(1).max(50)
});

export async function POST(request: NextRequest) {
  try {
    const payload = commentSchema.parse(await request.json());
    const shared = await getSharedLinkRecord(payload.shareKey);
    if (!shared) {
      return NextResponse.json({ error: "공유 링크를 찾을 수 없습니다." }, { status: 404 });
    }

    const session = await getCurrentUserSession();
    let name = payload.name?.trim() ?? "";
    let userId: string | null = null;

    if (session) {
      const user = await findUserById(session.id);
      name = typeof user?.nickname === "string" && user.nickname.trim().length > 0 ? user.nickname.trim() : session.email.split("@")[0];
      userId = session.id;
    }

    if (!name) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }

    const comment = await createSharedComment({
      shareKey: payload.shareKey,
      userId,
      parentId: payload.parentId,
      name,
      content: payload.content
    });

    if (shared.user_id) {
      const owner = await findUserById(shared.user_id);
      const targetUrl = `/shared-briefs?share=${payload.shareKey}`;
      const actorName = name.trim();

      await createNotification({
        userId: shared.user_id,
        actorName,
        title: `${actorName}님이 새 댓글을 작성했어요`,
        body: shared.message?.trim() || "공유한 소식에 새로운 댓글이 달렸습니다.",
        targetUrl
      });

      if (owner?.email) {
        await sendCommentNotificationEmail({
          email: owner.email,
          actorName,
          targetUrl,
          contentTitle: shared.message?.trim() || "공유한 세줄아침 소식"
        });
      }
    }

    return NextResponse.json({ ok: true, comment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "댓글을 저장하지 못했습니다." }, { status: 400 });
  }
}
