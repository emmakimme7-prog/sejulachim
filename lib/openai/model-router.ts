import "server-only";

// OpenAI 통합은 사용자 결정으로 전면 제거됨. 호출 시 명시적 에러로 흐름 차단.
// 새로 OpenAI를 도입하려면 별도 PR 또는 Claude/Gemini 등으로 대체 구현 필요.

export type RoutedModel = { model: string; reason: string };

export function createOpenAIClient(): never {
  throw new Error("OPENAI_REMOVED");
}

export async function selectOpenAIModel(_userRequest: string): Promise<RoutedModel> {
  throw new Error("OPENAI_REMOVED");
}
