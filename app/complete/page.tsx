import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { CompleteShareButton } from "@/components/complete-share-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { Panel, PanelBody, SectionEyebrow } from "@/components/ui/panel";
import { getCurrentUserSession } from "@/lib/auth/user-session";
import { findUserById } from "@/lib/mongodb/user-data";
import { isAvatarKey } from "@/lib/profile";
import { decodeShareState, encodeShareState, formatInterestSummary } from "@/lib/share";

type PageProps = {
  searchParams: Promise<{ interest?: string | string[]; sub?: string | string[]; nickname?: string | string[]; avatar?: string | string[] }>;
};

export default async function CompletePage({ searchParams }: PageProps) {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3100";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const session = await getCurrentUserSession();
  const user = session ? await findUserById(session.id) : null;
  const profileUser = user as
    | (typeof user & {
        avatar_key?: string | null;
        nickname?: string | null;
      })
    | null;
  const shareState = decodeShareState(await searchParams);
  const nickname = typeof profileUser?.nickname === "string" && profileUser.nickname.trim() ? profileUser.nickname : undefined;
  const avatarKey = isAvatarKey(profileUser?.avatar_key) ? profileUser.avatar_key : undefined;
  const enrichedShareState = {
    ...shareState,
    profile: nickname ? { nickname, avatarKey } : shareState.profile
  };
  const shareQuery = encodeShareState(enrichedShareState);
  const shareUrl = new URL(shareQuery ? `/invite?${shareQuery}` : "/invite", `${protocol}://${host}`).toString();
  const interestSummary = formatInterestSummary(enrichedShareState);

  return (
    <div className="app-shell max-w-3xl py-20">
      <Panel>
        <PanelBody className="text-center">
        <SectionEyebrow>완료</SectionEyebrow>
        <h1 className="mt-4 text-4xl font-extrabold leading-[1.35] text-navy-900">신청이 정상적으로 접수되었습니다.</h1>
        <p className="mt-5 text-lg leading-8 text-navy-700">
          신청한 오늘은 방금 메일이 발송되었습니다. 선택하신 시간은 다음 날부터 적용되니 메일함에서 첫 브리핑을 확인해보세요.
        </p>
        <p className="mt-3 text-base leading-7 text-navy-500">
          메일이 보이지 않으면 프로모션함이나 스팸함도 함께 확인해주세요.
        </p>
        {interestSummary ? (
          <p className="mt-4 text-base leading-7 text-navy-700">
            공유 링크에는 신청하신 주제인 {interestSummary} 정보가 함께 담겨 전달됩니다.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-navy-200 bg-white px-5 py-3 text-base font-semibold text-navy-900 transition hover:border-navy-300 hover:bg-navy-50"
          >
            지난 소식 보기
          </Link>
          <CompleteShareButton shareUrl={shareUrl} interestSummary={interestSummary} />
        </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
