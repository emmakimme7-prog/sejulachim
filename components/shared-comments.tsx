"use client";

import { useMemo, useState } from "react";
import { MessageCircleReply } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldHint, FieldLabel, TextInput } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";

type SharedComment = {
  id: string;
  user_id?: string | null;
  parent_id?: string | null;
  depth: number;
  name: string;
  content: string;
  created_at: string;
};

export function SharedComments({
  shareKey,
  initialComments,
  currentDisplayName
}: {
  shareKey: string;
  initialComments: SharedComment[];
  currentDisplayName?: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState(currentDisplayName ?? "");
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyName, setReplyName] = useState(currentDisplayName ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const orderedComments = useMemo(() => {
    const walk = (parentId: string | null = null): SharedComment[] =>
      comments
        .filter((comment) => (comment.parent_id ?? null) === parentId)
        .flatMap((comment) => [comment, ...walk(comment.id)]);

    return walk();
  }, [comments]);

  function appendComment(next: SharedComment) {
    setComments((current) => [...current, next]);
  }

  async function submitComment(input: { parentId?: string | null; content: string; name?: string }) {
    const isReply = Boolean(input.parentId);
    const effectiveName = currentDisplayName || input.name?.trim() || "";

    if (!currentDisplayName && !effectiveName) {
      setToast("이름을 입력해 주세요.");
      return;
    }

    if (!input.content.trim()) {
      setToast(isReply ? "답글을 입력해 주세요." : "댓글을 입력해 주세요.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/share-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareKey,
          parentId: input.parentId ?? undefined,
          name: currentDisplayName ? undefined : effectiveName,
          content: input.content.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "댓글을 저장하지 못했습니다.");
      }

      if (data.comment?.id) {
        appendComment({
          id: data.comment.id,
          user_id: data.comment.user_id ?? null,
          parent_id: data.comment.parent_id ?? null,
          depth: data.comment.depth ?? 1,
          name: data.comment.name ?? effectiveName,
          content: data.comment.content ?? input.content.trim(),
          created_at: data.comment.created_at ?? new Date().toISOString()
        });
      }

      if (isReply) {
        setReplyContent("");
        setReplyingTo(null);
        setToast("답글을 남겼습니다.");
      } else {
        setContent("");
        setToast("댓글을 남겼습니다.");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "댓글을 저장하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    await submitComment({ content, name });
  }

  return (
    <div className="space-y-5 rounded-[28px] border border-gray-200 bg-white p-6">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">COMMENT</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-gray-900">댓글 남기기</h2>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {!currentDisplayName ? (
          <div>
            <FieldLabel>이름</FieldLabel>
            <TextInput value={name} onChange={(event) => setName(event.target.value.slice(0, 30))} placeholder="이름을 입력해주세요" />
          </div>
        ) : (
          <div>
            <FieldLabel>이름</FieldLabel>
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 px-5 py-4 text-base font-semibold text-gray-900">{currentDisplayName}</div>
          </div>
        )}

        <div>
          <FieldLabel>댓글</FieldLabel>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, 50))}
            placeholder="댓글을 남겨주세요"
            className="mt-3 min-h-28 w-full rounded-[24px] border border-gray-200 bg-white px-5 py-4 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
          <FieldHint className="mt-2 text-right">{content.length}/50</FieldHint>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "남기는 중..." : "댓글 남기기"}
        </Button>
      </form>

      <div className="space-y-3">
        {orderedComments.map((comment) => (
          <div key={comment.id} className="w-full rounded-[20px] bg-gray-50 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_220px] items-start gap-4">
              <div
                className="min-w-0"
                style={{
                  marginLeft: Math.max(0, comment.depth - 1) * 28
                }}
              >
                <div className={comment.depth > 1 ? "border-l border-gray-200 pl-4" : ""}>
                  <p className="min-w-0 text-sm font-semibold text-gray-900">
                    {comment.name}
                    <span className="ml-2 text-[11px] font-normal text-gray-500">({comment.user_id ?? comment.id})</span>
                  </p>
                  <p className="mt-2 text-base leading-7 text-gray-700">{comment.content}</p>
                  {comment.depth < 3 ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo((current) => (current === comment.id ? null : comment.id));
                          setReplyContent("");
                          setReplyName(currentDisplayName ?? "");
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500"
                      >
                        <MessageCircleReply className="h-4 w-4" />
                        답글 달기
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <p className="w-[220px] self-start text-right text-xs tabular-nums text-gray-600">
                {new Date(comment.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            {replyingTo === comment.id ? (
              <form
                className="mt-4 space-y-3 rounded-[18px] bg-white p-4 ring-1 ring-gray-200"
                style={{
                  marginLeft: Math.max(0, comment.depth - 1) * 28
                }}
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (pending) {
                    return;
                  }
                  await submitComment({ parentId: comment.id, content: replyContent, name: replyName });
                }}
              >
                {!currentDisplayName ? (
                  <TextInput value={replyName} onChange={(event) => setReplyName(event.target.value.slice(0, 30))} placeholder="이름을 입력해주세요" />
                ) : (
                  <div className="rounded-[18px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">{currentDisplayName}</div>
                )}
                <textarea
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value.slice(0, 50))}
                  placeholder="답글을 남겨주세요"
                  className="min-h-24 w-full rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
                <div className="flex items-center justify-between gap-3">
                  <FieldHint>{replyContent.length}/50</FieldHint>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                      취소
                    </Button>
                    <Button type="submit" size="sm" disabled={pending}>
                      {pending ? "남기는 중..." : "답글 남기기"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : null}
          </div>
        ))}
        {comments.length === 0 ? <div className="rounded-[20px] border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div> : null}
      </div>

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
