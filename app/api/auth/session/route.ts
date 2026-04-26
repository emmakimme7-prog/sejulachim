import { NextResponse } from "next/server";

import { getCurrentUserSession } from "@/lib/auth/user-session";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return NextResponse.json({ session: null, unreadCount: 0 });
    }

    let unreadCount = 0;
    if (hasSupabaseServerEnv()) {
      const supabase = createAdminSupabaseClient();
      const { count, error } = await supabase
        .from('sj_notifications')
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.id)
        .eq("is_read", false);
      if (error) {
        console.error("[/api/auth/session] notifications count failed:", error);
      } else {
        unreadCount = count ?? 0;
      }
    }

    return NextResponse.json({
      session,
      unreadCount
    });
  } catch (error) {
    console.error("[/api/auth/session] failed:", error);
    return NextResponse.json({ session: null, unreadCount: 0 }, { status: 200 });
  }
}
