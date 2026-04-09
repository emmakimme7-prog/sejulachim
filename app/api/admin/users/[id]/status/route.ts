import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminRequest } from "@/lib/auth/admin";
import { updateUserActiveStatus } from "@/lib/mongodb/user-data";

const jsonSchema = z.object({
  isActive: z.boolean()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminRequest();
    const { id } = await params;

    const isJson = request.headers.get("content-type")?.includes("application/json");
    const payload = isJson
      ? jsonSchema.parse(await request.json())
      : jsonSchema.parse({ isActive: String((await request.formData()).get("isActive")) === "true" });

    await updateUserActiveStatus(id, payload.isActive);

    if (isJson) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.redirect(new URL(`/dashboard/users/${id}`, request.url), 303);
  } catch {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "사용자 상태를 저장하지 못했습니다." }, { status: 400 });
    }

    return NextResponse.redirect(new URL("/dashboard/users", request.url), 303);
  }
}
