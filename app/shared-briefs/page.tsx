import type { Metadata } from "next";
import Link from "next/link";

import { SharedBriefCard } from "@/components/shared-brief-card";
import { SharedComments } from "@/components/shared-comments";
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { DEMO_ARCHIVE_ITEMS } from "@/lib/content/demo-data";
import { normalizeSources } from "@/lib/content/sources";
import { hasSupabaseServerEnv } from "@/lib/env";
import { getSharedLinkRecord, incrementSharedLinkView, listSharedComments } from "@/lib/mongodb/content-data";
import { findUserById } from "@/lib/mongodb/user-data";
import { getAvatarOption, isAvatarKey } from "@/lib/profile";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "공유된 브리핑",
  description: "세줄아침 사용자가 공유한 아침 브리핑을 확인해보세요.",
  openGraph: {
    title: "세줄아침 공유 브리핑",
    description: "세줄아침 사용자가 추천한 오늘의 브리핑",
  },
};

type PageProps = {
  searchParams: Promise<{ slug?: string | string[]; nickname?: string | string[]; avatar?: string | string[]; share?: string | string[] }>;
};

export default async function SharedBriefsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getCurrentUserSession();
  const shareKey = typeof params.share === "string" ? params.share : undefined;
  const sharedRecord = shareKey ? await getSharedLinkRecord(shareKey) : null;
  if (shareKey && sharedRecord) {
    await incrementSharedLinkView(shareKey);
  }
  const currentUser = session ? await findUserById(session.id) : null;
  const comments = shareKey ? await listSharedComments(shareKey) : [];
  const rawSlugs = sharedRecord?.slugs ?? (Array.isArray(params.slug) ? params.slug : params.slug ? [params.slug] : []);
  const slugs = rawSlugs.slice(0, 10);
  const nickname =
    sharedRecord?.nickname ??
    (typeof params.nickname === "string" ? params.nickname.slice(0, 24) : undefined);
  const avatar = getAvatarOption(
    sharedRecord?.avatar_key ??
      (typeof params.avatar === "string" && isAvatarKey(params.avatar) ? params.avatar : undefined)
  );

  const data = hasSupabaseServerEnv()
    ? (
        await createAdminSupabaseClient()
          .from("content_items")
          .select("id, title, short_summary, long_summary, action_line, source_name, source_url, sources, slug, published_at, main_interest, sub_interest, thumbnail_url, thumbnail_alt")
          .in("slug", slugs)
      ).data ?? []
    : DEMO_ARCHIVE_ITEMS;

  const mergedItems = [...data, ...DEMO_ARCHIVE_ITEMS.filter((demoItem) => !data.some((item) => item.slug === demoItem.slug))];
  const items = mergedItems.filter((item) => slugs.includes(item.slug));

  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto 24px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "#fff",
            borderRadius: 999,
            border: "1.5px solid #F5DDC2",
            fontSize: 12,
            fontWeight: 800,
            color: "#B2570F",
            marginBottom: 12,
          }}
        >
          공유 받은 소식
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          공유 받은 소식
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 15, color: "#7A6F62", fontWeight: 500, lineHeight: 1.6 }}>
          선택된 지난 소식을 모아보고, 마음에 들면 세줄아침을 바로 살펴보실 수 있어요.
        </p>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 24 }} className="xl:!grid-cols-[minmax(0,1fr)_220px]">
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gap: 14 }}>
            {nickname ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "#FFFBF5",
                  border: "1.5px solid #F2E6D7",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "#FFF2E3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    flexShrink: 0,
                  }}
                >
                  {avatar.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#B2570F", letterSpacing: "-0.01em" }}>
                    공유해준 사람
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#1F1A14", marginTop: 2, letterSpacing: "-0.02em" }}>
                    {nickname}
                  </div>
                  {sharedRecord?.message ? (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4A4037", lineHeight: 1.5, fontWeight: 500 }}>
                      {sharedRecord.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              {items.map((item) => (
                <SharedBriefCard
                  key={item.slug}
                  item={{
                    slug: item.slug,
                    title: item.title,
                    short_summary: item.short_summary ?? "",
                    long_summary: "long_summary" in item ? (item as Record<string, unknown>).long_summary as string | null : null,
                    action_line: item.action_line,
                    published_at: item.published_at,
                    main_interest: "main_interest" in item ? (item as Record<string, unknown>).main_interest as string | null : null,
                    sub_interest: "sub_interest" in item ? (item as Record<string, unknown>).sub_interest as string | null : null,
                    thumbnail_url: "thumbnail_url" in item ? (item as Record<string, unknown>).thumbnail_url as string | null : null,
                    thumbnail_alt: "thumbnail_alt" in item ? (item as Record<string, unknown>).thumbnail_alt as string | null : null,
                    sources: normalizeSources(item),
                  }}
                />
              ))}
              {items.length === 0 ? (
                <div
                  style={{
                    borderRadius: 18,
                    border: "2px dashed #E8DCC7",
                    background: "#FFFBF5",
                    padding: 22,
                    fontSize: 14,
                    color: "#7A6F62",
                    fontWeight: 600,
                    lineHeight: 1.6,
                    textAlign: "center",
                  }}
                >
                  아직 공유된 지난 소식을 불러오지 못했습니다.
                  <br />
                  지난 소식에서 다시 선택해 공유해보세요.
                </div>
              ) : null}
            </div>
          </div>

          {shareKey ? (
            <SharedComments
              shareKey={shareKey}
              initialComments={comments.map((comment) => ({
                id: typeof comment._id === "string" ? comment._id : comment._id?.toString() ?? "",
                user_id: comment.user_id ?? null,
                parent_id: comment.parent_id ?? null,
                depth: comment.depth ?? 1,
                name: comment.name,
                content: comment.content,
                created_at: comment.created_at
              }))}
              currentDisplayName={
                session
                  ? typeof currentUser?.nickname === "string" && currentUser.nickname.trim().length > 0
                    ? currentUser.nickname
                    : session.email.split("@")[0]
                  : null
              }
            />
          ) : null}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="flex flex-row gap-3 xl:flex-col">
            <Link
              href="/"
              style={{
                flex: 1,
                minHeight: 52,
                padding: "0 20px",
                borderRadius: 14,
                background: "#fff",
                color: "#1F1A14",
                border: "1.5px solid #E8DCC7",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "-0.01em",
              }}
            >
              소식 더보기
            </Link>
            <Link
              href="/signup"
              style={{
                flex: 1,
                minHeight: 52,
                padding: "0 20px",
                borderRadius: 14,
                background: "#E57C23",
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "-0.01em",
                boxShadow: "0 6px 16px rgba(229, 124, 35, 0.3)",
              }}
            >
              무료로 받아보기
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
