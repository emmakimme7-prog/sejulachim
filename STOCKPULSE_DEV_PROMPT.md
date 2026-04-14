# StockPulse 개발 프롬프트

## 프로젝트 개요
개인용 주식 알림 대시보드. PC에서 상시 실행하며, 한국/미국 주식 데이터를 수집 → 기술적 분석 → 카카오톡 나에게 보내기로 알림 전송.

## 기술 스택
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS (다크모드 기본)
- **DB**: SQLite (better-sqlite3) — 로컬 파일 DB
- **스케줄러**: node-cron
- **차트**: recharts
- **스크래핑**: cheerio + axios (네이버증권), yahoo-finance2 (미국주식)
- **알림**: Kakao REST API (나에게 보내기)

## 디렉토리 구조
```
stockpulse/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 대시보드 메인
│   ├── api/
│   │   ├── stocks/
│   │   │   ├── search/route.ts     # GET - 종목 검색 (네이버/야후)
│   │   │   ├── price/route.ts      # GET - 실시간 가격 조회
│   │   │   └── history/route.ts    # GET - 히스토리컬 데이터
│   │   ├── watchlist/
│   │   │   └── route.ts            # GET/POST/DELETE - 관심종목 CRUD
│   │   ├── portfolio/
│   │   │   └── route.ts            # GET/POST/PUT/DELETE - 포트폴리오 CRUD
│   │   ├── signals/
│   │   │   └── route.ts            # GET - 매매 시그널 조회
│   │   ├── alerts/
│   │   │   ├── rules/route.ts      # GET/PUT - 알림 규칙 설정
│   │   │   └── history/route.ts    # GET - 알림 발송 이력
│   │   └── kakao/
│   │       ├── auth/route.ts       # GET - OAuth 인증 시작
│   │       ├── callback/route.ts   # GET - OAuth 콜백
│   │       └── send/route.ts       # POST - 나에게 보내기 발송
│   └── settings/
│       └── page.tsx                # 설정 페이지 (카카오 연동, 알림 규칙)
├── components/
│   ├── dashboard/
│   │   ├── MarketIndices.tsx
│   │   ├── SignalSummary.tsx
│   │   └── PortfolioSummary.tsx
│   ├── watchlist/
│   │   ├── WatchlistCard.tsx
│   │   ├── AddStockModal.tsx
│   │   └── StockDetail.tsx
│   ├── portfolio/
│   │   ├── PortfolioTable.tsx
│   │   ├── AddPortfolioModal.tsx
│   │   └── WeightChart.tsx
│   ├── signals/
│   │   ├── SignalCard.tsx
│   │   └── SignalBadge.tsx
│   ├── charts/
│   │   ├── PriceChart.tsx
│   │   ├── VolumeChart.tsx
│   │   └── Sparkline.tsx
│   └── ui/
│       ├── Modal.tsx
│       ├── Badge.tsx
│       └── Toggle.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts                # SQLite 연결
│   │   ├── schema.ts               # 테이블 생성
│   │   └── queries.ts              # CRUD 쿼리
│   ├── data/
│   │   ├── naver.ts                # 네이버증권 스크래핑
│   │   ├── yahoo.ts                # Yahoo Finance API
│   │   ├── alphavantage.ts         # Alpha Vantage (보조)
│   │   └── finnhub.ts              # Finnhub (보조)
│   ├── analysis/
│   │   ├── indicators.ts           # RSI, MACD, 이동평균, 볼린저밴드
│   │   ├── signals.ts              # 매매 시그널 생성 로직
│   │   └── patterns.ts             # 캔들패턴 감지 (선택)
│   ├── notifications/
│   │   ├── kakao.ts                # 카카오톡 나에게 보내기
│   │   └── templates.ts            # 알림 메시지 템플릿
│   └── scheduler/
│       └── index.ts                # node-cron 스케줄러
├── scripts/
│   └── init-db.ts                  # DB 초기화 스크립트
├── stockpulse.db                   # SQLite DB 파일 (gitignore)
└── .env.local
```

## DB 스키마 (SQLite)

