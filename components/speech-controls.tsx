"use client";

import { Mic, Pause, Play, SkipBack, SkipForward, Square, Volume2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognitionLike };
    webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
  }
}

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

// ─── Global speech state ──────────────────────────────────────────────────────

let speechOwner: string | null = null;
let speechFullText = "";
let speechDisplayTitle = "";
let speechSegments: Array<{ label: string; charStart: number }> | null = null;
let speechCharIndex = 0;
let speechCharOffset = 0;
let speechRate = 1.0;
let speechPaused = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;
// MP3 캐시 재생 (Google TTS). speechOwner 활성 중에 currentAudio가 non-null이면 MP3 모드.
let currentAudio: HTMLAudioElement | null = null;
let audioCurrentTime = 0;
let audioDuration = 0;

// chain 자동 이동 중이면 pathname 변경으로 인한 stopSpeech를 막는다.
let chainAdvancing = false;
export function beginChainAdvance(windowMs = 900) {
  chainAdvancing = true;
  setTimeout(() => {
    chainAdvancing = false;
  }, windowMs);
}
export function isChainAdvancing() {
  return chainAdvancing;
}

// 자동재생
let autoPlayEnabled = false;
let autoPlayNextFn: (() => void) | null = null;
try { autoPlayEnabled = localStorage.getItem("speech-autoplay") === "1"; } catch { /* SSR */ }

// 플레이리스트 (자동재생 시 현재+다음 콘텐츠 표시용)
let speechPlaylist: Array<{ label: string }> | null = null;
let speechPlaylistCurrentIdx = 0;

export function setAutoPlayNextFn(fn: (() => void) | null) { autoPlayNextFn = fn; }
export function getAutoPlayEnabled() { return autoPlayEnabled; }
export function setSpeechPlaylist(items: Array<{ label: string }> | null, currentIdx = 0) {
  speechPlaylist = items;
  speechPlaylistCurrentIdx = currentIdx;
  notifyState();
}

export function playSpeech(text: string, title: string) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return;
  speechFullText = normalizedText;
  speechDisplayTitle = title;
  speechSegments = null;
  startSpeechFrom(0, speechRate, `auto-${Date.now()}`);
}

/**
 * MP3 audio_url이 있으면 HTMLAudio 재생, 없으면 Web Speech 폴백.
 * chain(playlist/autoPlayNextFn)은 호출 직전에 setSpeechPlaylist/setAutoPlayNextFn 로 세팅.
 */
export function playListenable(params: {
  text: string;
  title: string;
  audioUrl?: string | null;
  slug?: string | null;
}) {
  const ownerId = `auto-${Date.now()}`;
  if (params.audioUrl?.trim()) {
    startAudioFrom(params.audioUrl, params.title, speechRate, ownerId, params.slug ?? undefined);
  } else {
    if (params.slug) markSlugAsListened(params.slug);
    const normalizedText = params.text.replace(/\s+/g, " ").trim();
    if (!normalizedText) return;
    speechFullText = normalizedText;
    speechDisplayTitle = params.title;
    speechSegments = null;
    startSpeechFrom(0, speechRate, ownerId);
  }
}

const playbackSubs = new Set<(owner: string | null) => void>();
const stateSubs = new Set<() => void>();

function notifyPlayback() {
  for (const fn of playbackSubs) fn(speechOwner);
}
function notifyState() {
  for (const fn of stateSubs) fn();
}

function startSpeechFrom(charOffset: number, rate: number, ownerId: string) {
  // Null out before cancel so old onend/onerror handlers skip cleanup
  currentUtterance = null;
  window.speechSynthesis.cancel();

  const slice = speechFullText.slice(charOffset);
  if (!slice.trim()) {
    speechOwner = null;
    notifyPlayback();
    notifyState();
    return;
  }

  speechCharOffset = charOffset;
  speechCharIndex = 0;
  speechRate = rate;
  speechOwner = ownerId;

  const utterance = new SpeechSynthesisUtterance(slice);
  utterance.lang = "ko-KR";
  utterance.rate = rate;

  utterance.onboundary = (event) => {
    speechCharIndex = event.charIndex;
    notifyState();
  };

  utterance.onend = () => {
    if (currentUtterance !== utterance) return;
    speechCharIndex = slice.length;
    currentUtterance = null;

    if (autoPlayEnabled && !speechSegments && autoPlayNextFn) {
      // 플레이어를 살려두고 전환 (깜빡임 방지)
      notifyState();
      setTimeout(autoPlayNextFn, 100);
    } else {
      speechOwner = null;
      notifyPlayback();
      notifyState();
    }
  };

  utterance.onerror = () => {
    if (currentUtterance !== utterance) return;
    currentUtterance = null;
    speechOwner = null;
    notifyPlayback();
    notifyState();
  };

  currentUtterance = utterance;
  notifyPlayback();
  notifyState();
  window.speechSynthesis.speak(utterance);
}

