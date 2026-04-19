import { NextResponse } from "next/server";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { getInterestConfig } from "@/lib/content/interest-config";
import { listUserFavoriteContentSlugs } from "@/lib/mongodb/content-data";
import { findUserById, listUserInterestSelections } from "@/lib/mongodb/user-data";
import { isAvatarKey } from "@/lib/profile";

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session) {
    return NextResponse.json({
      session: null,
      shareProfile: null,
      favoriteIds: [],
      interests: []
    });
  }

  const [user, favoriteIds, interestRows, interestConfig] = await Promise.all([
    findUserById(session.id),
    listUserFavoriteContentSlugs(session.id),
    listUserInterestSelections(session.id),
    getInterestConfig()
  ]);

  const interests = interestRows
    .map((row) => row.main_interest)
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .filter((v) => interestConfig.mainInterests.includes(v));

  return NextResponse.json({
    session,
    shareProfile: {
      nickname:
        typeof user?.nickname === "string" && user.nickname.trim().length > 0
          ? user.nickname
          : session.email.split("@")[0],
      avatarKey: isAvatarKey(user?.avatar_key) ? user.avatar_key : null
    },
    favoriteIds,
    interests
  });
}
