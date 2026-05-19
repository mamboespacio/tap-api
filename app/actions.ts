"use server";

import { OrderStatus } from "@prisma/client";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import db from "@/lib/prisma";

export async function createOrderAction(data: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const order = await db.$transaction(async (tx) => {
    for (const item of data.products) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`Stock insuficiente para el producto ${item.productId}`);
      }
    }

    return tx.order.create({
      data: {
        profile_id: user.id,
        vendor_id: data.vendorId,
        price: data.totalAmount,
        status: OrderStatus.PENDING,
        products: { create: data.orderProductsData },
      },
    });
  });

  return {
    success: true,
    orderId: order.id,
    items: data.itemsForMP,
    userId: user.id,
  };
}

interface UpdateOrderStatusData {
  orderId: number;
  status: OrderStatus;
}

export async function updateOrderStatusAction(data: UpdateOrderStatusData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const order = await db.order.findUnique({ where: { id: data.orderId } });
  if (!order) throw new Error("Orden no encontrada.");

  const isOwner = await db.vendor.findFirst({
    where: { id: order.vendor_id, owner_id: user.id },
  });
  if (!isOwner) throw new Error("No tienes permiso para editar esta orden.");

  await db.order.update({
    where: { id: data.orderId },
    data: { status: data.status },
  });

  return { success: true, message: `Orden ${data.orderId} actualizada a ${data.status}` };
}
