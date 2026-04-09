import Link from "next/link";

import { PageIntro, SoftCard } from "@/components/ui/panel";
import { getAvatarOption } from "@/lib/profile";
import { decodeShareState, encodeShareState } from "@/lib/share";

type PageProps = {
  searchParams: Promise<{ interest?: string | string[]; sub?: string | string[]; nickname?: string | string[]; avatar?: string | string[] }>;
};

export default async function InvitePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const shareState = decodeShareState(params);
  const signupQuery = encodeShareState(shareState);
  const signupHref = signupQuery ? `/signup?${signupQuery}` : "/signup";
  const avatar = getAvatarOption(shareState.profile?.avatarKey);

  return (
    <div className="app-shell section-block max-w-4xl">
      <PageIntro
        eyebrow="SHARE"
        title="지인이 고른 세줄아침 주제를 살펴보세요."
        description="아침마다 어떤 내용을 받아보는지 먼저 보고, 마음에 들면 바로 같은 흐름으로 신청하실 수 있습니다."
        className="mb-10"
      />

      <SoftCard className="p-8 md:p-10">
        {shareState.profile?.nickname ? (
          <div className="mb-8 flex items-center gap-4 rounded-[24px] bg-navy-50 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm">{avatar.emoji}</div>
            <div>
              <p className="text-sm font-semibold text-orange-500">공유한 사람</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{shareState.profile.nickname}</p>
            </div>
          </div>
        ) : null}
        <p className="text-sm font-semibold text-orange-500">선택한 주제</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {shareState.interests.length > 0 ? (
            shareState.interests.map((interest) => (
              <div key={interest} className="rounded-[24px] border border-navy-100 bg-navy-50 p-5">
                <p className="text-xl font-extrabold text-navy-900">{interest}</p>
                <p className="mt-2 text-base text-navy-600">{shareState.subInterests[interest] ?? "세부 관심 선택 안 함"}</p>
              </div>
            ))
          ) : (
            <p className="text-base text-navy-600">공유된 주제가 없습니다. 기본 가입 화면으로 이동해 주세요.</p>
          )}
        </div>

        <div className="mt-8 rounded-[28px] bg-sand p-6">
          <p className="text-lg leading-8 text-navy-800">
            아침마다 세 줄의 뉴스 정보 받아보기
          </p>
          <p className="mt-2 text-base leading-7 text-navy-600">
            관심사 세 가지와 이메일만 입력하면 됩니다. 오늘 신청하면 바로 첫 브리핑이 발송됩니다.
          </p>
          <div className="mt-6">
            <Link
              href={signupHref}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-orange-500 px-6 text-lg font-bold text-white shadow-[0_10px_30px_rgba(229,124,35,0.18)] transition hover:bg-orange-400"
            >
              신청 페이지로 바로 가기
            </Link>
          </div>
        </div>
      </SoftCard>
    </div>
  );
}
