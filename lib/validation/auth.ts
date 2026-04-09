import { z } from "zod";

export const authEmailSchema = z
  .string()
  .trim()
  .max(320)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "유효한 이메일 주소를 입력해주세요.");

export const loginRequestSchema = z.object({
  email: authEmailSchema,
  password: z.string().trim().max(200).optional().or(z.literal("")),
  rememberMe: z.boolean().optional().default(false)
});

export const passwordSetupSchema = z.object({
  password: z.string().min(8).max(200)
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200)
});

export const passwordResetRequestSchema = z.object({
  email: authEmailSchema
});

export const passwordResetVerifySchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(8).max(200)
});
