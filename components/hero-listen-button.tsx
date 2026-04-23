"use client";

import { Volume2, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getSpeechSnapshot,
  playListenable,
  setAutoPlayNextFn,
  setSpeechPlaylist,
  stopSpeech,
  subscribeSpeechState
} from "@/components/speech-controls";

type PreviewItem = {
  category: string;
  title: string;
  slug: string;
  short_summary?: string;
  action_line?: string;
  audio_url?: string;
};

export function HeroListenButton({ previews }: { previews: PreviewItem[] }) {
  const [playing, setPlaying] = useState(() => getSpeechSnapshot().active);
  const items = useMemo(
    () =>
      previews.map((preview, index) => ({
        label: `${index + 1}. ${preview.category}`,
        title: preview.title,
        slug: preview.slug,
        audioUrl: preview.audio_url ?? null,
        // audio_url이 있으면 text는 폴백용이므로 짧게, 없으면 Web Speech 폴백 전체 문장.
        text: [preview.title, preview.short_summary, preview.action_line].filter(Boolean).join(". ")
      })),
    [previews]
  );

  useEffect(() => {
    return subscribeSpeechState(() => {
      setPlaying(getSpeechSnapshot().active);
    });
  }, []);

  if (previews.length === 0) return null;

  function handlePlay() {
    if (playing) {
      stopSpeech();
      return;
    }

    const playlistLabels = items.map((item) => ({ label: item.label }));
    setSpeechPlaylist(playlistLabels, 0);

    function playItem(idx: number) {
      const item = items[idx];
      if (!item) return;

      if (idx < items.length - 1) {
        setAutoPlayNextFn(() => {
          const next = items[idx + 1]!;
          setSpeechPlaylist(playlistLabels, idx + 1);
          playItem(idx + 1);
          playListenable({
            text: next.text,
            title: next.label,
            audioUrl: next.audioUrl,
            slug: next.slug,
          });
        });
      } else {
        setAutoPlayNextFn(null);
      }
    }

    playItem(0);
    playListenable({
      text: items[0]!.text,
      title: items[0]!.label,
      audioUrl: items[0]!.audioUrl,
      slug: items[0]!.slug,
    });
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="slm-hero__preview-listen"
      aria-label={playing ? "미리듣기 중지" : "오늘의 세줄 미리듣기"}
    >
      {playing ? (
        <Square className="h-[14px] w-[14px]" />
      ) : (
        <Volume2 className="h-[14px] w-[14px]" />
      )}
      <span>{playing ? "중지" : "미리듣기"}</span>
    </button>
  );
}
