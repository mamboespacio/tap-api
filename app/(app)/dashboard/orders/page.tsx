// src/app/dashboard-vendor/orders/page.tsx (Server Component)

import { createClient } from "@/lib/supabase/server";
import { PrismaClient, OrderStatus } from '@prisma/client';
import { redirect } from 'next/navigation';
import OrderList from "@/components/OrdersList";

const prisma = new PrismaClient();

export default async function VendorOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener el ID del vendedor para filtrar las órdenes
  const vendor = await prisma.vendor.findFirst({
    where: { ownerId: user.id },
    select: { id: true }
  });

  if (!vendor) {
    return <p>Configura tu perfil de vendedor primero.</p>;
  }

  // Obtener las órdenes del vendedor, incluyendo detalles del usuario y productos
  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    include: {
      user: { select: { fullName: true, email: true } },
      products: {
        include: { product: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Órdenes</h1>
      <OrderList orders={orders} />
    </div>
  );
}
