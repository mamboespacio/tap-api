// src/components/OrderList.tsx (Client Component)
"use client";

import { useState } from 'react';
import { updateOrderStatusAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";

// Definimos el tipo complejo de la orden que recibimos del Server Component
type OrderWithDetails = {
  id: number;
  price: number;
  status: OrderStatus;
  created_at: Date;
  profile: { full_name: string | null; email: string };
  products: { quantity: number; product: { name: string } }[];
};

export default function OrderList({ orders }: { orders: OrderWithDetails[] }) {
  const router = useRouter();
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    try {
      await updateOrderStatusAction({ orderId, status: newStatus });
      router.refresh(); // Refresca los Server Components
      alert(`Orden ${orderId} actualizada a ${newStatus}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="mt-4 hidden overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 sm:block">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900/40">
          <tr>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">ID Orden</th>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Cliente</th>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Fecha</th>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Productos</th>
            <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="py-2 px-4 border-b">{order.id}</td>
              <td className="py-2 px-4 border-b">{order.profile.full_name || order.profile.email}</td>
              <td className="py-2 px-4 border-b">${order.price.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">
                {order.products.map(op => `${op.quantity}x ${op.product.name}`).join(', ')}
              </td>
              <td className="py-2 px-4 border-b">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  disabled={loadingOrderId === order.id}
                  className={`p-2 rounded ${order.status === 'APPROVED' ? 'bg-green-100' : order.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'}`}
                >
                  {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