function startAudioFrom(url: string, title: string, rate: number, ownerId: string, slug?: string | null) {
  currentUtterance = null;
  window.speechSynthesis?.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  speechOwner = ownerId;
  speechDisplayTitle = title;
  speechSegments = null;
  speechFullText = "";
  speechCharIndex = 0;
  speechCharOffset = 0;
  speechPaused = false;
  speechRate = rate;
  audioCurrentTime = 0;
  audioDuration = 0;
  // NOTE: playlist/autoPlayNextFn은 리셋하지 않음 — chain을 사용하는 호출자(archive-browser 등)가
  // 본 함수 호출 직전에 setSpeechPlaylist/setAutoPlayNextFn 으로 세팅하기 때문.
  // chain이 필요 없는 단일 재생(detail 페이지 등)은 호출자가 명시적으로 null 세팅해야 함.

  if (slug?.trim()) markSlugAsListened(slug);

  const audio = new Audio(url);
  audio.preload = "auto";
  audio.playbackRate = rate;

  audio.onloadedmetadata = () => {
    if (currentAudio !== audio) return;
    audioDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    notifyState();
  };
  audio.ontimeupdate = () => {
    if (currentAudio !== audio) return;
    audioCurrentTime = audio.currentTime;
    notifyState();
  };
  audio.onended = () => {
    if (currentAudio !== audio) return;
    currentAudio = null;
    audioCurrentTime = 0;
    audioDuration = 0;
    if (autoPlayEnabled && autoPlayNextFn) {
      notifyState();
      setTimeout(autoPlayNextFn, 100);
    } else {
      speechOwner = null;
      notifyPlayback();
      notifyState();
    }
  };
  audio.onerror = () => {
    if (currentAudio !== audio) return;
    currentAudio = null;
    speechOwner = null;
    notifyPlayback();
    notifyState();
  };

  currentAudio = audio;
  notifyPlayback();
  notifyState();
  audio.play().catch(() => {
    if (currentAudio === audio) {
      currentAudio = null;
      speechOwner = null;
      notifyPlayback();
      notifyState();
    }
  });
}

function stopAllSpeech() {
  currentUtterance = null;
  speechPaused = false;
  speechPlaylist = null;
  speechPlaylistCurrentIdx = 0;
  autoPlayNextFn = null;
  window.speechSynthesis?.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  audioCurrentTime = 0;
  audioDuration = 0;
  speechOwner = null;
  notifyPlayback();
  notifyState();
}

// ─── Listened tracking (localStorage) ──────────────────────────────────────────
const LISTENED_KEY = "sj-listened-slugs";
const listenedSubs = new Set<() => void>();

function readListenedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LISTENED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function markSlugAsListened(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const set = readListenedSet();
    if (set.has(slug)) return;
    set.add(slug);
    window.localStorage.setItem(LISTENED_KEY, JSON.stringify([...set]));
    for (const fn of listenedSubs) fn();
  } catch {
    // ignore
  }
}

export function getListenedSlugs(): Set<string> {
  return readListenedSet();
}

export function subscribeListenedSlugs(fn: () => void): () => void {
  listenedSubs.add(fn);
  return () => {
    listenedSubs.delete(fn);
  };
}

// ─── Exported for SpeechPlayer ────────────────────────────────────────────────

export type SpeechSnapshot = {
  active: boolean;
  paused: boolean;
  title: string;
  segments: Array<{ label: string; charStart: number }> | null;
  currentSegmentIndex: number;
  playlist: Array<{ label: string }> | null;
  playlistCurrentIdx: number;
  progress: number;
  rate: number;
  autoPlay: boolean;
};

