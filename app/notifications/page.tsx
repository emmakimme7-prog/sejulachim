import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationsList } from "@/components/notifications-list";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { PageIntro } from "@/components/ui/panel";
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { hasSupabaseServerEnv } from "@/lib/env";
import { listUserNotifications } from "@/lib/mongodb/content-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getCurrentUserSession();
  if (!session) {
    redirect("/login");
  }

  const notifications = hasSupabaseServerEnv()
    ? ((await createAdminSupabaseClient().from("notifications").select("*").eq("user_id", session.id).order("created_at", { ascending: false }).limit(50)).data ?? [])
    : await listUserNotifications(session.id);

  return (
    <div className="app-shell section-block">
      <PageIntro eyebrow="NOTIFICATIONS" title="알림" description="댓글과 공유 반응을 빠르게 확인할 수 있습니다." className="mb-8" />
      <NotificationsList
        rows={notifications.map((item) => ({
          id: String("id" in item ? item.id : item._id),
          type: String("type" in item ? (item.type ?? "") : ""),
          actor_name: String("actor_name" in item ? (item.actor_name ?? "") : ""),
          title: item.title,
          body: item.body,
          target_url: item.target_url,
          is_read: item.is_read,
          created_at: item.created_at
        }))}
      />
    </div>
  );
}
