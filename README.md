# 세줄아침 MVP

세줄아침은 한국 사용자를 위한 간단한 아침 이메일 브리핑 서비스입니다. 사용자는 관심사 3개와 발송 시간을 선택하고, 매일 아침 정확히 3개의 생활형 요약을 이메일로 받습니다.

## 1. Proposed Folder Structure

```text
.
├─ app/
│  ├─ api/
│  │  ├─ admin/
│  │  ├─ cron/
│  │  ├─ mock-ingest/
│  │  ├─ signup/
│  │  └─ unsubscribe/
│  ├─ archive/
│  ├─ complete/
│  ├─ dashboard/
│  ├─ signup/
│  ├─ unsubscribe/
│  ├─ globals.css
│  └─ layout.tsx
├─ components/
├─ lib/
│  ├─ auth/
│  ├─ content/
│  ├─ email/
│  ├─ security/
│  ├─ supabase/
│  └─ validation/
├─ public/
├─ supabase/migrations/
├─ .env.example
└─ README.md
```

## 2. DB Schema

핵심 스키마는 [001_init.sql](/Users/kimjihyeon/Desktop/service/threeline_morning/supabase/migrations/001_init.sql)에 있습니다.

- `users`: 이메일, 발송 시간, 동의 시각, 수신 해지 상태, 비밀번호 상태를 저장합니다.
- `user_interest_selections`: 사용자별 3개 메인 관심사와 선택적 세부 관심사를 저장합니다.
- `content_items`: 원문, 요약, 액션 라인, 승인 상태, `ai_status` 캐시 결과, slug를 저장합니다.
- `daily_picks`, `daily_pick_items`: 하루 1회 생성되는 정확히 3개의 카드 구성을 저장합니다.
- `email_logs`: `unique(user_id, daily_pick_id)`로 중복 발송을 차단합니다.
- `job_logs`: 크론 실행 결과를 남깁니다.
- `unsubscribe_tokens`: 해시된 토큰만 저장합니다.
- `magic_link_tokens`, `password_reset_tokens`: 단기 만료, 단일 사용 토큰을 해시로 저장합니다.

## 3. Implementation Files

### Public pages

- `/`: 랜딩 페이지
- `/signup`: 관심사 3개, 세부 관심 1개, 이메일, 발송 시간 입력
- `/complete`: 신청 완료 화면
- `/archive`: 공개 아카이브 목록
- `/archive/[slug]`: 공개 카드 상세
- `/login`: 이메일 또는 비밀번호 로그인
- `/account`: 로그인 설정, 비밀번호 설정/변경
- `/reset-password`: 비밀번호 재설정 요청/완료
- `/unsubscribe`: 수신 해지 확인 페이지

### Admin pages

- `/dashboard/login`: 운영자 로그인
- `/dashboard`: 총 사용자 수, 총 콘텐츠 수, 최근 발송 상태
- `/dashboard/contents`: 수동 콘텐츠 등록, AI 요약, 승인/거절
- `/dashboard/users`: 사용자 목록
- `/dashboard/logs`: 이메일/작업 로그

### Server logic

- [signup route](/Users/kimjihyeon/Desktop/service/threeline_morning/app/api/signup/route.ts)
- [auth routes](/Users/kimjihyeon/Desktop/service/threeline_morning/app/api/auth)
- [admin routes](/Users/kimjihyeon/Desktop/service/threeline_morning/app/api/admin)
- [cron routes](/Users/kimjihyeon/Desktop/service/threeline_morning/app/api/cron)
- [summarizer](/Users/kimjihyeon/Desktop/service/threeline_morning/lib/content/summarize.ts)
- [email template](/Users/kimjihyeon/Desktop/service/threeline_morning/lib/email/template.tsx)

## 4. Setup Instructions

1. Node.js 20+를 준비합니다.
2. 의존성을 설치합니다.

```bash
npm install
```

3. 환경 변수를 설정합니다.

```bash
cp .env.example .env.local
```

4. Supabase SQL Editor 또는 CLI로 마이그레이션을 적용합니다.

```sql
-- supabase/migrations/001_init.sql 실행
```

5. 개발 서버를 실행합니다.

```bash
npm run dev
```

