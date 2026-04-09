import { z } from "zod";

import {
  approvalStatusSchema,
  mainInterestSchema,
  summaryStatusSchema,
  summaryTypeSchema
} from "@/lib/validation/common";

export const adminLoginSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(12).max(200)
});

export const createContentItemSchema = z.object({
  title: z.string().trim().min(4).max(160),
  category: mainInterestSchema,
  subInterest: z.string().trim().max(80).optional().or(z.literal("")),
  sourceName: z.string().trim().min(2).max(80),
  sourceUrl: z.url().max(500),
  sourceType: z.enum(["public", "news", "blog", "other"]).default("other"),
  rawText: z.string().trim().min(30).max(10000),
  summaryType: summaryTypeSchema
});

export const adminInterestConfigSchema = z.object({
  categories: z.array(
    z.object({
      key: z.string().trim().min(1).max(40),
      label: z.string().trim().min(1).max(40),
      subInterests: z.array(z.string().trim().min(1).max(40)).max(5),
      order: z.number().int().min(0)
    })
  ).min(1).max(7)
});

export const todaySectionSettingsSchema = z.object({
  sectionTitle: z.string().trim().min(2).max(40),
  sectionDescription: z.string().trim().min(10).max(160),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  imageAlt: z.string().trim().min(2).max(80),
  imageTitle: z.string().trim().min(2).max(60),
  imageDescription: z.string().trim().min(8).max(140)
});

export const homeHeroSettingsSchema = z.object({
  title: z.string().trim().min(2).max(60),
  subtitle: z.string().trim().min(10).max(220),
  useImage: z.boolean().default(false),
  imageUrl: z.string().trim().max(2_000_000).optional().or(z.literal("")),
  imageAlt: z.string().trim().min(2).max(80).optional().default("세줄아침 메인 이미지")
});

export const contentItemActionSchema = z.object({
  id: z.uuid(),
  approvalStatus: approvalStatusSchema.optional(),
  summaryStatus: summaryStatusSchema.optional()
});

export const mockIngestSchema = z.object({
  title: z.string().trim().min(4).max(160),
  category: mainInterestSchema,
  sourceName: z.string().trim().min(2).max(80),
  sourceUrl: z.url().max(500),
  sourceType: z.enum(["public", "news", "blog", "other"]).default("other"),
  rawText: z.string().trim().min(30).max(10000),
  summaryType: summaryTypeSchema,
  ingestSecret: z.string().min(16).optional()
});

export const unsubscribeSchema = z.object({
  token: z.string().min(20).max(200)
});
