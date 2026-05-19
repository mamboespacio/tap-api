"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Error al cargar esta sección
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {error.message || "No se pudo cargar la página. Intentá de nuevo o volvé al inicio."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
