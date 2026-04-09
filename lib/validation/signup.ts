import { z } from "zod";

import { deliveryTimeSchema, mainInterestSchema } from "@/lib/validation/common";

export const signupPreferencesSchema = z.object({
  interests: z
    .array(mainInterestSchema)
    .length(3)
    .refine((values) => new Set(values).size === values.length, "관심사는 중복 없이 3개여야 합니다."),
  subInterests: z.record(z.string(), z.string().trim().max(80)).default({}),
  deliveryTime: deliveryTimeSchema
}).superRefine((value, ctx) => {
  for (const key of Object.keys(value.subInterests)) {
    if (!value.interests.includes(key)) {
      ctx.addIssue({
        code: "custom",
        path: ["subInterests", key],
        message: "선택하지 않은 관심사의 세부 관심사는 저장할 수 없습니다."
      });
    }
  }
});

export const signupSchema = signupPreferencesSchema.extend({
  email: z
    .string()
    .trim()
    .max(320)
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "유효한 이메일 주소를 입력해주세요."),
  honeypot: z.string().max(0).optional().or(z.literal("")),
  passwordEnabled: z.boolean().optional().default(false),
  password: z.string().trim().max(200).optional().or(z.literal("")),
  agreeToTerms: z.boolean().refine((value) => value, "이용약관에 동의해주세요."),
  agreeToPrivacy: z.boolean().refine((value) => value, "개인정보처리방침에 동의해주세요.")
}).superRefine((value, ctx) => {
  if (value.passwordEnabled && (!value.password || value.password.trim().length < 8)) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message: "비밀번호는 8자 이상이어야 합니다."
    });
  }
});
