import { DashboardOverview } from "@/components/dashboard-overview";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getSevenDaysAgoIso() {
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
}

function getThirtyDaysAgoIso() {
  const target = new Date();
  target.setDate(target.getDate() - 30);
  return target.toISOString();
}

export default async function DashboardPage() {
  const data = hasSupabaseServerEnv()
    ? await (async () => {
        const supabase = createAdminSupabaseClient();
        const sevenDaysAgo = getSevenDaysAgoIso();
        const thirtyDaysAgo = getThirtyDaysAgoIso();
        const [{ count: userCount }, { count: contentCount }, { data: latestEmailLog }, { count: recentSignupCount }, { count: recentShareCount }, { data: recentUsers }, { data: recentShares }] = await Promise.all([
          supabase.from('sj_users').select("*", { count: "exact", head: true }),
          supabase.from('sj_content_items').select("*", { count: "exact", head: true }),
          supabase
            .from('sj_email_logs')
            .select("status, sent_at")
            .order("sent_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from('sj_users').select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
          supabase.from('sj_job_logs').select("*", { count: "exact", head: true }).eq("job_name", "share.action").gte("run_at", sevenDaysAgo),
          supabase.from('sj_users').select("created_at").gte("created_at", thirtyDaysAgo),
          supabase.from('sj_job_logs').select("run_at").eq("job_name", "share.action").gte("run_at", sevenDaysAgo)
        ]);

        const weeklyLabels = ["1일", "2일", "3일", "4일", "5일", "6일", "7일"];
        const weeklySignupSeries = weeklyLabels.map((label, index) => {
          const target = new Date();
          target.setDate(target.getDate() - (6 - index));
          const dateKey = target.toISOString().slice(0, 10);
          const count = (recentUsers ?? []).filter((user) => String(user.created_at ?? "").slice(0, 10) === dateKey).length;
          return { label, value: count };
        });

        const monthlySignupSeries = Array.from({ length: 4 }).map((_, index) => {
          const start = new Date();
          start.setDate(start.getDate() - (27 - index * 7));
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          const count = (recentUsers ?? []).filter((user) => {
            const date = new Date(String(user.created_at ?? ""));
            return date >= start && date <= end;
          }).length;
          return { label: `${index + 1}주`, value: count };
        });

        const weeklyShareSeries = weeklyLabels.map((label, index) => {
          const target = new Date();
          target.setDate(target.getDate() - (6 - index));
          const dateKey = target.toISOString().slice(0, 10);
          const count = (recentShares ?? []).filter((log) => String(log.run_at ?? "").slice(0, 10) === dateKey).length;
          return { label, value: count };
        });

        return {
          userCount: userCount ?? 0,
          contentCount: contentCount ?? 0,
          latestEmailLog,
          recentSignupCount: recentSignupCount ?? 0,
          recentShareCount: recentShareCount ?? 0,
          weeklySignupSeries,
          monthlySignupSeries,
          weeklyShareSeries
        };
      })()
    : {
          userCount: 0,
          contentCount: 0,
          latestEmailLog: null,
          recentSignupCount: 0,
          recentShareCount: 0,
          weeklySignupSeries: [
            { label: "1일", value: 0 },
            { label: "2일", value: 0 },
            { label: "3일", value: 0 },
            { label: "4일", value: 0 },
            { label: "5일", value: 0 },
            { label: "6일", value: 0 },
            { label: "7일", value: 0 }
          ],
          monthlySignupSeries: [
            { label: "1주", value: 0 },
            { label: "2주", value: 0 },
            { label: "3주", value: 0 },
            { label: "4주", value: 0 }
          ],
          weeklyShareSeries: [
            { label: "1일", value: 0 },
            { label: "2일", value: 0 },
            { label: "3일", value: 0 },
            { label: "4일", value: 0 },
            { label: "5일", value: 0 },
            { label: "6일", value: 0 },
            { label: "7일", value: 0 }
          ]
        };

  return <DashboardOverview data={data} />;
}
