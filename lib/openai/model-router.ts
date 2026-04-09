import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";

const routedModelSchema = z.object({
  model: z.enum(["gpt-4o-mini", "gpt-4o", "gpt-5"]),
  reason: z.string().min(1).max(300)
});

export type RoutedModel = z.infer<typeof routedModelSchema>;

const MODEL_ROUTER_SYSTEM_PROMPT = `You are a model selection router for an AI system.

Your job is to analyze the user's request and select the most appropriate model from the list below based on cost-performance tradeoff.

Available models:
- gpt-4o-mini: fast, cheap, good for simple Q&A, summaries, basic coding
- gpt-4o: balanced performance, good for reasoning, moderate complexity
- gpt-5: highest quality, best for complex reasoning, planning, critical tasks

Selection rules:
1. Use gpt-4o-mini for:
   - simple questions
   - summarization
   - translation
   - short answers
2. Use gpt-4o for:
   - multi-step reasoning
   - coding tasks
   - structured outputs
3. Use gpt-5 for:
   - complex decision making
   - high accuracy required
   - long context or deep analysis

Return ONLY in JSON format:
{
  "model": "model_name",
  "reason": "short explanation"
}`;

export function createOpenAIClient() {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_ENV_MISSING");
  }

  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export async function selectOpenAIModel(userRequest: string) {
  const client = createOpenAIClient();
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: MODEL_ROUTER_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: userRequest
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("EMPTY_MODEL_ROUTER_RESPONSE");
  }

  return routedModelSchema.parse(JSON.parse(raw));
}
