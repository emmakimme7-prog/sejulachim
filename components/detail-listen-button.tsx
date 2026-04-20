"use client";

import { useRouter } from "next/navigation";

import { ListenButton, beginChainAdvance, playListenable, setAutoPlayNextFn, setSpeechPlaylist } from "@/components/speech-controls";

type NextItemInfo = {
  title: string;
  short_summary?: string | null;
  long_summary?: string | null;
  action_line?: string | null;
  slug: string;
  audio_url?: string | null;
};

type Router = ReturnType<typeof useRouter>;

type DetailListenButtonProps = {
  iconOnly?: boolean;
  playIcon?: boolean;
  text: string;
  title: string;
  nextItems: NextItemInfo[];
  className?: string;
  audioUrl?: string | null;
  trackSlug?: string | null;
};

function registerChain(items: NextItemInfo[], idx: number, router: Router) {
  const item = items[idx];
  if (!item) {
    setAutoPlayNextFn(null);
    return;
  }
  const upcoming = items[idx + 1] ?? null;

  setAutoPlayNextFn(() => {
    const text = item.audio_url?.trim()
      ? [item.title, item.short_summary, item.action_line].filter(Boolean).join(". ")
      : (() => {
          const detailParagraphs = item.long_summary?.trim()
            ? item.long_summary.split(/\n\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean)
            : [];
          return [item.title, item.short_summary, item.action_line, ...detailParagraphs].filter(Boolean).join(". ");
        })();

    // chain 이동이므로 NavigationStopper 가 재생을 중단하지 않도록 flag 세팅 후 라우팅
    beginChainAdvance();
    router.push(`/archive/${item.slug}`);

    setSpeechPlaylist(
      [{ label: item.title }, ...(upcoming ? [{ label: upcoming.title }] : [])],
      0
    );
    playListenable({
      text,
      title: item.title,
      audioUrl: item.audio_url,
      slug: item.slug,
    });
    registerChain(items, idx + 1, router);
  });
}

export function DetailListenButton({ text, title, nextItems, className, iconOnly = false, playIcon = false, audioUrl, trackSlug }: DetailListenButtonProps) {
  const router = useRouter();
  function handlePlay() {
    // MP3/Web Speech 모두 chain 세팅 — 자동재생 ON이면 다음 관련글로 이어짐 + 페이지도 이동.
    const first = nextItems[0] ?? null;
    setSpeechPlaylist(
      [{ label: title }, ...(first ? [{ label: first.title }] : [])],
      0
    );
    registerChain(nextItems, 0, router);
  }

  return (
    <ListenButton
      text={text}
      speechTitle={title}
      className={className}
      label={iconOnly ? "" : "듣기"}
      playIcon={playIcon}
      onPlay={handlePlay}
      audioUrl={audioUrl}
      trackSlug={trackSlug}
    />
  );
}