export function getSpeechSnapshot(): SpeechSnapshot {
  // MP3 모드: audio 재생 시간 기반 진행률
  if (currentAudio) {
    const progress = audioDuration > 0 ? Math.min(100, (audioCurrentTime / audioDuration) * 100) : 0;
    return {
      active: speechOwner !== null,
      paused: speechPaused,
      title: speechDisplayTitle,
      segments: null,
      currentSegmentIndex: 0,
      playlist: speechPlaylist,
      playlistCurrentIdx: speechPlaylistCurrentIdx,
      progress,
      rate: speechRate,
      autoPlay: autoPlayEnabled,
    };
  }

  const total = speechFullText.length;
  const done = speechCharOffset + speechCharIndex;
  let currentSegmentIndex = 0;
  if (speechSegments) {
    for (let i = speechSegments.length - 1; i >= 0; i--) {
      if (done >= (speechSegments[i]?.charStart ?? 0)) {
        currentSegmentIndex = i;
        break;
      }
    }
  }
  // 이어듣기(segments) 모드면 현재 세그먼트 내 진행률만 계산
  let progress = 0;
  if (total > 0) {
    if (speechSegments && speechSegments.length > 0) {
      const segStart = speechSegments[currentSegmentIndex]?.charStart ?? 0;
      const segEnd = speechSegments[currentSegmentIndex + 1]?.charStart ?? total;
      const segLen = segEnd - segStart;
      progress = segLen > 0 ? Math.min(100, ((done - segStart) / segLen) * 100) : 0;
    } else {
      progress = Math.min(100, (done / total) * 100);
    }
  }

  return {
    active: speechOwner !== null,
    paused: speechPaused,
    title: speechDisplayTitle,
    segments: speechSegments,
    currentSegmentIndex,
    playlist: speechPlaylist,
    playlistCurrentIdx: speechPlaylistCurrentIdx,
    progress,
    rate: speechRate,
    autoPlay: autoPlayEnabled,
  };
}

export function subscribeSpeechState(fn: () => void): () => void {
  stateSubs.add(fn);
  return () => { stateSubs.delete(fn); };
}

export function changeSpeechRate(newRate: number) {
  if (!speechOwner) return;
  speechRate = newRate;
  if (currentAudio) {
    currentAudio.playbackRate = newRate;
    notifyState();
    return;
  }
  const offset = speechCharOffset + speechCharIndex;
  const ownerId = speechOwner;
  startSpeechFrom(offset, newRate, ownerId);
}

export function stopSpeech() {
  stopAllSpeech();
}

export function togglePauseSpeech() {
  if (!speechOwner) return;
  if (currentAudio) {
    if (speechPaused) {
      currentAudio.play().catch(() => undefined);
      speechPaused = false;
    } else {
      currentAudio.pause();
      speechPaused = true;
    }
  } else if (speechPaused) {
    window.speechSynthesis.resume();
    speechPaused = false;
  } else {
    window.speechSynthesis.pause();
    speechPaused = true;
  }
  notifyState();
}

export function jumpToSegment(index: number) {
  if (!speechSegments || !speechOwner) return;
  const seg = speechSegments[index];
  if (!seg) return;
  startSpeechFrom(seg.charStart, speechRate, speechOwner);
}

export function skipToNext() {
  if (speechSegments) {
    const snap = getSpeechSnapshot();
    const idx = Math.min((speechSegments.length) - 1, snap.currentSegmentIndex + 1);
    jumpToSegment(idx);
  } else if (autoPlayNextFn) {
    autoPlayNextFn();
  }
}

// ─── ListenButton ─────────────────────────────────────────────────────────────

type ListenButtonProps = {
  text: string;
  speechTitle?: string;
  segments?: Array<{ label: string; charStart: number }>;
  className?: string;
  label?: string;
  mobileIconOnly?: boolean;
  onPlay?: () => void;
  playIcon?: boolean;
  audioUrl?: string | null;
  trackSlug?: string | null;
};

