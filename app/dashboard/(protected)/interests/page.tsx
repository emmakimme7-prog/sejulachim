import { AdminInterestManager } from "@/components/admin-interest-manager";
import { getInterestConfig } from "@/lib/content/interest-config";

export const dynamic = "force-dynamic";

export default async function DashboardInterestsPage() {
  const interestConfig = await getInterestConfig();

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">관심사 관리</h2>
        <p className="mt-2 text-sm leading-7 text-navy-600">대분류 추가, 삭제, 순서 변경과 세부 관심사 편집을 여기서 관리합니다.</p>
      </div>
      <div className="mt-6">
        <AdminInterestManager
          initialCategories={interestConfig.mainInterests.map((key) => ({
            key,
            label: interestConfig.labels[key] ?? key,
            subInterests: interestConfig.subInterests[key] ?? []
          }))}
        />
      </div>
    </section>
  );
}
