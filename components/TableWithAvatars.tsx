import * as React from "react";

// Minimal, dependency-free table styled with Tailwind CSS
// Inspired by Tailwind UI Blocks → Lists → Tables → "With avatars and multi-line content"
// Drop this file into your project and render <TableWithAvatars rows={...} onRowClick={...} />

export type TableRow = {
  id: string | number;
  name: string;
  email?: string;
  title?: string; // e.g., "Product Designer"
  team?: string;  // e.g., "Design"
  status?: "active" | "inactive" | "vacation" | string;
  avatarUrl?: string;
  lastSeen?: string; // e.g., "2h ago"
};

export function TableWithAvatars({
  rows,
  onRowClick,
  actions,
  footer,
  caption = "",
}: {
  rows: TableRow[];
  onRowClick?: (row: TableRow) => void;
  actions?: (row: TableRow) => React.ReactNode; // return action buttons per row
  footer?: React.ReactNode; // optional pagination / summary
  caption?: string;
}) {
  return (
    <div className="">
      <div className="sm:flex sm:items-center sm:justify-between">
        {caption ? (
          <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
            {caption}
          </h2>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 sm:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Title</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Last seen</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/60">
                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-none overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.avatarUrl} alt={row.name} className="h-10 w-10 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center text-xs font-medium text-gray-500">
                          {initials(row.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
                      {row.email ? (
                        <div className="mt-0.5 truncate text-gray-500 dark:text-gray-400">{row.email}</div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="text-gray-900 dark:text-gray-100">{row.title ?? "—"}</div>
                  {row.team ? (
                    <div className="mt-0.5 text-gray-500 dark:text-gray-400">{row.team}</div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <StatusBadge value={row.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{row.lastSeen ?? "—"}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                  {actions ? (
                    <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                  ) : (
                    <button
                      onClick={() => onRowClick?.(row)}
                      className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      View
                      <span className="sr-only">, {row.name}</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul role="list" className="mt-4 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800 sm:hidden">
        {rows.map((row) => (
          <li key={row.id} className="bg-white px-4 py-4 dark:bg-gray-950">
            <button onClick={() => onRowClick?.(row)} className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-none overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                  {row.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.avatarUrl} alt={row.name} className="h-10 w-10 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center text-xs font-medium text-gray-500">
                      {initials(row.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
                    <StatusBadge value={row.status} compact />
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{row.title ?? "—"}</p>
                  {row.email ? (
                    <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{row.email}</p>
                  ) : null}
                  {row.lastSeen ? (
                    <p className="mt-1 text-xs text-gray-400">Last seen {row.lastSeen}</p>
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

function StatusBadge({ value, compact = false }: { value?: string; compact?: boolean }) {
  if (!value) return <span className="text-gray-400">—</span>;
  const { bg, dot } = statusColors(value);
  const base = compact ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${base} font-medium ring-1 ring-inset ${bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {capital(value)}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function capital(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function statusColors(value: string) {
  const v = value.toLowerCase();
  if (v.startsWith("act")) {
    return { bg: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-700/30", dot: "bg-green-600" };
  }
  if (v.startsWith("vac")) {
    return { bg: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-950/40 dark:text-yellow-300 dark:ring-yellow-700/30", dot: "bg-yellow-600" };
  }
  return { bg: "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-900/60 dark:text-gray-300 dark:ring-gray-700/30", dot: "bg-gray-500" };
}