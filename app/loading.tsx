export default function Loading() {
  return (
    <div className="mx-auto w-full px-[18px] lg:px-[34px] pb-10 md:pb-20" style={{ maxWidth: "min(64rem, 1536px)" }}>
      <div className="space-y-3 pt-2 md:pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse border-b border-gray-200 pb-[18px] pt-[18px] md:rounded-xl md:border md:border-gray-200 md:bg-white md:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-gray-200" />
              <div className="h-5 w-20 rounded-full bg-gray-200" />
              <div className="ml-auto h-4 w-24 rounded bg-gray-100" />
            </div>
            <div className="h-7 w-3/4 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-full rounded bg-gray-100" />
            <div className="mt-1 h-4 w-2/3 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
