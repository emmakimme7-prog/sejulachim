import { redirect } from "next/navigation";

export default async function ArchivePage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; category?: string; mode?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  if (typeof resolvedSearchParams.q === "string" && resolvedSearchParams.q.trim()) {
    query.set("q", resolvedSearchParams.q.trim());
  }

  if (typeof resolvedSearchParams.category === "string" && resolvedSearchParams.category.trim()) {
    query.set("category", resolvedSearchParams.category.trim());
  }

  if (typeof resolvedSearchParams.mode === "string" && resolvedSearchParams.mode.trim()) {
    query.set("mode", resolvedSearchParams.mode.trim());
  }

  const destination = query.toString() ? `/?${query.toString()}` : "/";
  redirect(destination);
}
