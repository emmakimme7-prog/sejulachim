import { HomeHeroSettingsForm } from "@/components/home-hero-settings-form";
import { getHomeHeroSettings } from "@/lib/mongodb/site-settings";

export const dynamic = "force-dynamic";

export default async function DashboardHomepagePage() {
  const settings = await getHomeHeroSettings();

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-calm ring-1 ring-navy-100">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">메인 설정</h2>
        <p className="mt-2 text-sm leading-7 text-navy-600">메인 이미지, 타이틀, 설명글을 여기서 바꾸면 첫 화면에 바로 반영됩니다.</p>
      </div>

      <div className="mt-6">
        <HomeHeroSettingsForm initialSettings={settings} />
      </div>
    </section>
  );
}
