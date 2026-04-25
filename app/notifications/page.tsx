import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationsList } from "@/components/notifications-list";
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { hasSupabaseServerEnv } from "@/lib/env";
import { listUserNotifications } from "@/lib/mongodb/content-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getCurrentUserSession();
  if (!session) {
    redirect("/login");
  }

  const notifications = hasSupabaseServerEnv()
    ? ((await createAdminSupabaseClient().from('sj_notifications').select("*").eq("user_id", session.id).order("created_at", { ascending: false }).limit(50)).data ?? [])
    : await listUserNotifications(session.id);

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto 24px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "#fff",
            borderRadius: 999,
            border: "1.5px solid #F5DDC2",
            fontSize: 12,
            fontWeight: 800,
            color: "#B2570F",
            marginBottom: 12,
          }}
        >
          알림
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          알림
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 15, color: "#7A6F62", fontWeight: 500, lineHeight: 1.6 }}>
          댓글과 공유 반응을 빠르게 확인할 수 있어요
        </p>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <NotificationsList
          rows={notifications.map((item) => ({
            id: String("id" in item ? item.id : item._id),
            type: String("type" in item ? (item.type ?? "") : ""),
            actor_name: String("actor_name" in item ? (item.actor_name ?? "") : ""),
            title: item.title,
            body: item.body,
            target_url: item.target_url,
            is_read: item.is_read,
            created_at: item.created_at,
          }))}
        />
      </div>
    </div>
  );
}
