"use client";

import { Bell, ExternalLink } from "lucide-react";
import { useState } from "react";

type NotificationRow = {
  id: string;
  type: string;
  actor_name: string;
  title: string;
  body: string;
  target_url: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  share_comment: "신규 댓글 알림",
  comment: "신규 댓글 알림",
  like: "좋아요 알림",
  share: "공유 알림",
};

function getTypeLabel(type: string) {
  return TYPE_LABEL[type] ?? "신규 댓글 알림";
}

function extractActorName(actorName: string, title: string) {
  if (actorName) return actorName;
  // title 형식: "홍길동님이 새 댓글을 작성했어요" → "홍길동" 추출
  const match = title.match(/^(.+?)님이/);
  return match ? match[1] : "";
}

export function NotificationsList({ rows }: { rows: NotificationRow[] }) {
  const [notifications, setNotifications] = useState(rows);

  async function openNotification(item: NotificationRow) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id })
      });
      setNotifications((current) => current.map((row) => (row.id === item.id ? { ...row, is_read: true } : row)));
    } catch {
      // ignore
    }

    const targetUrl = new URL(item.target_url, window.location.origin).toString();
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "all" })
      });
      setNotifications((current) => current.map((row) => ({ ...row, is_read: true })));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      {notifications.length > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50"
          >
            전체 읽음 처리
          </button>
        </div>
      ) : null}
      {notifications.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => void openNotification(item)}
          className={`w-full rounded-xl border p-5 text-left transition ${
            item.is_read ? "border-gray-200 bg-white" : "border-orange-200 bg-orange-50"
          }`}
        >
          {/* 행 1: 종 아이콘 / 주제 / 바로가기 아이콘 */}
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
              <Bell className="h-4 w-4" />
            </div>
            <p className="flex-1 text-sm font-bold text-orange-500">{getTypeLabel(item.type)}</p>
            <ExternalLink className="h-4 w-4 shrink-0 text-gray-500" />
          </div>

          {/* 행 2: 닉네임 + 내용 */}
          <div className="mt-3">
            {extractActorName(item.actor_name, item.title) ? (
              <p className="text-base font-bold leading-snug text-gray-900">{extractActorName(item.actor_name, item.title)}</p>
            ) : null}
            <p className="mt-1 text-sm leading-7 text-gray-600">{item.body}</p>
          </div>

          {/* 행 3: 일시 */}
          <div className="mt-2 text-right">
            <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString("ko-KR")}</p>
          </div>
        </button>
      ))}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">아직 알림이 없습니다.</div>
      ) : null}
    </div>
  );
}
