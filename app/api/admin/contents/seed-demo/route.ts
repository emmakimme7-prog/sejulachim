import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { seedDemoContentItems } from "@/lib/mongodb/content-data";

function allowProductionDemoSeed() {
  const value = process.env.ALLOW_PRODUCTION_DEMO_SEED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest();
    if (process.env.NODE_ENV === "production" && !allowProductionDemoSeed()) {
      return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
    }
    await seedDemoContentItems();
    return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/dashboard/contents", request.url), 303);
  }
}
