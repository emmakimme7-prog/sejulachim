import { NextResponse } from "next/server";

// OpenAI Whisper 통합 제거됨. 음성 검색 기능은 비활성화 상태.
// 클라이언트(SpeechSearchButton)는 410 응답을 받으면 silent fail.
export function POST() {
  return NextResponse.json(
    { error: "OPENAI_REMOVED", message: "Voice transcription is disabled." },
    { status: 410 }
  );
}
