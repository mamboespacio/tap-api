"use server";

import { createClient } from "@/lib/supabase/server";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import db from "@/lib/prisma";

const prisma = db;

type ProductData = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl?: string | null;
  active?: boolean;
};

export async function createProductAction(data: ProductData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const vendorProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, vendors_owned: { select: { id: true } } },
  });

  if (!vendorProfile || vendorProfile.role !== Role.VENDOR || (vendorProfile.vendors_owned?.length ?? 0) === 0) {
    throw new Error("Acceso denegado. No eres un vendedor activo.");
  }

  const vendorId = vendorProfile.vendors_owned[0].id;

  const price =
    typeof data.price === "number"
      ? Math.round(data.price * 100) / 100
      : parseFloat(Number(data.price ?? 0).toFixed(2));

  const productId = Number(data.id);

  try {
    let product;

    if (productId > 0) {
      // Update path: verify ownership before touching the row
      const existing = await prisma.product.findFirst({
        where: { id: productId, vendor_id: vendorId },
      });
      if (!existing) throw new Error("Producto no encontrado o sin permiso.");

      product = await prisma.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description,
          price,
          stock: data.stock,
          category_id: data.categoryId,
          image_url: data.imageUrl,
          active: data.active,
        },
      });
    } else {
      // Create path
      product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          price,
          stock: data.stock,
          category_id: data.categoryId,
          image_url: data.imageUrl,
          active: data.active ?? true,
          vendor_id: vendorId,
        },
      });
    }

    revalidatePath("/dashboard/products");
    return product;
  } catch (error) {
    console.error("Error en Prisma Action:", error);
    throw error instanceof Error ? error : new Error("No se pudo procesar la operación");
  }
}

export async function deleteProductAction(productId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Producto no encontrado.");

  const isOwner = await prisma.vendor.findFirst({
    where: { id: product.vendor_id, owner_id: user.id },
  });

  if (!isOwner) throw new Error("No tienes permiso para eliminar este producto.");

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/dashboard/products");
  return { success: true };
}

interface UpdateProductData {
  productId: number;
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  categoryId?: number;
  active?: boolean;
  imageUrl?: string | null;
}

export async function updateProductAction(data: UpdateProductData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new Error("Producto no encontrado.");

  const isOwner = await prisma.vendor.findFirst({
    where: {
      id: product.vendor_id,
      owner_id: user.id,
    },
  });

  if (!isOwner) throw new Error("No tienes permiso para editar este producto.");

  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = Math.round(data.price * 100) / 100;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;

  if (Object.keys(updateData).length === 0) {
    return { success: true, message: "No hay cambios para aplicar." };
  }

  await prisma.product.update({
    where: { id: data.productId },
    data: updateData,
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}
