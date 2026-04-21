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
  agreeToPrivacy: z.boolean().refine((value) => value, "개인정보 수집·이용에 동의해주세요."),
  // 광고성 정보 수신은 선택 — 체크 안 하면 매일 아침 소식 발송 대상에서 제외.
  agreeToMarketing: z.boolean().optional().default(false),
  // 이메일 가입 시 6자리 인증번호 (OAuth 가입은 서버측 콜백에서 직접 생성하므로 필요 없음).
  verificationCode: z.string().trim().regex(/^\d{6}$/u, "6자리 숫자를 입력해주세요.").optional(),
  // 받는 방법 (카카오톡 알림톡 + 이메일). 한쪽만 선택해도 됨, 단 1개 이상 필수.
  phone: z
    .string()
    .trim()
    .regex(/^010\d{8}$/u, "휴대폰번호는 010으로 시작하는 11자리여야 합니다.")
    .nullable()
    .optional(),
  deliveryChannels: z
    .object({
      kakao: z.boolean().optional().default(false),
      email: z.boolean().optional().default(true)
    })
    .optional()
    .default({ kakao: false, email: true })
}).superRefine((value, ctx) => {
  if (value.passwordEnabled && (!value.password || value.password.trim().length < 8)) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message: "비밀번호는 8자 이상이어야 합니다."
    });
  }
  const channels = value.deliveryChannels ?? { kakao: false, email: true };
  // 둘 다 false 는 "미수신" 가입을 의미. 허용 (marketing consent 도 자동으로 false 처리).
  if (channels.kakao && !value.phone) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "카카오톡 알림톡을 받으려면 휴대폰번호가 필요합니다."
    });
  }
});
