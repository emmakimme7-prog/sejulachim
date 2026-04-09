import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { addSecurityJobLog, hardDeleteUser, listExpiredDeletedUsers } from "@/lib/mongodb/user-data";
import { isAuthorizedCronRequest } from "@/lib/security/request";

export async function POST(request: NextRequest) {
  const env = getServerEnv();

  if (!isAuthorizedCronRequest(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredUsers = await listExpiredDeletedUsers();

    if (expiredUsers.length === 0) {
      return NextResponse.json({ deleted: 0, message: "No expired users" });
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const user of expiredUsers) {
      try {
        await hardDeleteUser(user.id);
        await addSecurityJobLog("account.hard_delete", "success", `user=${user.id}; email=${user.email}`);
        results.push({ id: user.id, status: "deleted" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await addSecurityJobLog("account.hard_delete", "failed", `user=${user.id}; error=${message}`);
        results.push({ id: user.id, status: "failed", error: message });
      }
    }

    return NextResponse.json({
      deleted: results.filter((r) => r.status === "deleted").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
