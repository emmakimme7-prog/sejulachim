import { DashboardAnalytics } from "@/components/dashboard-analytics";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold tracking-[0.16em] text-orange-500">ANALYTICS</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-navy-900">방문자 분석</h1>
        <p className="mt-2 text-base text-navy-500">실시간 접속자, 일별 방문 추이, 인기 페이지를 확인합니다.</p>
      </div>
      <DashboardAnalytics />
    </div>
  );
}
