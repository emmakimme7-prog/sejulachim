/**
 * 최근 N일 내 승인된 콘텐츠에 대해 TTS MP3를 1회 생성하고 Supabase Storage에 업로드.
 *
 * 사용법:
 *   node scripts/backfill-audio.mjs            # 기본: 최근 7일
 *   node scripts/backfill-audio.mjs --days=14  # 기간 변경
 *   node scripts/backfill-audio.mjs --force    # audio_url이 이미 있어도 재생성
 *
 * 전제:
 *   - .env.local에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_APPLICATION_CREDENTIALS_JSON 설정
 *   - supabase/migrations/010_content_audio.sql 적용 완료
 *   - Supabase에 audio 버킷이 없으면 자동 생성 시도 (public)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import textToSpeech from "@google-cloud/text-to-speech";

function loadEnvFile(filename) {
  try {
    const filePath = resolve(process.cwd(), filename);
    const raw = readFileSync(filePath, "utf8");
    const entries = {};
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      entries[t.slice(0, i).trim()] = v;
    }
    return entries;
  } catch {
    return {};
  }
}

const env = { ...loadEnvFile(".env.local"), ...process.env };

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const CREDS_JSON = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!CREDS_JSON) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const daysArg = args.find((a) => a.startsWith("--days="));
const DAYS = daysArg ? Number(daysArg.split("=")[1]) : 7;
const FORCE = args.includes("--force");
const DRY_RUN = args.includes("--dry-run");

if (!Number.isFinite(DAYS) || DAYS <= 0) {
  console.error(`Invalid --days value: ${DAYS}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const credentials = JSON.parse(CREDS_JSON);
const ttsClient = new textToSpeech.TextToSpeechClient({ credentials });

const STORAGE_BUCKET = "audio";
const VOICE_NAME = "ko-KR-Neural2-B";
const SPEAKING_RATE = 1.0;

function buildListenText({ title, short_summary, action_line }) {
  return [title?.trim(), short_summary?.trim(), action_line?.trim()].filter(Boolean).join(". ");
}

async function ensureBucket() {
  try {
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
  } catch {
    // 이미 존재하면 무시
  }
}

async function synthesize(text) {
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode: "ko-KR", name: VOICE_NAME },
    audioConfig: { audioEncoding: "MP3", speakingRate: SPEAKING_RATE }
  });
  const audio = response.audioContent;
  if (!audio) throw new Error("EMPTY_AUDIO");
  return Buffer.isBuffer(audio) ? audio : Buffer.from(audio);
}

async function uploadAndSave(content) {
  const text = buildListenText(content);
  if (!text) return { skipped: true, reason: "EMPTY_TEXT" };

  const mp3 = await synthesize(text);
  const storagePath = `tts/${content.id}.mp3`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, mp3, { contentType: "audio/mpeg", upsert: true });
  if (uploadError) throw new Error(`UPLOAD: ${uploadError.message}`);

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  const audioUrl = publicData.publicUrl;
  if (!audioUrl) throw new Error("NO_PUBLIC_URL");

  const { error: updateError } = await supabase
    .from('sj_content_items')
    .update({ audio_url: audioUrl, audio_generated_at: new Date().toISOString() })
    .eq("id", content.id);
  if (updateError) throw new Error(`DB: ${updateError.message}`);

  return { audioUrl, chars: text.length };
}

async function main() {
  console.log(`Backfill audio for last ${DAYS} days (force=${FORCE}, dryRun=${DRY_RUN})`);

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('sj_content_items')
    .select("id, title, short_summary, action_line, audio_url, published_at")
    .eq("approval_status", "approved")
    .gte("published_at", since)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (!FORCE) query = query.is("audio_url", null);

  const { data: rows, error } = await query;
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  console.log(`Target count: ${rows.length}`);
  if (rows.length === 0) return;

  if (DRY_RUN) {
    for (const r of rows) console.log(`- ${r.id} ${r.title}`);
    return;
  }

  await ensureBucket();

  let ok = 0;
  let fail = 0;
  let totalChars = 0;
  for (const [i, row] of rows.entries()) {
    const label = `[${i + 1}/${rows.length}] ${row.id}`;
    try {
      const result = await uploadAndSave(row);
      if (result.skipped) {
        console.log(`${label} SKIP ${result.reason}`);
        continue;
      }
      ok += 1;
      totalChars += result.chars;
      console.log(`${label} OK (${result.chars} chars)`);
    } catch (error) {
      fail += 1;
      console.warn(`${label} FAIL ${error.message}`);
    }
    // API 과호출 방지 (Google TTS 기본 쿼터: 분당 1000 req, 여유있게 200ms 지연)
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\nDone. ok=${ok}, fail=${fail}, totalChars=${totalChars}`);
}

await main();
