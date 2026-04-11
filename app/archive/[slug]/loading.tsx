export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-0 xl:pt-4 pb-8 animate-pulse">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-6 w-20 rounded-full bg-gray-200" />
        <div className="h-5 w-28 rounded bg-gray-100" />
      </div>
      <div className="h-9 w-4/5 rounded bg-gray-200" />
      <div className="mt-4 aspect-[16/9] w-full rounded-lg bg-gray-200" />
      <div className="mt-6 space-y-3">
        <div className="h-5 w-full rounded bg-gray-100" />
        <div className="h-5 w-full rounded bg-gray-100" />
        <div className="h-5 w-3/4 rounded bg-gray-100" />
      </div>
    </div>
  );
}
