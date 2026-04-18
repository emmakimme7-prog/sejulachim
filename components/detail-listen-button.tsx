"use client";

import { ListenButton, playSpeech, setAutoPlayNextFn, setSpeechPlaylist } from "@/components/speech-controls";

type NextItemInfo = {
  title: string;
  short_summary?: string | null;
  long_summary?: string | null;
  action_line?: string | null;
  slug: string;
};

type DetailListenButtonProps = {
  iconOnly?: boolean;
  playIcon?: boolean;
  text: string;
  title: string;
  nextItems: NextItemInfo[];
  className?: string;
};

function registerChain(items: NextItemInfo[], idx: number) {
  const item = items[idx];
  if (!item) {
    setAutoPlayNextFn(null);
    return;
  }
  const upcoming = items[idx + 1] ?? null;

  setAutoPlayNextFn(() => {
    const detailParagraphs = item.long_summary?.trim()
      ? item.long_summary.split(/\n\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean)
      : [];
    const text = [item.title, item.short_summary, item.action_line, ...detailParagraphs].filter(Boolean).join(". ");
    setSpeechPlaylist(
      [{ label: item.title }, ...(upcoming ? [{ label: upcoming.title }] : [])],
      0
    );
    playSpeech(text, item.title);
    registerChain(items, idx + 1);
  });
}

export function DetailListenButton({ text, title, nextItems, className, iconOnly = false, playIcon = false }: DetailListenButtonProps) {
  function handlePlay() {
    const first = nextItems[0] ?? null;
    setSpeechPlaylist(
      [{ label: title }, ...(first ? [{ label: first.title }] : [])],
      0
    );
    registerChain(nextItems, 0);
  }

  return (
    <ListenButton
      text={text}
      speechTitle={title}
      className={className}
      label={iconOnly ? "" : "듣기"}
      playIcon={playIcon}
      onPlay={handlePlay}
    />
  );
}
