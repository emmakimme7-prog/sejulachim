import { NextRequest, NextResponse } from "next/server";

import { clearUserSession } from "@/lib/auth/user-session";

export async function POST(request: NextRequest) {
  await clearUserSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
