import Image from "next/image";
import Link from "next/link";

const relatedSites = [
  { label: "Studio by You", href: "https://studiobyyou.kr" },
  { label: "챗허브", href: "https://chathub.studiobyyou.kr" },
  { label: "폼허브", href: "https://studiobyyou.kr/?site=formhub-temp" },
  { label: "픽허브", href: "https://survey.studiobyyou.kr" },
] as const;

export function SiteFooter() {
  return (
    <footer className="slm-footer" data-site-footer>
      <div className="slm-footer__inner">

        {/* 왼쪽: 로고 + 설명 + 사업자 정보 */}
        <div className="slm-footer__meta">
          <div className="mb-[17px] flex items-center gap-[12px]">
            <Image
              src="/threeline_morning_symbol.png"
              alt="세줄아침 심볼"
              width={32}
              height={32}
              className="h-[32px] w-[32px] shrink-0"
            />
            <div>
              <p className="font-bold text-navy-900">세줄아침</p>
              <p className="text-navy-500" style={{ fontSize: "12px" }}>매일 아침 3줄로 읽는 핵심 뉴스</p>
            </div>
          </div>

          <div className="grid gap-[6px]">
            <p>상호명: OOO</p>
            <p>대표자: OOO</p>
            <p>사업자등록번호: OOO-OO-OOOOO</p>
            <p>통신판매업신고번호: OOO-OO-OOOO</p>
            <p>주소: OOO</p>
            <p>이메일: OOO@OOO.COM</p>
          </div>

          <p className="mt-[12px] opacity-70" style={{ fontSize: "12px", lineHeight: "24px" }}>본 서비스는 공개된 뉴스를 AI가 요약·재가공한 정보를 제공합니다. 정보의 정확성을 보장하지 않으며, 투자·의료·법률 판단의 근거로 사용하지 마시기 바랍니다.</p>
        </div>

        {/* 오른쪽: 약관 + 관련 사이트 + 카피라이트 */}
        <div className="slm-footer__right">
          <div className="flex flex-wrap gap-x-[29px] gap-y-[12px]">
            <Link href="/terms" className="slm-footer__policy-link">이용약관</Link>
            <Link href="/terms#privacy" className="slm-footer__policy-link">개인정보처리방침</Link>
          </div>

          <div className="flex flex-wrap gap-x-[23px] gap-y-[12px]">
            {relatedSites.map((site) => (
              <a
                key={site.href}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                className="slm-footer__related-link"
              >
                {site.label}
              </a>
            ))}
          </div>

          <p className="slm-footer__copy">© 2026 세줄아침. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
