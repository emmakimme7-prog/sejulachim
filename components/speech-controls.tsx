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

function stopAllSpeech() {
  currentUtterance = null;
  speechPaused = false;
  speechPlaylist = null;
  speechPlaylistCurrentIdx = 0;
  window.speechSynthesis?.cancel();
  speechOwner = null;
  notifyPlayback();
  notifyState();
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
  const offset = speechCharOffset + speechCharIndex;
  const ownerId = speechOwner;
  startSpeechFrom(offset, newRate, ownerId);
}

export function stopSpeech() {
  stopAllSpeech();
}

export function togglePauseSpeech() {
  if (!speechOwner) return;
  if (speechPaused) {
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
};

export function ListenButton({
  text,
  speechTitle = "",
  segments,
  className = "",
  label = "듣기",
  mobileIconOnly = false,
  onPlay,
}: ListenButtonProps) {
  const pathname = usePathname();
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const disabled = !normalizedText;
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

    speechFullText = normalizedText;
    speechDisplayTitle =
      speechTitle.trim() ||
      (normalizedText.length > 30 ? normalizedText.slice(0, 30) + "…" : normalizedText);
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
      className={`pointer-events-auto inline-flex h-10 flex-nowrap touch-manipulation items-center justify-center rounded-full border border-navy-200 bg-white text-sm font-semibold text-navy-800 ${showLabel ? "gap-2 px-3.5" : "w-10 px-0"} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {playing ? <Square className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
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

const RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export function SpeechPlayer() {
  const [snap, setSnap] = useState<SpeechSnapshot>(() => getSpeechSnapshot());

  useEffect(() => {
    const unsub = subscribeSpeechState(() => setSnap(getSpeechSnapshot()));
    return unsub;
  }, []);

  if (!snap.active) return null;

  // segments / playlist / 자동재생 ON이면 미디어플레이어 UI
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
    if (snap.segments) {
      jumpToSegment(Math.max(0, snap.currentSegmentIndex - 1));
    }
    // 자동재생 단독 모드에서는 이전 없음 (disabled)
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

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:w-[440px] sm:-translate-x-1/2">
      <div className="rounded-2xl border border-white/10 bg-navy-900/90 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">

        {/* 타이틀 + 닫기(X = 완전 종료) */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {snap.segments ? (
              <div className="flex flex-col gap-0.5">
                {snap.segments.slice(snap.currentSegmentIndex, snap.currentSegmentIndex + 2).map((seg, i) => (
                  <span
                    key={seg.label}
                    className={`text-sm font-semibold leading-6 transition-colors ${
                      i === 0 ? "text-orange-400" : "text-white/35"
                    }`}
                  >
                    {seg.label}
                  </span>
                ))}
              </div>
            ) : snap.playlist && snap.autoPlay ? (
              <div className="flex flex-col gap-0.5">
                {snap.playlist.map((item, i) => (
                  <span
                    key={i}
                    className={`text-sm font-semibold leading-6 transition-colors ${
                      i === snap.playlistCurrentIdx ? "text-orange-400" : "text-white/35"
                    }`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="truncate text-sm font-semibold text-white/90">{snap.title}</p>
            )}
          </div>
          <button
            type="button"
            onClick={stopSpeech}
            className="shrink-0 text-white/40 transition hover:text-white"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 진행 바 */}
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-orange-400 transition-[width] duration-300"
            style={{ width: `${snap.progress}%` }}
          />
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center justify-between">
          {/* 배속 */}
          <button
            type="button"
            onClick={cycleRate}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
            aria-label={`재생 속도 변경 (현재 ${snap.rate}배속)`}
          >
            <Volume2 className="h-3.5 w-3.5 opacity-70" />
            <span>{snap.rate}x</span>
          </button>

          {/* 이전 / 일시정지 / 다음 */}
          <div className="flex items-center gap-1">
            {mediaMode ? (
              <button
                type="button"
                onClick={prevItem}
                disabled={!canPrev}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label="이전"
              >
                <SkipBack className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={togglePauseSpeech}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={snap.paused ? "재생" : "일시정지"}
            >
              {snap.paused
                ? <Play className="h-4 w-4" />
                : <Pause className="h-4 w-4" />
              }
            </button>
            {mediaMode ? (
              <button
                type="button"
                onClick={nextItem}
                disabled={!canNext}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label="다음"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* 자동재생 토글 (항상 표시) */}
          <button
            type="button"
            onClick={toggleAutoPlay}
            className="flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-white/80"
          >
            <span>자동재생</span>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                snap.autoPlay ? "bg-orange-500" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  snap.autoPlay ? "translate-x-[18px]" : "translate-x-[3px]"
                }`}
              />
            </span>
          </button>
        </div>

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
      className={`inline-flex min-h-14 min-w-14 items-center justify-center rounded-3xl border border-navy-200 bg-white text-navy-800 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-300 ${className}`}
      aria-label={listening ? "음성 검색 중지" : transcribing ? "음성 변환 중" : "음성으로 검색"}
      title={supported ? "음성으로 검색" : "이 브라우저에서는 음성 검색을 지원하지 않습니다."}
    >
      {listening || transcribing ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
