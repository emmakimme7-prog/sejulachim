type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardLoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const localAdminEmail = process.env.ADMIN_EMAIL_ALLOWLIST?.split(",")[0]?.trim() || "admin@example.com";
  const localAdminPassword = process.env.ADMIN_PASSWORD?.trim() || "localadmin1234";

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <div className="rounded-[32px] bg-white p-10 shadow-calm ring-1 ring-navy-100">
        <p className="text-sm font-semibold tracking-[0.18em] text-orange-500">ADMIN LOGIN</p>
        <h1 className="mt-4 text-3xl font-extrabold text-navy-900">운영자 로그인</h1>
        {error === "invalid" ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            운영자 이메일 또는 비밀번호를 다시 확인해주세요.
          </p>
        ) : null}
        {error === "rate" ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.
          </p>
        ) : null}
        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-4 rounded-2xl bg-navy-50 px-4 py-3 text-sm font-semibold text-navy-700">
            로컬 개발용 계정: <span className="font-bold">{localAdminEmail}</span>
            <br />
            로컬 개발용 비밀번호: <span className="font-bold">{localAdminPassword}</span>
          </div>
        ) : null}
        <form method="post" action="/api/admin/login" className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-navy-700">이메일</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-navy-100 px-4 py-4 outline-none focus:border-orange-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-navy-700">비밀번호</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-navy-100 px-4 py-4 outline-none focus:border-orange-500"
            />
          </label>
          <button className="w-full rounded-full bg-navy-900 px-6 py-4 font-semibold text-white">로그인</button>
        </form>
      </div>
    </div>
  );
}