export function ListenButton({
  text,
  speechTitle = "",
  segments,
  className = "",
  label = "듣기",
  mobileIconOnly = false,
  onPlay,
  playIcon = false,
  audioUrl,
  trackSlug,
}: ListenButtonProps) {
  const pathname = usePathname();
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const hasAudioUrl = Boolean(audioUrl?.trim());
  const disabled = !normalizedText && !hasAudioUrl;
  const [playing, setPlaying] = useState(false);
  const ownerId = useId();
  const showLabel = Boolean(label?.trim());

  useEffect(() => {
    const handlePlayback = (owner: string | null) => {
      if (owner !== ownerId) setPlaying(false);
    };
    playbackSubs.add(handlePlayback);
    return () => {
      playbackSubs.delete(handlePlayback);
      if (speechOwner === ownerId) stopAllSpeech();
    };
  }, [ownerId]);

  useEffect(() => {
    if (chainAdvancing) return;
    if (speechOwner !== null) stopAllSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function handlePlay() {
    if (disabled) return;

    if (playing) {
      stopAllSpeech();
      setPlaying(false);
      return;
    }

    const title =
      speechTitle.trim() ||
      (normalizedText.length > 30 ? normalizedText.slice(0, 30) + "…" : normalizedText);

    // MP3 캐시가 있으면 HTMLAudio로 재생 (Google TTS Neural2 음성) — SpeechPlayer UI와 통합
    if (hasAudioUrl && audioUrl) {
      // onPlay를 먼저 호출해 parent가 playlist/autoPlayNextFn을 세팅할 기회 제공
      onPlay?.();
      setPlaying(true);
      startAudioFrom(audioUrl, title, speechRate, ownerId, trackSlug);
      return;
    }

    // 폴백: 브라우저 내장 Web Speech API
    speechFullText = normalizedText;
    speechDisplayTitle = title;
    speechSegments = segments ?? null;
    if (!segments) {
      speechPlaylist = null;
      speechPlaylistCurrentIdx = 0;
    }

    // onPlay를 먼저 호출해서 playlist/autoPlayNextFn 세팅 후 startSpeechFrom
    onPlay?.();
    setPlaying(true);
    startSpeechFrom(0, speechRate, ownerId);
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handlePlay();
      }}
      disabled={disabled}
      className={`pointer-events-auto inline-flex h-10 flex-nowrap touch-manipulation items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-800 ${showLabel ? "gap-2 px-3.5" : "w-10 px-0"} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {playing ? <Square className="h-[18px] w-[18px]" /> : playIcon ? <Play className="h-[18px] w-[18px]" fill="currentColor" /> : <Volume2 className="h-[18px] w-[18px]" />}
      </span>
      {showLabel ? (
        <span className={`shrink-0 whitespace-nowrap leading-none ${mobileIconOnly ? "hidden sm:inline" : ""}`}>
          {playing ? "중지" : label}
        </span>
      ) : null}
      <span className="sr-only">{playing ? "중지" : label}</span>
    </button>
  );
}

// ─── SpeechPlayer (floating mini-player) ─────────────────────────────────────

const RATES = [0.75, 1, 1.25] as const;

function rateLabel(rate: number): string {
  if (rate < 0.95) return "느리게";
  if (rate > 1.05) return "빠르게";
  return "보통";
}

export function SpeechPlayer() {
  const [snap, setSnap] = useState<SpeechSnapshot>(() => getSpeechSnapshot());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsub = subscribeSpeechState(() => setSnap(getSpeechSnapshot()));
    return unsub;
  }, []);

  if (!snap.active) return null;

  const mediaMode = Boolean(snap.segments) || Boolean(snap.playlist) || snap.autoPlay;

  function cycleRate() {
    const idx = RATES.indexOf(snap.rate as (typeof RATES)[number]);
    const next = RATES[(idx + 1) % RATES.length] ?? 1;
    changeSpeechRate(next);
  }

  function toggleAutoPlay() {
    const next = !snap.autoPlay;
    autoPlayEnabled = next;
    try { localStorage.setItem("speech-autoplay", next ? "1" : "0"); } catch { /* ignore */ }
    notifyState();
  }

  function prevItem() {
    if (snap.segments) jumpToSegment(Math.max(0, snap.currentSegmentIndex - 1));
  }

  function nextItem() {
    if (snap.segments) {
      jumpToSegment(Math.min((snap.segments.length) - 1, snap.currentSegmentIndex + 1));
    } else {
      skipToNext();
    }
  }

  const canPrev = snap.segments ? snap.currentSegmentIndex > 0 : false;
  const canNext = snap.segments
    ? snap.currentSegmentIndex < (snap.segments.length) - 1
    : snap.playlist
    ? snap.playlistCurrentIdx < (snap.playlist.length) - 1
    : snap.autoPlay && autoPlayNextFn !== null;

  const currentTitle =
    snap.segments?.[snap.currentSegmentIndex]?.label ??
    snap.playlist?.[snap.playlistCurrentIdx]?.label ??
    snap.title;

  return (
    <div
      className="fixed z-50 left-3 right-3 bottom-[84px] sm:left-1/2 sm:right-auto sm:bottom-[96px] sm:w-[560px] sm:-translate-x-1/2 lg:left-0 lg:right-0 lg:bottom-0 lg:w-auto lg:translate-x-0"
    >
      {/* PC: 하단 풀폭 / 모바일·태블릿: 카드 */}
      <div
        style={{
          background: "#fff",
          borderTop: "1.5px solid #F2E6D7",
          borderRadius: 0,
          boxShadow: "0 -8px 28px rgba(31,26,20,0.10)",
        }}
        className="hidden lg:block"
      >
        <div style={{ height: 3, background: "#F5EEE2", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${snap.progress}%`, background: "#E57C23", transition: "width 0.3s" }} />
        </div>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 32px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#FFF2E3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
                border: "2px solid #FFD1A333",
              }}
              aria-hidden="true"
            >
              🎧
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#B2570F", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>
                지금 듣는 중
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#1F1A14",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 460,
                }}
              >
                {currentTitle}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {mediaMode ? (
              <button
                type="button"
                onClick={prevItem}
                disabled={!canPrev}
                aria-label="이전"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "#FFFBF5",
                  border: "1.5px solid #F2E6D7",
                  cursor: canPrev ? "pointer" : "not-allowed",
                  opacity: canPrev ? 1 : 0.4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <SkipBack className="h-5 w-5" color="#4A4037" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={togglePauseSpeech}
              aria-label={snap.paused ? "재생" : "일시정지"}
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "#E57C23",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(229,124,35,0.35)",
                fontFamily: "inherit",
              }}
            >
              {snap.paused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
            </button>
            {mediaMode ? (
              <button
                type="button"
                onClick={nextItem}
                disabled={!canNext}
                aria-label="다음"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "#FFFBF5",
                  border: "1.5px solid #F2E6D7",
                  cursor: canNext ? "pointer" : "not-allowed",
                  opacity: canNext ? 1 : 0.4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <SkipForward className="h-5 w-5" color="#4A4037" />
              </button>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={cycleRate}
              aria-label={`재생 속도 (현재 ${rateLabel(snap.rate)})`}
              style={{
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 10,
                background: "#FFFBF5",
                color: "#1F1A14",
                border: "1.5px solid #E8DCC7",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              🐢 {rateLabel(snap.rate)}
            </button>
            <button
              type="button"
              onClick={toggleAutoPlay}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 40,
                padding: "0 12px",
                borderRadius: 10,
                background: snap.autoPlay ? "#1F1A14" : "#FFFBF5",
                color: snap.autoPlay ? "#fff" : "#4A4037",
                border: snap.autoPlay ? "none" : "1.5px solid #E8DCC7",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              자동재생 {snap.autoPlay ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={stopSpeech}
              aria-label="닫기"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#F5EEE2",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              <X className="h-4 w-4" color="#7A6F62" />
            </button>
          </div>
        </div>
      </div>

      {/* 모바일/태블릿: 카드 형태 */}
      <div
        className="lg:hidden"
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1.5px solid #F2E6D7",
          boxShadow: "0 -4px 22px rgba(31,26,20,0.10), 0 8px 24px rgba(31,26,20,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 4, background: "#F5EEE2", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${snap.progress}%`, background: "#E57C23", transition: "width 0.3s" }} />
        </div>

        {!expanded ? (
          <div
            onClick={() => setExpanded(true)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#FFF2E3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                flexShrink: 0,
                border: "2px solid #FFD1A333",
              }}
              aria-hidden="true"
            >
              🎧
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#B2570F", letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 2 }}>
                지금 듣는 중
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#1F1A14",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentTitle}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePauseSpeech();
              }}
              aria-label={snap.paused ? "재생" : "일시정지"}
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "#E57C23",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(229,124,35,0.35)",
              }}
            >
              {snap.paused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
            </button>
          </div>
        ) : (
          <div style={{ padding: "14px 18px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#FFF2E3",
                  color: "#B2570F",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                🎧 오디오
              </div>
              <span style={{ fontSize: 12, color: "#9C907F", fontWeight: 700 }}>듣는 중</span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="접기"
                style={{
                  marginLeft: "auto",
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "#F5EEE2",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A4037" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <button
                type="button"
                onClick={stopSpeech}
                aria-label="닫기"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "#F5EEE2",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <X className="h-4 w-4" color="#7A6F62" />
              </button>
            </div>

            <div style={{ fontSize: 17, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.02em", lineHeight: 1.35, marginBottom: 16 }}>
              {currentTitle}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 16 }}>
              <button
                type="button"
                onClick={prevItem}
                disabled={!canPrev}
                aria-label="이전"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "#FFFBF5",
                  border: "1.5px solid #F2E6D7",
                  cursor: canPrev ? "pointer" : "not-allowed",
                  opacity: canPrev ? 1 : 0.35,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <SkipBack className="h-7 w-7" color="#4A4037" />
              </button>
              <button
                type="button"
                onClick={togglePauseSpeech}
                aria-label={snap.paused ? "재생" : "일시정지"}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 999,
                  background: "#E57C23",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(229,124,35,0.4)",
                  fontFamily: "inherit",
                }}
              >
                {snap.paused ? <Play className="h-8 w-8" /> : <Pause className="h-8 w-8" />}
              </button>
              <button
                type="button"
                onClick={nextItem}
                disabled={!canNext}
                aria-label="다음"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "#FFFBF5",
                  border: "1.5px solid #F2E6D7",
                  cursor: canNext ? "pointer" : "not-allowed",
                  opacity: canNext ? 1 : 0.35,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                <SkipForward className="h-7 w-7" color="#4A4037" />
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={cycleRate}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  background: "#fff",
                  color: "#1F1A14",
                  border: "1.5px solid #E8DCC7",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                🐢 속도 {rateLabel(snap.rate)}
              </button>
              <button
                type="button"
                onClick={toggleAutoPlay}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  background: snap.autoPlay ? "#1F1A14" : "#fff",
                  color: snap.autoPlay ? "#fff" : "#4A4037",
                  border: snap.autoPlay ? "none" : "1.5px solid #E8DCC7",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                }}
              >
                자동재생 {snap.autoPlay ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SpeechSearchButton ───────────────────────────────────────────────────────

type SpeechSearchButtonProps = {
  onTranscript: (transcript: string) => void;
  className?: string;
};

export function SpeechSearchButton({ onTranscript, className = "" }: SpeechSearchButtonProps) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const mediaRecorderSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
  const supported = speechRecognitionSupported || mediaRecorderSupported;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stopMediaCapture() {
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function createSupportedMimeType() {
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
    const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
    return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  }

  async function transcribeRecordedAudio(blob: Blob) {
    setTranscribing(true);
    try {
      const extension = blob.type.includes("mp4") ? "m4a" : blob.type.includes("mpeg") ? "mp3" : "webm";
      const formData = new FormData();
      formData.append("file", new File([blob], `speech-search.${extension}`, { type: blob.type || "audio/webm" }));
      const response = await fetch("/api/audio/transcribe", { method: "POST", body: formData });
      const data = (await response.json()) as { text?: string };
      if (!response.ok || !data.text) throw new Error("TRANSCRIPTION_FAILED");
      onTranscript(data.text);
    } finally {
      setTranscribing(false);
    }
  }

  async function startMediaRecorderSearch() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = createSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recordedChunksRef.current = [];
    mediaStreamRef.current = stream;
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunksRef.current.push(event.data); };
    recorder.onerror = () => { setListening(false); stopMediaCapture(); };
    recorder.onstop = async () => {
      setListening(false);
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      stopMediaCapture();
      if (blob.size > 0) { try { await transcribeRecordedAudio(blob); } catch { /* ignore */ } }
    };
    recorder.start();
    setListening(true);
  }

  function handleClick() {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      const recognition = new Recognition();
      recognition.lang = "ko-KR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = Array.from({ length: event.results.length })
          .map((_, i) => event.results[i]?.[0]?.transcript?.trim() ?? "")
          .join(" ").trim();
        if (transcript) onTranscript(transcript);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
      return;
    }
    if (mediaRecorderSupported) void startMediaRecorderSearch();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!supported || transcribing}
      className={`inline-flex min-h-14 min-w-14 items-center justify-center rounded-3xl border border-gray-300 bg-white text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
      aria-label={listening ? "음성 검색 중지" : transcribing ? "음성 변환 중" : "음성으로 검색"}
      title={supported ? "음성으로 검색" : "이 브라우저에서는 음성 검색을 지원하지 않습니다."}
    >
      {listening || transcribing ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
