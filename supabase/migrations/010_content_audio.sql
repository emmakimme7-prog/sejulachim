-- 콘텐츠 음성(TTS) 캐시 컬럼
-- Google Cloud Text-to-Speech로 생성된 MP3의 Supabase Storage public URL과
-- 생성 시각을 저장합니다. 재생 시 API를 다시 호출하지 않고 Storage에서 서빙.

alter table content_items
  add column if not exists audio_url text,
  add column if not exists audio_generated_at timestamptz;

create index if not exists idx_content_audio_generated_at
  on content_items (audio_generated_at desc)
  where audio_url is not null;
