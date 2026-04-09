import { z } from "zod";

export const mainInterestSchema = z.string().trim().min(1).max(40);
export const deliveryTimeSchema = z.enum(["07:00", "08:00", "09:00"]);
export const summaryTypeSchema = z.enum(["MUST", "USEFUL", "ACTION"]);
export const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const summaryStatusSchema = z.enum(["pending", "processing", "done", "failed"]);
