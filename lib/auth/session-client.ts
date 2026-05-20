/**
 * Client-side session fetch — module-level cache.
 *
 * 페이지 mount 시 여러 컴포넌트 (home-content / site-header / home-redirect-gate /
 * complete-share-button) 가 동시에 /api/auth/session 을 호출해 한 페이지에서
 * 4~11회 polling 이 발생하던 이슈 (QA 발견).
 *
 * 정책:
 *   - 첫 호출만 실제 fetch. 진행 중 호출은 같은 Promise share.
 *   - 성공 후엔 메모리 캐시 (TTL 30초) — 짧은 시간 내 재호출은 추가 fetch X.
 *   - TTL 만료 후 새 호출 시 재 fetch (세션 만료/로그인 변경 대응).
 *   - invalidateSession() 으로 강제 무효화 가능 (로그아웃 후 등).
 *
 * 반환: { session: { id: string; ... } } 형태의 raw API 응답. session 없으면 null/undefined.
 */

type SessionResponse = { session?: unknown } | null;

const CACHE_TTL_MS = 30_000;

let cachedResult: SessionResponse | null = null;
let cachedAt = 0;
let inFlight: Promise<SessionResponse> | null = null;

async function doFetch(): Promise<SessionResponse> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionResponse;
  } catch {
    return null;
  }
}

/**
 * 세션 조회 (캐시 우선).
 *   - 캐시 valid → 즉시 반환
 *   - in-flight → 진행 중 Promise share
 *   - 없음 → 새 fetch
 */
export async function fetchSessionCached(): Promise<SessionResponse> {
  const now = Date.now();
  if (cachedResult !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedResult;
  }
  if (inFlight) {
    return inFlight;
  }

  inFlight = doFetch().then((result) => {
    cachedResult = result;
    cachedAt = Date.now();
    inFlight = null;
    return result;
  });
  return inFlight;
}

/**
 * 캐시 무효화 — 로그아웃 / 가입 직후 등에서 호출.
 * 다음 fetchSessionCached() 호출은 실제 네트워크 fetch.
 */
export function invalidateSessionCache(): void {
  cachedResult = null;
  cachedAt = 0;
}
