import { NextResponse } from "next/server";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { listUserFavoriteContentSlugs } from "@/lib/mongodb/content-data";
import { findUserById } from "@/lib/mongodb/user-data";
import { isAvatarKey } from "@/lib/profile";

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session) {
    return NextResponse.json({
      session: null,
      shareProfile: null,
      favoriteIds: []
    });
  }

  const user = await findUserById(session.id);

  return NextResponse.json({
    session,
    shareProfile: {
      nickname:
        typeof user?.nickname === "string" && user.nickname.trim().length > 0
          ? user.nickname
          : session.email.split("@")[0],
      avatarKey: isAvatarKey(user?.avatar_key) ? user.avatar_key : null
    },
    favoriteIds: await listUserFavoriteContentSlugs(session.id)
  });
}
