/**
 * "오늘의 소식" 피드 기본 노출 순서 유틸.
 *
 * 메인 피드(ArchiveBrowser)와 우측 "전체 듣기"(FeedRightSidebar)가 같은 목록을
 * 같은 순서로 보여주도록, 두 곳에서 이 모듈을 공유한다.
 */

/** 라운드 로빈 카테고리 순서. 시간순 그대로면 같은 카테고리가 연속 노출되는 문제 방지. */
export const TODAY_ROUND_ROBIN_ORDER = ["건강", "돈", "실생활", "뉴스", "관계"] as const;

/** UTC Date를 KST(+9) 날짜 문자열 YYYY-MM-DD로 변환 */
function toKSTDateString(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/**
 * 카테고리별로 1건씩 번갈아 배치 (라운드 로빈). 버킷 내부 순서는 입력 순서를 그대로 유지하므로,
 * 호출 전에 원하는 정렬(예: published_at DESC)을 적용해 넘긴다.
 * 5개 카테고리 외 항목은 뒤에 그대로 붙인다 (안전망 — 보통 비어있음).
 */
export function orderByCategoryRoundRobin<T>(
  items: readonly T[],
  getCategory: (item: T) => string
): T[] {
  const buckets = new Map<string, T[]>();
  for (const cat of TODAY_ROUND_ROBIN_ORDER) buckets.set(cat, []);
  const others: T[] = [];
  for (const item of items) {
    const bucket = buckets.get(getCategory(item));
    if (bucket) bucket.push(item);
    else others.push(item);
  }

  const interleaved: T[] = [];
  let idx = 0;
  let pushed = true;
  while (pushed) {
    pushed = false;
    for (const cat of TODAY_ROUND_ROBIN_ORDER) {
      const next = buckets.get(cat)![idx];
      if (next !== undefined) {
        interleaved.push(next);
        pushed = true;
      }
    }
    idx += 1;
  }
  interleaved.push(...others);
  return interleaved;
}

/**
 * 오늘(KST) 발행 기사만 published_at DESC로 반환. 오늘 기사가 없으면
 * 가장 최근 날짜의 기사로 대체 (메인 피드의 todaySelectedDate fallback과 동일 규칙).
 */
export function selectLatestDayItems<T extends { published_at?: string | null }>(
  items: readonly T[]
): T[] {
  const sorted = items
    .filter((i) => i.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime());
  if (sorted.length === 0) return [];

  const todayStr = toKSTDateString(new Date());
  const todayItems = sorted.filter((i) => toKSTDateString(new Date(i.published_at!)) === todayStr);
  if (todayItems.length > 0) return todayItems;

  const latestDate = sorted.reduce((max, i) => {
    const d = toKSTDateString(new Date(i.published_at!));
    return d > max ? d : max;
  }, "");
  if (!latestDate) return [];
  return sorted.filter((i) => toKSTDateString(new Date(i.published_at!)) === latestDate);
}

/**
 * "오늘의 소식" 피드 기본 순서: 오늘(또는 최신 날짜) 기사 + 카테고리 라운드 로빈.
 * 우측 "전체 듣기" 재생목록을 메인 피드와 일치시키기 위한 진입점.
 */
export function buildTodayFeedOrder<
  T extends { published_at?: string | null }
>(items: readonly T[], getCategory: (item: T) => string): T[] {
  return orderByCategoryRoundRobin(selectLatestDayItems(items), getCategory);
}
