import "server-only";

import { hasGoogleTtsCredentials, synthesizeKoreanMp3 } from "@/lib/tts/google";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "audio";

function buildListenText(input: {
  title: string;
  short_summary: string | null | undefined;
  action_line: string | null | undefined;
}) {
  const parts = [
    input.title?.trim(),
    input.short_summary?.trim(),
    input.action_line?.trim()
  ].filter(Boolean);
  return parts.join(". ");
}

/**
 * 콘텐츠 1건에 대해 TTS MP3 생성 → Supabase Storage 업로드 → DB에 URL 저장.
 * 이미 audio_url이 있으면 건너뜀 (force: true로 강제 재생성 가능).
 * 실패는 throw하지 않고 경고 로그만 남김 (발행 흐름을 막지 않도록).
 */
export async function generateAndStoreContentAudio(
  contentId: string,
  options: { force?: boolean } = {}
): Promise<{ ok: true; audioUrl: string } | { ok: false; reason: string }> {
  if (!hasGoogleTtsCredentials()) {
    return { ok: false, reason: "GOOGLE_TTS_CREDENTIALS_MISSING" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: content, error: fetchError } = await supabase
    .from('sj_content_items')
    .select("id, title, short_summary, action_line, audio_url")
    .eq("id", contentId)
    .maybeSingle();

  if (fetchError || !content) {
    return { ok: false, reason: "CONTENT_NOT_FOUND" };
  }
  if (content.audio_url && !options.force) {
    return { ok: true, audioUrl: content.audio_url };
  }

  const text = buildListenText({
    title: content.title,
    short_summary: content.short_summary,
    action_line: content.action_line
  });
  if (!text) {
    return { ok: false, reason: "EMPTY_TEXT" };
  }

  let mp3: Buffer;
  try {
    mp3 = await synthesizeKoreanMp3(text);
  } catch (error) {
    console.warn("[audio] TTS synthesize failed", { contentId, error: (error as Error).message });
    return { ok: false, reason: "TTS_FAILED" };
  }

  const storagePath = `tts/${content.id}.mp3`;

  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => undefined);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, mp3, { contentType: "audio/mpeg", upsert: true });

  if (uploadError) {
    console.warn("[audio] Storage upload failed", { contentId, error: uploadError.message });
    return { ok: false, reason: "STORAGE_UPLOAD_FAILED" };
  }

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  const audioUrl = publicData.publicUrl;
  if (!audioUrl) {
    return { ok: false, reason: "STORAGE_URL_MISSING" };
  }

  const { error: updateError } = await supabase
    .from('sj_content_items')
    .update({ audio_url: audioUrl, audio_generated_at: new Date().toISOString() })
    .eq("id", content.id);

  if (updateError) {
    console.warn("[audio] DB update failed", { contentId, error: updateError.message });
    return { ok: false, reason: "DB_UPDATE_FAILED" };
  }

  return { ok: true, audioUrl };
}
