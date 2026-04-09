import { NextRequest, NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai/model-router";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "AUDIO_FILE_REQUIRED" }, { status: 400 });
    }

    const client = createOpenAIClient();
    const transcript = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "ko"
    });

    const text = typeof transcript.text === "string" ? transcript.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "TRANSCRIPT_EMPTY" }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "TRANSCRIPTION_FAILED" }, { status: 500 });
  }
}
