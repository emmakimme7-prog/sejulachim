import type { Metadata } from "next";
import Link from "next/link";

import { SharedBriefCard } from "@/components/shared-brief-card";
import { SharedComments } from "@/components/shared-comments";
import { PageIntro } from "@/components/ui/panel";
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
    <div className="app-shell section-block">
      <PageIntro
        eyebrow="SHARE"
        title="공유 받은 소식"
        description="선택된 지난 소식을 모아보고, 마음에 들면 세줄아침을 바로 살펴보실 수 있습니다."
        className="mb-10"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-6">
          <div className="space-y-4">
            {nickname ? (
              <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl shadow-sm">{avatar.emoji}</div>
                <div>
                  <p className="text-xs font-semibold text-orange-500">공유해준 사람</p>
                  <p className="mt-0.5 text-base font-bold text-navy-900">{nickname}</p>
                  {sharedRecord?.message ? <p className="mt-1 text-sm leading-6 text-navy-700">{sharedRecord.message}</p> : null}
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
                <div className="rounded-xl border border-dashed border-navy-200 bg-white p-[18px] text-sm leading-6 text-navy-600">
                  아직 공유된 지난 소식을 불러오지 못했습니다. 지난 소식에서 다시 선택해 공유해보세요.
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
            <Link href="/" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-navy-200 bg-white px-5 py-3 text-base font-semibold text-navy-900 shadow-sm">
              소식 더보기
            </Link>
            <Link href="/signup" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-base font-semibold text-white shadow-sm">
              무료로 받아보기
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
