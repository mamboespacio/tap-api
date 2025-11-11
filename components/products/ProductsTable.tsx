import { TableWithAvatars } from "@/components/TableWithAvatars";
import { Product } from "@/lib/types";

export default function OrdersTable(products:Product[]) {
  return (
    <TableWithAvatars
      rows={products}
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
  )}