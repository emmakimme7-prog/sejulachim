import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { createOpenAIClient, selectOpenAIModel } from "@/lib/openai/model-router";
import { sanitizePlainText } from "@/lib/utils";

export type SummarizedContent = {
  title: string;
  shortSummary: string;
  longSummary: string;
  actionLine: string;
  summaryType: "MUST" | "USEFUL" | "ACTION";
};

const summaryResponseSchema = z.object({
  title: z.string().min(7).max(20),
  shortSummary: z.string().min(8).max(300),
  longSummary: z.string().min(500).max(4000),
  actionLine: z.string().min(6).max(160),
  summaryType: z.enum(["MUST", "USEFUL", "ACTION"])
});

export async function summarizeContentItem(input: {
  title: string;
  category: string;
  rawText: string;
  summaryType: "MUST" | "USEFUL" | "ACTION";
}) {
  const client = createOpenAIClient();
  const trimmedRawText = sanitizePlainText(input.rawText, 4000);
  const routedModel = await selectOpenAIModel([
    "한국어 생활 브리핑 원문을 구조화된 JSON으로 요약하는 작업입니다.",
    "반드시 JSON으로 반환되어야 하고, title/shortSummary/longSummary/actionLine/summaryType를 포함해야 합니다.",
    "제목 품질과 사실 보존이 중요하고, 사용자-facing 뉴스레터용 고품질 요약 작업입니다."
  ].join(" "));
  const resolvedModel = routedModel.model === "gpt-4o-mini" ? "gpt-4o" : routedModel.model;
  const isNextGen = resolvedModel.startsWith("gpt-5") || resolvedModel.startsWith("o1") || resolvedModel.startsWith("o3");
  const completion = await client.chat.completions.create({
    model: resolvedModel,
    response_format: { type: "json_object" },
    ...(isNextGen ? { max_completion_tokens: 3000 } : { temperature: 0.2, max_tokens: 3000 }),
    messages: [
      {
        role: "system",
        content: [
          "한국어 아침 브리핑 '세줄아침' 편집자. 원문 안에서만 요약. 출처에 없는 사실·숫자·조언 금지. 공포 조장·의료/법률/금융 확정 표현 금지.",
          "【저작권 준수 필수】원문 문장·표현을 그대로 사용하는 것은 절대 금지. 반드시 사실(fact)만 추출한 후 완전히 새로운 문장으로 재작성할 것. 원문과 어구가 겹치면 안 됨.",
          "title: 7~16자 명사형. 고유명사·제도명 1개+핵심어 1개. 금지→한 단어, '안내/변경/절차/기준/대책', 동사 종결형, '~하는 방법/~의 효과'.",
          "shortSummary: 2~3문장. 기사 핵심을 title과 겹치지 않게 서술. '~했습니다/~됐습니다'로 종결.",
          "longSummary: 반드시 700자 이상, 5~8단락으로 상세 서술. 단락은 \\n\\n으로 구분. 각 단락 100자 이상. 배경보다 변경점·실생활 영향·구체적 수치 위주. 절대 짧게 쓰지 말 것.",
          "longSummary 문체 규칙: 메타정보·출처명 본문에 섞지 않음. '~내용입니다/~흐름입니다/~확인해보는 게 좋습니다' 금지. 자연스러운 서술체 사용.",
          "actionLine: '세줄아침 한마디'로 쓰이는 1문장. 독자가 바로 실천할 수 있는 구체적 행동 제안. 부드러운 권유형(~해보세요/~정해두세요).",
          "JSON만 반환. 키: title, shortSummary, longSummary, actionLine, summaryType."
        ].join("\n")
      },
      {
        role: "user",
        content: `제목: ${sanitizePlainText(input.title, 160)}\n카테고리: ${sanitizePlainText(input.category, 40)}\n요약 유형: ${input.summaryType}\n원문 핵심:\n${trimmedRawText}`
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("EMPTY_AI_RESPONSE");
  }

  return summaryResponseSchema.parse(JSON.parse(raw)) satisfies SummarizedContent;
}
