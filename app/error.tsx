"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold text-red-600">오류가 발생했습니다</h2>
      <p className="max-w-md text-sm text-gray-600">{error.message}</p>
      {error.digest ? (
        <p className="text-xs text-gray-400">Digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-gray-900 px-6 py-2 text-white hover:bg-gray-800"
      >
        다시 시도
      </button>
    </div>
  );
}
