import "server-only";

// OpenAI 통합 제거됨. 이전엔 gpt-4o로 콘텐츠를 요약했지만 사용자 결정으로 모든 OpenAI 호출 제거.
// 새 콘텐츠 요약은 로컬 Claude CLI 파이프라인(.data/daily/cron/generate-with-claude.sh)이
// 처음부터 short_summary/long_summary/action_line을 채우므로 이 함수는 더 이상 호출되지 않는다.
// 만약 호출되면 명시적 에러로 흐름을 차단한다.

export type SummarizedContent = {
  title: string;
  shortSummary: string;
  longSummary: string;
  actionLine: string;
  summaryType: "MUST" | "USEFUL" | "ACTION";
};

export async function summarizeContentItem(_input: {
  title: string;
  category: string;
  rawText: string;
  summaryType: "MUST" | "USEFUL" | "ACTION";
}): Promise<SummarizedContent> {
  throw new Error("OPENAI_REMOVED — summarize via local Claude CLI pipeline instead");
}
