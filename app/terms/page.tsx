import type { Metadata } from "next";

import { SoftCard } from "@/components/ui/panel";

export const metadata: Metadata = {
  title: "이용약관 및 개인정보처리방침",
  description: "세줄아침 서비스 이용약관과 개인정보처리방침을 확인하세요.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div style={{ background: "#F0EEE9", minHeight: "100vh", padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto 24px" }}>
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
          약관
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1F1A14", letterSpacing: "-0.03em" }}>
          이용약관 · 개인정보처리방침
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 15, color: "#7A6F62", fontWeight: 500, lineHeight: 1.6 }}>
          가입 전 확인하실 수 있도록 두 내용을 한 페이지에서 나눠 보여드립니다.
        </p>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* ── 이용약관 ── */}
        <div id="terms">
          <SoftCard className="p-7">
            <h2 className="text-2xl font-bold text-gray-900">이용약관</h2>

            <div className="mt-6 space-y-8">
              <Section title="제1조 (목적)">
                본 약관은 세줄아침(이하 &ldquo;서비스&rdquo;)이 제공하는 생활형 아침 브리핑 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 관계를 규정하는 것을 목적으로 합니다.
              </Section>

              <Section title="제2조 (서비스 내용)">
                <p>세줄아침은 이메일로 생활형 아침 브리핑을 제공하는 서비스입니다. 가입 시 입력한 이메일과 관심 주제를 바탕으로 브리핑을 발송합니다.</p>
                <p>신청 당일에는 신청 시점에 첫 브리핑이 발송되며, 이후에는 사용자가 선택한 시간에 맞춰 발송됩니다.</p>
                <p>본 서비스는 공개된 뉴스를 AI가 요약·재가공한 정보를 제공합니다. 정보의 정확성을 보장하지 않으며, 투자·의료·법률 판단의 근거로 사용하지 마시기 바랍니다. 중요한 판단은 원문과 전문 기관 정보를 함께 확인해 주세요.</p>
              </Section>

              <Section title="제3조 (약관의 변경)">
                서비스는 합리적인 사유가 발생할 경우 약관을 변경할 수 있습니다. 약관이 변경될 경우 시행일 7일 전에 가입 이메일로 고지하며, 이용자가 변경된 약관에 동의하지 않을 경우 수신을 해지할 수 있습니다.
              </Section>

              <Section title="제4조 (서비스 변경 및 중단)">
                서비스는 운영상 또는 기술상의 이유로 서비스 내용을 변경하거나 일시적으로 중단할 수 있습니다. 서비스를 종료하는 경우, 종료 30일 전까지 이메일로 사전 고지합니다.
              </Section>

              <Section title="제5조 (이용자의 의무)">
                <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
                <ul className="ml-1 list-disc space-y-1 pl-5">
                  <li>타인의 정보를 도용하여 가입하는 행위</li>
                  <li>서비스 운영을 방해하는 행위</li>
                  <li>서비스에서 제공하는 콘텐츠를 무단으로 복제, 배포, 상업적으로 이용하는 행위</li>
                </ul>
              </Section>

              <Section title="제6조 (지식재산권)">
                서비스가 제공하는 콘텐츠(AI 요약 브리핑 포함)에 대한 저작권 및 지식재산권은 서비스에 귀속됩니다. 이용자는 서비스에서 제공하는 콘텐츠를 서비스 이용 목적 이외의 용도로 사용할 수 없습니다.
              </Section>

              <Section title="제7조 (책임 제한)">
                <p>서비스는 공개된 뉴스를 AI로 요약·재가공한 정보를 제공하며, 정보의 정확성·완전성을 보장하지 않습니다. 이를 근거로 한 투자·의료·법률 판단에 대한 책임은 이용자 본인에게 있습니다.</p>
                <p>서비스는 천재지변, 네트워크 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</p>
              </Section>

              <Section title="제8조 (수신 해지)">
                이용자는 언제든지 수신을 해지할 수 있으며, 해지 즉시 더 이상의 브리핑이 발송되지 않습니다.
              </Section>

              <Section title="제9조 (준거법 및 관할)">
                본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁이 발생할 경우 민사소송법상 관할 법원을 제1심 관할 법원으로 합니다.
              </Section>
            </div>
          </SoftCard>
        </div>

        {/* ── 개인정보처리방침 ── */}
        <div id="privacy">
          <SoftCard className="p-7">
            <h2 className="text-2xl font-bold text-gray-900">개인정보처리방침</h2>
            <p className="mt-3 text-base leading-8 text-gray-700">
              세줄아침(이하 &ldquo;서비스&rdquo;)은 개인정보보호법 제30조에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>

            <div className="mt-6 space-y-8">
              <Section title="1. 수집하는 개인정보 항목">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="py-2 pr-4 font-semibold text-gray-900">구분</th>
                        <th className="py-2 font-semibold text-gray-900">항목</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-b border-gray-200">
                        <td className="py-2 pr-4 font-medium">필수</td>
                        <td className="py-2">이메일 주소, 비밀번호</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 pr-4 font-medium">선택</td>
                        <td className="py-2">별명, 프로필 사진</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">자동 수집</td>
                        <td className="py-2">수신 시간 설정, 관심 주제 설정, 서비스 이용 기록</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="2. 개인정보 수집 및 이용 목적">
                <p>수집된 정보는 다음 목적에만 사용됩니다.</p>
                <ul className="ml-1 list-disc space-y-1 pl-5">
                  <li>브리핑 이메일 발송</li>
                  <li>로그인 인증 및 계정 식별</li>
                  <li>사용자 설정(수신 시간, 관심 주제) 저장</li>
                  <li>수신 해지 처리</li>
                </ul>
              </Section>

              <Section title="3. 개인정보 보유 및 파기 기간">
                <p>이용자의 개인정보는 서비스 이용 기간 동안 보유하며, 수신 해지 또는 계정 삭제 요청 시 30일 이내에 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 법령이 정한 기간 동안 보관합니다.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="py-2 pr-4 font-semibold text-gray-900">보존 항목</th>
                        <th className="py-2 pr-4 font-semibold text-gray-900">보존 근거</th>
                        <th className="py-2 font-semibold text-gray-900">보존 기간</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-b border-gray-200">
                        <td className="py-2 pr-4">전자상거래 관련 기록</td>
                        <td className="py-2 pr-4">전자상거래법</td>
                        <td className="py-2">5년</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">접속 로그</td>
                        <td className="py-2 pr-4">통신비밀보호법</td>
                        <td className="py-2">3개월</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="4. 개인정보 처리 위탁">
                <p>서비스는 원활한 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="py-2 pr-4 font-semibold text-gray-900">수탁업체</th>
                        <th className="py-2 pr-4 font-semibold text-gray-900">위탁 업무</th>
                        <th className="py-2 font-semibold text-gray-900">보유 및 이용 기간</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-b border-gray-200">
                        <td className="py-2 pr-4">Resend Inc.</td>
                        <td className="py-2 pr-4">이메일 발송</td>
                        <td className="py-2">위탁 계약 종료 시까지</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Supabase Inc.</td>
                        <td className="py-2 pr-4">데이터베이스 저장 및 인증</td>
                        <td className="py-2">위탁 계약 종료 시까지</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="5. 개인정보의 제3자 제공">
                <p>서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다.</p>
                <ul className="ml-1 list-disc space-y-1 pl-5">
                  <li>법령의 규정에 따라 수사기관 등에 제공하는 경우</li>
                  <li>이용자의 사전 동의가 있는 경우</li>
                </ul>
              </Section>

              <Section title="6. 이용자의 권리">
                <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
                <ul className="ml-1 list-disc space-y-1 pl-5">
                  <li>개인정보 열람 요청</li>
                  <li>개인정보 수정 및 삭제 요청</li>
                  <li>수신 해지 및 처리 정지 요청</li>
                </ul>
                <p className="mt-2">권리 행사는 아래 개인정보 보호책임자 이메일로 요청하시면 10일 이내에 처리합니다.</p>
              </Section>

              <Section title="7. 개인정보 보호책임자">
                <p>개인정보 처리와 관련한 문의, 불만, 피해 구제는 아래로 연락해 주세요.</p>
                <p className="mt-1 font-medium">이메일: studiobyyou0@gmail.com</p>
              </Section>

              <Section title="8. 개인정보처리방침 변경">
                <p>본 방침은 법령·정책 변경에 따라 개정될 수 있으며, 변경 시 이메일로 사전 고지합니다.</p>
                <p className="mt-2 text-sm text-gray-600">시행일: 2026년 4월 9일</p>
              </Section>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <div className="mt-2 space-y-2 text-base leading-8 text-gray-700">{children}</div>
    </section>
  );
}