```sql
-- 관심종목
CREATE TABLE watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  market TEXT NOT NULL CHECK(market IN ('KRX', 'NASDAQ', 'NYSE')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 포트폴리오
CREATE TABLE portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  market TEXT NOT NULL,
  qty INTEGER NOT NULL,
  avg_price REAL NOT NULL,
  target_price REAL,
  stop_loss REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 가격 히스토리 (캐시)
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  date TEXT NOT NULL,
  open REAL, high REAL, low REAL, close REAL,
  volume INTEGER,
  UNIQUE(code, date)
);

-- 매매 시그널 이력
CREATE TABLE signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('buy', 'sell', 'hold')),
  reason TEXT NOT NULL,
  strength TEXT CHECK(strength IN ('strong', 'medium', 'weak')),
  price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 알림 규칙
CREATE TABLE alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 1
);

-- 알림 발송 이력
CREATE TABLE alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id INTEGER REFERENCES signals(id),
  channel TEXT DEFAULT 'kakao',
  status TEXT CHECK(status IN ('sent', 'failed')),
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 카카오 토큰
CREATE TABLE kakao_token (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  access_token TEXT,
  refresh_token TEXT,
  expires_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 무료 데이터 소스 연동 상세

### 1. 네이버증권 (한국주식)
```typescript
// lib/data/naver.ts
// 실시간 시세: https://finance.naver.com/item/main.naver?code=005930
// 일별 시세: https://finance.naver.com/item/sise_day.naver?code=005930
// 종목 검색: https://ac.finance.naver.com/ac?q=삼성&q_enc=euc-kr&t_koreng=1&st=111&r_lt=111
// cheerio로 파싱. 현재가, 전일비, 거래량, 시가, 고가, 저가 추출.
// 시장지수: https://finance.naver.com/sise/sise_index.naver?code=KOSPI
```

### 2. Yahoo Finance (미국주식)
```typescript
// lib/data/yahoo.ts
// npm install yahoo-finance2
// import yahooFinance from 'yahoo-finance2';
// yahooFinance.quote('NVDA') → 실시간 시세
// yahooFinance.historical('NVDA', { period1: '2024-01-01' }) → 히스토리컬
// 무료, 별도 API키 불필요, 15분 지연 가능
```

### 3. Alpha Vantage (보조)
```
// 무료 키: https://www.alphavantage.co/support/#api-key
// 25콜/일 제한. 기술지표 API 제공 (RSI, MACD 등)
// 한국주식 미지원 → 미국주식 기술지표 보조용으로만 사용
```

### 4. Finnhub (보조)
```
// 무료 키: https://finnhub.io/register
// 60콜/분. 미국주식 실시간 시세, 뉴스, 기업정보
// 웹소켓 지원 → 실시간 가격 스트리밍 가능
```

## 기술적 분석 지표 구현

```typescript
// lib/analysis/indicators.ts

// RSI (Relative Strength Index) - 14일 기본
function calculateRSI(prices: number[], period = 14): number

// MACD (12, 26, 9)
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number }

// 이동평균 (5일, 20일, 60일, 120일)
function calculateMA(prices: number[], period: number): number

// 볼린저 밴드 (20일, 2 표준편차)
function calculateBollinger(prices: number[]): { upper: number; middle: number; lower: number }

// 골든크로스 / 데드크로스 감지
function detectCross(ma5: number[], ma20: number[]): 'golden' | 'dead' | null

// 거래량 급증 감지 (평균 대비 N배 이상)
function detectVolumeSpike(volumes: number[], threshold = 3): boolean
```

## 매매 시그널 생성 로직

```typescript
// lib/analysis/signals.ts

interface Signal {
  code: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  reason: string;
  strength: 'strong' | 'medium' | 'weak';
  price: number;
}

// 매수 시그널 조건:
// [강력] RSI 30 이하 + MACD 골든크로스
// [강력] 골든크로스 + 거래량 200% 이상
// [보통] RSI 30 이하 단독
// [보통] 골든크로스 단독
// [약함] 볼린저밴드 하단 터치

// 매도 시그널 조건:
// [강력] RSI 70 이상 + MACD 데드크로스
// [강력] 목표가 도달
// [보통] RSI 70 이상 단독
// [보통] 데드크로스 단독
// [약함] 볼린저밴드 상단 터치
// [강력] 손절가 도달 → 즉시 알림

// 포트폴리오 종목 추가 체크:
// 목표가 95% 도달 → 매도 준비 알림
// 손절가 105% 근접 → 손절 경고 알림
```

## 카카오톡 나에게 보내기 연동

```typescript
// lib/notifications/kakao.ts

// 1. 카카오 디벨로퍼스 앱 등록 (https://developers.kakao.com)
// 2. REST API 키 발급
// 3. Redirect URI 등록: http://localhost:3000/api/kakao/callback
// 4. 동의항목: talk_message (나에게 보내기)

// OAuth 인증 플로우:
// GET https://kauth.kakao.com/oauth/authorize?client_id={REST_API_KEY}&redirect_uri={REDIRECT}&response_type=code&scope=talk_message
// → 콜백에서 code → access_token 교환
// → refresh_token으로 자동 갱신

// 나에게 보내기 API:
// POST https://kapi.kakao.com/v2/api/talk/memo/default/send
// Headers: Authorization: Bearer {access_token}
// Body: template_object (텍스트 or 피드 타입)
```

### 알림 메시지 템플릿
```typescript
// lib/notifications/templates.ts

