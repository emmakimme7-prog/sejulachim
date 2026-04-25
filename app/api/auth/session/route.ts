import { NextResponse } from "next/server";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session) {
    return NextResponse.json({ session: null, unreadCount: 0 });
  }

  let unreadCount = 0;
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { count } = await supabase
      .from('sj_notifications')
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.id)
      .eq("is_read", false);
    unreadCount = count ?? 0;
  }

  return NextResponse.json({
    session,
    unreadCount
  });
}
