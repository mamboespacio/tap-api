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
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Algo salió mal
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {error.message || "Ocurrió un error inesperado."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        Reintentar
      </button>
    </div>
  );
}
