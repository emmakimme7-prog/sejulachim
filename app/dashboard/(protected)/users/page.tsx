import { DashboardUsersTable } from "@/components/dashboard-users-table";
import { hasSupabaseServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string;
  nickname?: string | null;
  avatar_key?: string | null;
  auth_provider?: string;
  created_at?: string;
  is_active: boolean;
  user_interest_selections: Array<{ main_interest: string; sub_interest: string | null }>;
};

export default async function DashboardUsersPage() {
  const rows = (hasSupabaseServerEnv()
    ? (
        await createAdminSupabaseClient()
          .from('sj_users')
          .select("id, email, nickname, auth_provider, created_at, is_active, user_interest_selections(main_interest, sub_interest)")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data
    : []) as unknown as UserRow[];

  return <DashboardUsersTable rows={rows} />;
}
