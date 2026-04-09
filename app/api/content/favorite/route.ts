import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { toggleFavoriteContentItem } from "@/lib/mongodb/content-data";

const favoriteSchema = z.object({
  contentItemId: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return NextResponse.json({ error: "로그인 후 이용할 수 있습니다." }, { status: 401 });
    }
    const payload = favoriteSchema.parse(await request.json());
    const result = await toggleFavoriteContentItem(session.id, {
      contentItemId: payload.contentItemId,
      slug: payload.slug
    });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "즐겨찾기를 저장하지 못했습니다." }, { status: 400 });
  }
}
