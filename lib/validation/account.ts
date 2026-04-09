import { z } from "zod";

import { AVATAR_OPTIONS } from "@/lib/profile";

export const accountProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  avatarKey: z.enum([...AVATAR_OPTIONS.map((option) => option.key), "custom"] as unknown as [string, ...string[]]),
  avatarDataUrl: z.string().trim().max(5_000_000).optional().or(z.literal("")),
  fontSize: z.enum(["small", "medium", "large"])
}).superRefine((value, ctx) => {
  if (value.avatarKey === "custom" && !value.avatarDataUrl) {
    ctx.addIssue({
      code: "custom",
      path: ["avatarDataUrl"],
      message: "업로드한 사진을 선택해주세요."
    });
  }
});
