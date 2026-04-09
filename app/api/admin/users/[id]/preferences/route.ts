import { NextRequest, NextResponse } from "next/server";

import { assertAdminRequest } from "@/lib/auth/admin";
import { addSecurityJobLog, updateUserPreferences } from "@/lib/mongodb/user-data";
import { signupPreferencesSchema } from "@/lib/validation/signup";
import { sanitizePlainText } from "@/lib/utils";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await assertAdminRequest();
    const { id } = await params;
    const body = signupPreferencesSchema.parse(await request.json());
    const sanitizedSubInterests = Object.fromEntries(
      Object.entries(body.subInterests).map(([key, value]) => [key, sanitizePlainText(String(value), 80)])
    );

    await updateUserPreferences({
      userId: id,
      interests: body.interests,
      subInterests: sanitizedSubInterests,
      deliveryTime: body.deliveryTime
    });

    await addSecurityJobLog("admin.user_preferences_update", "success", `admin updated user=${id}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "사용자 설정을 저장하지 못했습니다." }, { status: 400 });
  }
}
