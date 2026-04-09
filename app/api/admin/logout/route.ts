import { NextRequest, NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/dashboard/login", request.url), 303);
}
