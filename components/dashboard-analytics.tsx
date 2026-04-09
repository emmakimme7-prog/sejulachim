"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Eye, Monitor, Smartphone, Tablet, TrendingUp, Users } from "lucide-react";

type AnalyticsData = {
  realtime: number;
  today: { visitors: number; pageviews: number };
  dailyTrend: Array<{ date: string; visitors: number; pageviews: number }>;
  topPages: Array<{ path: string; count: number }>;
  topReferrers: Array<{ domain: string; count: number }>;
  deviceCounts: { mobile: number; tablet: number; desktop: number };
  topCountries: Array<{ country: string; count: number }>;
  topUtmSources: Array<{ source: string; count: number }>;
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-[22px] border border-navy-100 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-500">{label}</p>
          <p className="text-2xl font-extrabold text-navy-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
          {sub ? <p className="text-xs text-navy-400">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data, metric }: { data: AnalyticsData["dailyTrend"]; metric: "visitors" | "pageviews" }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d[metric]), 1);

  return (
    <div className="flex items-end gap-1" style={{ height: 120 }}>
      {data.map((d) => {
        const h = Math.max((d[metric] / max) * 100, 2);
        return (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center">
            <div
              className="w-full min-w-[6px] rounded-t-md bg-orange-400 transition-all hover:bg-orange-500"
              style={{ height: `${h}%` }}
            />
            <span className="mt-1 text-[10px] text-navy-400">{d.date.slice(5)}</span>
            <div className="pointer-events-none absolute -top-8 rounded bg-navy-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
              {d[metric]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleBar({ label, count, max, color = "bg-orange-400" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="group relative w-36 shrink-0">
        <span className="block truncate text-sm text-navy-700">{label}</span>
        <div className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-lg bg-navy-900 px-3 py-1.5 text-xs text-white shadow-lg group-hover:block">
          {label}
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-full bg-navy-50" style={{ height: 8 }}>
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-bold text-navy-800">{count}</span>
    </div>
  );
}


const COUNTRY_NAMES: Record<string, string> = {
  KR: "한국", US: "미국", JP: "일본", CN: "중국", DE: "독일",
  GB: "영국", FR: "프랑스", CA: "캐나다", AU: "호주", SG: "싱가포르",
  TW: "대만", HK: "홍콩", TH: "태국", VN: "베트남", IN: "인도",
};

export function DashboardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`, { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return <div className="py-20 text-center text-navy-400">데이터를 불러오는 중...</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-navy-400">데이터를 불러올 수 없습니다.</div>;
  }

  const totalDevices = (data.deviceCounts?.mobile ?? 0) + (data.deviceCounts?.tablet ?? 0) + (data.deviceCounts?.desktop ?? 0);
  const maxReferrer = Math.max(...(data.topReferrers?.map((r) => r.count) ?? [0]), 1);
  const maxCountry = Math.max(...(data.topCountries?.map((c) => c.count) ?? [0]), 1);

  return (
    <div className="space-y-8">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="실시간 접속자"
          value={data.realtime}
          sub="최근 5분"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Users}
          label="오늘 방문자"
          value={data.today.visitors}
          sub="순 방문자 (세션)"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Eye}
          label="오늘 페이지뷰"
          value={data.today.pageviews}
          sub="전체 페이지뷰"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="페이지당 평균"
          value={data.today.visitors > 0 ? (data.today.pageviews / data.today.visitors).toFixed(1) : "0"}
          sub="PV / 방문자"
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* 일별 추이 */}
      <div className="rounded-[22px] border border-navy-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-900">일별 추이</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod("7d")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                period === "7d" ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-600 hover:bg-navy-100"
              }`}
            >
              7일
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                period === "30d" ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-600 hover:bg-navy-100"
              }`}
            >
              30일
            </button>
          </div>
        </div>
        <div className="mb-2 text-sm font-semibold text-navy-500">방문자</div>
        <TrendChart data={data.dailyTrend} metric="visitors" />
        <div className="mb-2 mt-6 text-sm font-semibold text-navy-500">페이지뷰</div>
        <TrendChart data={data.dailyTrend} metric="pageviews" />
      </div>

      {/* 오늘 인기 페이지 + 유입 출처 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[22px] border border-navy-100 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-navy-900">오늘 인기 페이지 TOP 10</h3>
          {data.topPages.length === 0 ? (
            <p className="text-sm text-navy-400">아직 데이터가 없습니다.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="pb-2 font-semibold text-navy-500">#</th>
                  <th className="pb-2 font-semibold text-navy-500">페이지</th>
                  <th className="pb-2 text-right font-semibold text-navy-500">조회수</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((page, i) => (
                  <tr key={page.path} className="border-b border-navy-50 last:border-0">
                    <td className="py-2.5 font-bold text-navy-400">{i + 1}</td>
                    <td className="max-w-[180px] truncate py-2.5 font-medium text-navy-800">{page.path}</td>
                    <td className="py-2.5 text-right font-bold text-orange-600">{page.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-[22px] border border-navy-100 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-navy-900">오늘 유입 출처</h3>
          {!data.topReferrers?.length ? (
            <p className="text-sm text-navy-400">아직 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {data.topReferrers.map((r) => (
                <SimpleBar key={r.domain} label={r.domain} count={r.count} max={maxReferrer} />
              ))}
            </div>
          )}
          {data.topUtmSources && data.topUtmSources.length > 0 ? (
            <div className="mt-5 border-t border-navy-50 pt-5">
              <p className="mb-3 text-sm font-semibold text-navy-500">UTM Source</p>
              <div className="space-y-3">
                {data.topUtmSources.map((u) => (
                  <SimpleBar key={u.source} label={u.source} count={u.count} max={data.topUtmSources[0]?.count ?? 1} color="bg-blue-400" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 디바이스 + 국가 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 디바이스 */}
        <div className="rounded-[22px] border border-navy-100 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-navy-900">오늘 디바이스</h3>
          {totalDevices === 0 ? (
            <p className="text-sm text-navy-400">아직 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {[
                { key: "mobile", label: "모바일", icon: Smartphone, color: "text-orange-500" },
                { key: "desktop", label: "데스크탑", icon: Monitor, color: "text-blue-500" },
                { key: "tablet", label: "태블릿", icon: Tablet, color: "text-purple-500" },
              ].map(({ key, label, icon: Icon, color }) => {
                const count = data.deviceCounts?.[key as keyof typeof data.deviceCounts] ?? 0;
                const pct = totalDevices > 0 ? ((count / totalDevices) * 100).toFixed(0) : "0";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                    <span className="w-20 text-sm text-navy-700">{label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-navy-50" style={{ height: 8 }}>
                      <div
                        className={`h-full rounded-full transition-all ${key === "mobile" ? "bg-orange-400" : key === "desktop" ? "bg-blue-400" : "bg-purple-400"}`}
                        style={{ width: `${(count / totalDevices) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-sm font-bold text-navy-800">{count} <span className="font-normal text-navy-400">({pct}%)</span></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 국가 */}
        <div className="rounded-[22px] border border-navy-100 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-navy-900">오늘 국가 TOP 5</h3>
          {!data.topCountries?.length ? (
            <p className="text-sm text-navy-400">아직 데이터가 없습니다.<br /><span className="text-xs">국가 데이터는 Vercel 배포 환경에서만 수집됩니다.</span></p>
          ) : (
            <div className="space-y-3">
              {data.topCountries.map((c) => (
                <SimpleBar
                  key={c.country}
                  label={`${COUNTRY_NAMES[c.country] ?? c.country} (${c.country})`}
                  count={c.count}
                  max={maxCountry}
                  color="bg-green-400"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-navy-400">30초마다 자동 갱신됩니다</p>
    </div>
  );
}
