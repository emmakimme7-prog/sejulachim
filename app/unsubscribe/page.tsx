import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, SectionEyebrow } from "@/components/ui/panel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token, status } = await searchParams;

  return (
    <div className="app-shell max-w-2xl py-20">
      <Panel>
        <PanelBody>
        <SectionEyebrow>UNSUBSCRIBE</SectionEyebrow>
        <h1 className="mt-4 text-3xl font-extrabold text-gray-900">메일 수신 설정</h1>
        {status === "done" ? (
          <p className="mt-4 text-lg leading-8 text-gray-700">수신 해지가 완료되었습니다. 언제든 다시 가입하실 수 있습니다.</p>
        ) : token ? (
          <>
            <p className="mt-4 text-lg leading-8 text-gray-700">
              세줄아침 메일을 그만 받으시려면 아래 버튼을 눌러주세요.
            </p>
            <form method="post" action="/api/unsubscribe" className="mt-8">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" size="lg">수신 해지하기</Button>
            </form>
          </>
        ) : (
          <p className="mt-4 text-lg leading-8 text-gray-700">유효한 수신 해지 토큰이 없습니다.</p>
        )}
        <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-gray-700 underline underline-offset-4">
          홈으로 돌아가기
        </Link>
        </PanelBody>
      </Panel>
    </div>
  );
}
