import { DashboardContentsManager } from "@/components/dashboard-contents-manager";
import { getInterestConfig } from "@/lib/content/interest-config";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DashboardContentsPage() {
  const interestConfig = await getInterestConfig();
  const data = hasSupabaseServerEnv()
    ? (
        await createAdminSupabaseClient()
          .from('sj_content_items')
          .select("id, title, category, sub_interest, source_name, summary_status, approval_status, summary_type, created_at")
          .order("created_at", { ascending: false })
          .limit(50)
      ).data
    : [];

  return <DashboardContentsManager items={data ?? []} interestConfig={interestConfig} />;
}
