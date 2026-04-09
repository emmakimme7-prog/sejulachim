import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { assertAdminRequest } from "@/lib/auth/admin";
import { updateTodaySectionSettings } from "@/lib/mongodb/site-settings";
import { todaySectionSettingsSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest();
    const payload = todaySectionSettingsSchema.parse(await request.json());
    await updateTodaySectionSettings(payload);
    revalidatePath("/");
    revalidatePath("/dashboard/homepage");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "오늘의 소식 설정을 다시 확인해주세요." }, { status: 400 });
    }

    return NextResponse.json({ error: "오늘의 소식 설정을 저장하지 못했습니다." }, { status: 400 });
  }
}
