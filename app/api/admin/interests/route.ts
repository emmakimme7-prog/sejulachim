import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { assertAdminRequest } from "@/lib/auth/admin";
import { updateInterestConfig } from "@/lib/content/interest-config";
import { adminInterestConfigSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest();
    const payload = adminInterestConfigSchema.parse(await request.json());
    await updateInterestConfig(payload.categories);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "관심사 설정을 다시 확인해주세요." }, { status: 400 });
    }
    return NextResponse.json({ error: "관심사 설정을 저장하지 못했습니다." }, { status: 400 });
  }
}