6. 운영자가 사용할 이메일과 비밀번호를 `.env.local`에 설정합니다.
7. MongoDB를 사용하는 현재 배포에서는 `MONGODB_URI`, `MONGODB_DB_NAME`을 우선 설정합니다.
8. OpenAI 키는 실제 운영에서 AI 요약을 켤 때만 넣으세요. 현재 구현은 키가 없으면 AI 호출을 하지 않습니다.
9. 카카오톡 공유를 실제로 쓰려면 `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`를 설정하세요. 키가 없으면 공유 모달의 카카오 버튼은 모바일 기본 공유 또는 링크 복사로 동작합니다.
10. Vercel cron 또는 외부 스케줄러에서 다음 두 엔드포인트를 비밀 헤더와 함께 호출합니다.

### Figma MCP

- 프로젝트 루트의 [mcp.json](/Users/kimjihyeon/Desktop/service/threeline_morning/mcp.json)에 Figma Desktop MCP 서버를 연결해두었습니다.
- Figma 데스크톱 앱에서 Dev Mode의 **Enable desktop MCP server**가 켜져 있어야 합니다.
- 기본 로컬 주소는 `http://127.0.0.1:3845/mcp` 입니다.

- `GET /api/cron/generate-daily-pick`
- `GET /api/cron/send-emails`

Vercel에서는 `CRON_SECRET` 환경 변수를 설정하면 공식 문서 기준으로 `Authorization: Bearer <CRON_SECRET>` 헤더가 자동 전달됩니다. 수동 호출이 필요하면 아래처럼 `x-cron-secret`도 지원합니다.

```text
Authorization: Bearer <CRON_SECRET>
x-cron-secret: <CRON_SECRET>
```

프로젝트에는 [vercel.json](/Users/kimjihyeon/Desktop/service/threeline_morning/vercel.json)이 포함되어 있고, 현재 스케줄은 다음과 같습니다.

- `55 21 * * *`: 매일 KST 06:55에 오늘의 3개 카드 생성
- `0 * * * *`: 매시 정각 실행, 서버가 KST 기준 `07:00 / 08:00 / 09:00` 사용자만 골라 발송

## 5. Security Checklist

- Supabase service role key는 [server-only client](/Users/kimjihyeon/Desktop/service/threeline_morning/lib/supabase/admin.ts)에서만 사용합니다.
- 클라이언트에는 비밀키를 주입하지 않습니다.
- 모든 공개/관리자 mutation은 Zod로 검증합니다.
- 가입/로그인 POST는 origin 검증과 메모리 기반 rate limit를 적용합니다.
- 가입 폼에는 honeypot 필드가 있습니다.
- 로그인은 이메일 매직 링크와 선택적 비밀번호를 함께 지원하며, 비밀번호는 해시만 저장합니다.
- 비밀번호 생성은 인증된 매직 링크 세션에서만 허용합니다.
- 비밀번호 재설정 링크는 짧은 만료 시간과 단일 사용 규칙을 가집니다.
- 관리자 페이지는 서버 쿠키 세션과 allowlist, secure comparison으로 보호합니다.
- 크론 엔드포인트는 `x-cron-secret` 없이는 실행되지 않습니다.
- 이메일 발송은 `email_logs` 유니크 제약으로 중복 발송을 막습니다.
- 수신 해지 링크는 raw token이 아닌 해시 저장 방식입니다.
- 콘텐츠 AI 요약은 `ai_status = pending`인 항목만 한 번 처리하고, 완료 결과를 재사용합니다.
- AI 생성 텍스트는 `dangerouslySetInnerHTML` 없이 plain text로만 렌더링합니다.
- 사용자-facing 에러 응답은 최소화했고, 스택 트레이스를 노출하지 않습니다.

## Notes

- 현재 rate limit는 인메모리 방식이라 단일 인스턴스 MVP 기준입니다. 멀티 인스턴스 환경에서는 Redis/Upstash 같은 외부 저장소로 교체하는 편이 안전합니다.
- 공개 아카이브 조회도 현재는 서버에서 service role을 사용하므로, 추후에는 읽기 전용 키 또는 RLS 정책으로 더 좁히는 것을 권장합니다.

## Deployment Note

- 현재 배포는 MongoDB + Resend 기반으로 동작합니다.
- OpenAI 키는 실제 운영 배포 시점까지 넣지 않는 것을 권장합니다.
- 공유 DB를 쓰는 경우 세줄아침은 `slm_` 접두어 컬렉션만 사용합니다.
