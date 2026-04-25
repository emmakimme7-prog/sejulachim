import { DashboardLogsManager } from "@/components/dashboard-logs-manager";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DashboardLogsPage() {
  const { emailLogs, jobLogs } = hasSupabaseServerEnv()
    ? await (async () => {
        const supabase = createAdminSupabaseClient();
        const [{ data: emailLogs }, { data: jobLogs }] = await Promise.all([
          supabase
            .from('sj_email_logs')
            .select("id, status, sent_at, provider_message_id, user_id")
            .order("sent_at", { ascending: false })
            .limit(30),
          supabase
            .from('sj_job_logs')
            .select("id, job_name, run_at, status, details")
            .order("run_at", { ascending: false })
            .limit(30)
        ]);

        const userIds = [...new Set((emailLogs ?? []).map((item) => item.user_id).filter(Boolean))];
        const { data: users } = userIds.length
          ? await supabase.from('sj_users').select("id, email").in("id", userIds)
          : { data: [] as Array<{ id: string; email: string }> };
        const emailWithUser = (emailLogs ?? []).map((item) => ({
          ...item,
          user_email: users?.find((user) => user.id === item.user_id)?.email ?? "-"
        }));

        return {
          emailLogs: emailWithUser,
          jobLogs: jobLogs ?? []
        };
      })()
      : { emailLogs: [], jobLogs: [] };

  return <DashboardLogsManager emailLogs={emailLogs ?? []} jobLogs={jobLogs ?? []} />;
}
