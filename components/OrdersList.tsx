"use client";

import { useState } from 'react';
import { updateOrderStatusAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";

type OrderWithDetails = {
  id: number;
  price: number;
  status: OrderStatus;
  created_at: Date;
  profile: { full_name: string | null; email: string };
  products: { quantity: number; product: { name: string } }[];
};

interface OrderListProps {
  orders: OrderWithDetails[];
  currentPage: number;
  totalCount: number;
  pageSize: number;
}

export default function OrderList({ orders, currentPage, totalCount, pageSize }: OrderListProps) {
  const router = useRouter();
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    try {
      await updateOrderStatusAction({ orderId, status: newStatus });
      router.refresh();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  if (orders.length === 0 && currentPage === 1) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800">
        <p>No tenés órdenes aún.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              {["ID", "Cliente", "Total", "Fecha", "Productos", "Estado"].map((h) => (
                <th key={h} className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-2 px-4 border-b text-sm">{order.id}</td>
                <td className="py-2 px-4 border-b text-sm">{order.profile.full_name || order.profile.email}</td>
                <td className="py-2 px-4 border-b text-sm">${order.price.toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-sm">{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                <td className="py-2 px-4 border-b text-sm">
                  {order.products.map((op) => `${op.quantity}x ${op.product.name}`).join(', ')}
                </td>
                <td className="py-2 px-4 border-b">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    disabled={loadingOrderId === order.id}
                    className={`p-2 rounded text-sm ${
                      order.status === 'APPROVED' ? 'bg-green-100' :
                      order.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}
                  >
                    {Object.values(OrderStatus).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalCount === 0
            ? 'Sin órdenes'
            : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalCount)} de ${totalCount}`}
        </p>
        <div className="flex gap-2">
          {hasPrev ? (
            <Link
              href={`/dashboard?page=${currentPage - 1}`}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              Anterior
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed dark:border-gray-800">
              Anterior
            </span>
          )}
          {hasNext ? (
            <Link
              href={`/dashboard?page=${currentPage + 1}`}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              Siguiente
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed dark:border-gray-800">
              Siguiente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
