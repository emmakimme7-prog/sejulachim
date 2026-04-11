"use client";

import { Volume2, Square } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { playSpeech, setAutoPlayNextFn, setSpeechPlaylist } from "@/components/speech-controls";

type PreviewItem = {
  category: string;
  title: string;
  slug: string;
  short_summary?: string;
};

// Global speech owner tracking (simplified from speech-controls)
let heroSpeechOwner: string | null = null;
const heroPlaybackSubs = new Set<(owner: string | null) => void>();

export function HeroListenButton({ previews }: { previews: PreviewItem[] }) {
  const [playing, setPlaying] = useState(false);
  const ownerId = useId();

  useEffect(() => {
    const handlePlayback = (owner: string | null) => {
      if (owner !== ownerId) setPlaying(false);
    };
    heroPlaybackSubs.add(handlePlayback);
    return () => {
      heroPlaybackSubs.delete(handlePlayback);
    };
  }, [ownerId]);

  if (previews.length === 0) return null;

  function handlePlay() {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }

    // Build text from all preview items
    const items = previews.map((p, i) => ({
      label: `${i + 1}. ${p.category}`,
      text: [p.title, p.short_summary].filter(Boolean).join(". "),
    }));

    // Set up playlist for the player UI
    const playlistLabels = items.map((item) => ({ label: item.label }));
    setSpeechPlaylist(playlistLabels, 0);

    // Chain play all items
    function playItem(idx: number) {
      const item = items[idx];
      if (!item) return;

      if (idx < items.length - 1) {
        setAutoPlayNextFn(() => {
          setSpeechPlaylist(playlistLabels, idx + 1);
          playSpeech(items[idx + 1]!.text, items[idx + 1]!.label);
          playItem(idx + 1);
        });
      } else {
        setAutoPlayNextFn(null);
      }
    }

    playItem(0);
    setPlaying(true);
    playSpeech(items[0]!.text, items[0]!.label);
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