// 매수 시그널 알림
const buyTemplate = (signal) => ({
  object_type: 'text',
  text: `🟢 매수 시그널\n\n${signal.symbol} (${signal.code})\n현재가: ${signal.price}\n\n사유: ${signal.reason}\n강도: ${signal.strength}\n\n⏰ ${new Date().toLocaleTimeString('ko-KR')}`,
  link: { web_url: 'http://localhost:3000', mobile_web_url: 'http://localhost:3000' }
});

// 매도 시그널 알림
const sellTemplate = (signal) => ({
  object_type: 'text',
  text: `🔴 매도 시그널\n\n${signal.symbol} (${signal.code})\n현재가: ${signal.price}\n\n사유: ${signal.reason}\n강도: ${signal.strength}\n\n⏰ ${new Date().toLocaleTimeString('ko-KR')}`,
  link: { web_url: 'http://localhost:3000', mobile_web_url: 'http://localhost:3000' }
});

// 일일 리포트
const dailyReportTemplate = (portfolio) => ({
  object_type: 'text',
  text: `📊 일일 포트폴리오 리포트\n\n총 투자금: ${portfolio.totalInvested}\n총 평가금: ${portfolio.totalCurrent}\n일간 수익: ${portfolio.dailyPnl} (${portfolio.dailyPnlPct}%)\n\n${portfolio.items.map(i => `${i.symbol}: ${i.pnlPct}%`).join('\n')}`,
  link: { web_url: 'http://localhost:3000', mobile_web_url: 'http://localhost:3000' }
});
```

## 스케줄러 설정

```typescript
// lib/scheduler/index.ts
import cron from 'node-cron';

// 평일 오전 08:30 - 한국장 개장 전 분석
cron.schedule('30 8 * * 1-5', () => analyzeKRX());

// 평일 장중 30분 간격 (09:00~15:30) - 한국 보유종목 모니터링
cron.schedule('*/30 9-15 * * 1-5', () => monitorPortfolioKRX());

// 평일 밤 22:00 - 미국장 프리마켓 분석
cron.schedule('0 22 * * 1-5', () => analyzeUS());

// 평일 밤 23:30~05:00 30분 간격 - 미국 보유종목 모니터링
cron.schedule('*/30 23,0-5 * * 1-5', () => monitorPortfolioUS());

// 평일 16:00 - 한국장 마감 일일 리포트
cron.schedule('0 16 * * 1-5', () => sendDailyReport());

// 매일 06:00 - 가격 데이터 캐시 업데이트
cron.schedule('0 6 * * *', () => updatePriceCache());
```

## 환경변수 (.env.local)

```
# 카카오
KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI=http://localhost:3000/api/kakao/callback

# Alpha Vantage (무료)
ALPHA_VANTAGE_API_KEY=

# Finnhub (무료)
FINNHUB_API_KEY=

# 앱
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DB_PATH=./stockpulse.db
```

## 구현 순서

### Phase 1: 기본 인프라 (Day 1)
1. Next.js 프로젝트 생성
2. SQLite DB 세팅 + 스키마 생성
3. 기본 레이아웃 + 다크모드 UI

### Phase 2: 데이터 수집 (Day 2)
4. 네이버증권 스크래핑 (한국 시세/검색)
5. yahoo-finance2 연동 (미국 시세/히스토리)
6. 종목 검색 API (통합)
7. 가격 히스토리 캐시 시스템

### Phase 3: 핵심 기능 (Day 3)
8. 관심종목 CRUD + UI
9. 포트폴리오 CRUD + UI
10. 기술적 분석 지표 계산 (RSI, MACD, MA)
11. 매매 시그널 생성 엔진

### Phase 4: 알림 시스템 (Day 4)
12. 카카오톡 OAuth 연동
13. 나에게 보내기 API 연동
14. 알림 규칙 설정 UI
15. node-cron 스케줄러 세팅

### Phase 5: 완성 (Day 5)
16. 대시보드 (시장지수, 시그널 요약, 포트폴리오 요약)
17. 종목 상세 차트 (가격/거래량/지표)
18. 일일 리포트 자동 발송
19. 에러 핸들링 + 로깅

## UI 참고
stock-dashboard.html 파일 참조. 다크모드 기반, 4개 탭 구조 (대시보드/관심종목/포트폴리오/시그널). 종목 추가 모달, 알림 규칙 설정 모달 포함.

## 주의사항
- 개인용이므로 인증/권한 불필요
- 네이버증권 스크래핑 시 요청 간격 1초 이상 유지 (IP 차단 방지)
- 카카오 토큰 자동 갱신 로직 필수 (refresh_token 만료 전 갱신)
- SQLite는 동시 쓰기 제한 → WAL 모드 활성화
- 장 휴일(공휴일) 체크 로직 추가 권장
