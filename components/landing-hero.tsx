import { Sun } from "lucide-react";
import Link from "next/link";
import { HeroListenButton } from "@/components/hero-listen-button";

type PreviewItem = {
  category: string;
  title: string;
  slug: string;
  short_summary?: string;
};

const CATEGORY_EMOJI: Record<string, string> = {
  건강: "💪",
  돈: "💰",
  실생활: "🏠",
  뉴스: "📰",
  관계: "💛",
};

export function LandingHero({ previews }: { previews: PreviewItem[] }) {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="slm-hero">
        <div className="slm-hero__particles">
          <div className="slm-hero__particle" />
          <div className="slm-hero__particle" />
          <div className="slm-hero__particle" />
          <div className="slm-hero__particle" />
          <div className="slm-hero__particle" />
          <div className="slm-hero__particle" />
        </div>

        <div className="slm-hero__inner">
          <div className="slm-hero__badge">매일 아침 업데이트</div>

          <h1 className="slm-hero__title">
            아침에 <span className="slm-hero__highlight">세 줄</span>이면
            <br />
            오늘 하루가 보입니다
          </h1>

          <p className="slm-hero__sub">
            건강, 돈, 실생활, 뉴스, 관계 —
            <br />
            5가지 분야의 핵심 소식을
            <br />
            매일 아침 딱 세 줄로 정리해 드립니다.
          </p>

          <div className="slm-hero__listen-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            읽기 귀찮을 땐? 소리로 들으세요
          </div>

          {/* 오늘의 세줄 미리보기 */}
          {previews.length > 0 ? (
            <div className="slm-hero__preview">
              <div className="slm-hero__preview-header">
                <div className="slm-hero__preview-header-left">
                  <div className="slm-hero__preview-dot" />
                  오늘의 세줄 미리보기
                </div>
                <HeroListenButton previews={previews} />
              </div>
              {previews.map((item, idx) => (
                <Link
                  key={item.slug}
                  href={`/archive/${item.slug}`}
                  className="slm-hero__preview-line"
                >
                  <div className="slm-hero__preview-top">
                    <div className="slm-hero__preview-num">{idx + 1}</div>
                    <span className="slm-hero__preview-tag">
                      {CATEGORY_EMOJI[item.category] ?? ""} {item.category}
                    </span>
                  </div>
                  <p className="slm-hero__preview-text">{item.title}</p>
                </Link>
              ))}
            </div>
          ) : null}

          {/* CTA */}
          <div className="slm-hero__cta">
            <p className="slm-hero__cta-label">매일 아침, 세 줄을 받아보세요</p>
            <div className="slm-hero__cta-buttons">
              <Link href="/signup" className="slm-hero__cta-btn slm-hero__cta-email">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 6 10-6" /></svg>
                무료 구독 신청하기
              </Link>
            </div>
            <div className="slm-hero__trust">
              <div className="slm-hero__trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                무료 구독
              </div>
              <div className="slm-hero__trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                1분이면 충분
              </div>
              <div className="slm-hero__trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                소리로 듣기
              </div>
              <div className="slm-hero__trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                언제든 구독 해지
              </div>
            </div>
          </div>

          <div className="slm-hero__scroll">
            더 알아보기
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="slm-how">
        <h2>이렇게 쉽습니다</h2>
        <p className="slm-how__sub">복잡한 뉴스, 세줄아침이 대신 읽어드립니다</p>
        <div className="slm-how__grid">
          <div className="slm-how__card">
            <div className="slm-how__icon" style={{ background: "#FFF3E6" }}><Sun className="w-8 h-8 text-orange-400" /></div>
            <h3>아침에 도착</h3>
            <p>매일 아침,<br />카톡 또는 이메일로<br />세 줄 브리핑이 도착합니다</p>
          </div>
          <div className="slm-how__card">
            <div className="slm-how__icon" style={{ background: "#F0F7FF" }}>3</div>
            <h3>세 줄로 핵심만</h3>
            <p>긴 기사 대신<br />핵심만 세 줄로.<br />1분이면 오늘을 파악합니다</p>
          </div>
          <div className="slm-how__card">
            <div className="slm-how__icon" style={{ background: "#FFF0F5" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8650A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            </div>
            <h3>소리로 들으세요</h3>
            <p>바쁜 출근길에도<br />듣기 버튼 하나로<br />귀로 편하게 들을 수 있습니다</p>
          </div>
          <div className="slm-how__card">
            <div className="slm-how__icon" style={{ background: "#F5FFF0" }}>+</div>
            <h3>더 보고 싶으면</h3>
            <p>관심 있는 소식은<br />탭 한 번으로<br />자세히 읽을 수 있습니다</p>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="slm-cats">
        <h2>관심 분야만 골라 받으세요</h2>
        <div className="slm-cats__grid">
          {Object.entries(CATEGORY_EMOJI).map(([cat, emoji]) => (
            <div key={cat} className="slm-cats__chip">
              <span className="slm-cats__emoji">{emoji}</span> {cat}
            </div>
          ))}
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="slm-bottom-cta">
        <h2>내일 아침부터 시작하세요</h2>
        <p>지금 구독하면, 내일 아침 첫 번째 세줄이 도착합니다</p>
        <div className="slm-hero__cta-buttons">
          <Link href="/signup" className="slm-hero__cta-btn slm-hero__cta-email" style={{ background: "#fff", color: "#1a1a2e" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 6 10-6" /></svg>
            무료 구독 신청하기
          </Link>
        </div>
      </section>
    </>
  );
}
