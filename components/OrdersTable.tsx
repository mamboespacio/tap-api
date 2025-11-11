'use client'

import { TableWithAvatars } from "@/components/TableWithAvatars"

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

const rows: TableRow[] = [
  {
    id: 1,
    name: "Leslie Alexander",
    email: "leslie.alexander@example.com",
    title: "Co-Founder / CEO",
    team: "Management",
    status: "active",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wx",
    lastSeen: "2h ago",
  },
  {
    id: 2,
    name: "Michael Foster",
    email: "michael.foster@example.com",
    title: "Product Designer",
    team: "Design",
    status: "vacation",
    avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wx",
    lastSeen: "1d ago",
  },
  {
    id: 3,
    name: "Dries Vincent",
    email: "dries.vincent@example.com",
    title: "Front‑end Developer",
    team: "Engineering",
    status: "inactive",
    avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wx",
    lastSeen: "Mar 12, 2025",
  },
];

export default function OrdersTable() {
  return (
    <TableWithAvatars
      rows={rows}
      caption="Pedidos"
      onRowClick={(r) => alert(`Clicked: ${r.name}`)}
      actions={(r) => (
        <>
          <button className="rounded-full px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            Message
          </button>
          <button className="rounded-full px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            Edit
          </button>
        </>
      )}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-gray-100">3</span> results
          </p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900">
              Previous
            </button>
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900">
              Next
            </button>
          </div>
        </div>
      }
    />
  )
}