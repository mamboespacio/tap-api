"use server";

import { cookies } from "next/headers";
import { OrderStatus, PrismaClient, Role } from "@prisma/client";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server"; 

const prisma = new PrismaClient();

// --- Tipos para Server Actions (sin cambios) ---
interface VendorRegistrationData {
  email: string;
  password: string;
  fullName?: string;
  dni?: string;
  vendorName: string;
  vendorAddress?: string;
  openingHours?: string;
  closingHours?: string;
}

interface ProductData {
    name: string;
    description?: string | null
    price: number;
    stock: number;
    categoryId: number;
    imageUrl?: string | null;
}


// --- FLUJO 2: Crear y Asociar Vendor (sin cambios, usa prisma) ---
async function createVendorProfile(userId: string, data: VendorRegistrationData) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: Role.VENDOR,
      fullName: data.fullName,
      dni: data.dni,
    },
  });

  await prisma.vendor.create({
    data: {
      name: data.vendorName,
      address: data.vendorAddress || "Av. Siempre Viva 742",
      ownerId: userId,
    },
  });
}

// --- FLUJO 1: Registrar y Login de Vendors (Server Action principal) ---
export async function registerVendorAction(data: VendorRegistrationData) {
  // Usamos la función asíncrona para obtener el cliente
  const supabase = await createServerSupabaseClient(); 

  try {
    // 1. Registrar usuario en Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
        throw new Error(signUpError.message);
    }

    const userId = authData.user!.id;

    // 2. Usar Prisma para crear el Vendor de forma segura (Server-side)
    await createVendorProfile(userId, data);
    
    return { success: true, message: "Vendor registrado exitosamente." };

  } catch (error: any) {
    console.error("Error en registerVendorAction:", error.message);
    // ... (manejo de errores) ...
    throw new Error("Fallo al completar el registro.");
  }
}

// --- FLUJO 3: CRUD Products ---

export async function createProductAction(data: ProductData) {
    // Usamos la función asíncrona para obtener el cliente
    const supabase = await createServerSupabaseClient(); 
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No autenticado.");

    // ... (El resto de la lógica de Prisma sin cambios) ...
    const vendorProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, vendorsOwned: { select: { id: true } } }
    });

    if (vendorProfile?.role !== Role.VENDOR || vendorProfile.vendorsOwned.length === 0) {
        throw new Error("Acceso denegado. No eres un vendedor activo.");
    }

    const vendorId = vendorProfile.vendorsOwned[0].id; // Corregir acceso a ID

    await prisma.product.create({
        data: {
            ...data,
            vendorId: vendorId,
            price: parseFloat(data.price.toFixed(2)),
            imageUrl: data.imageUrl,
        }
    });

    return { success: true };
}

export async function deleteProductAction(productId: number) {
    // Usamos la función asíncrona para obtener el cliente
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No autenticado.");

    // ... (El resto de la lógica de Prisma sin cambios) ...
    const product = await prisma.product.findUnique({ where: { id: productId } });
    const isOwner = await prisma.vendor.findFirst({ where: { id: product?.vendorId, ownerId: user.id } });

    if (!isOwner) throw new Error("No tienes permiso para eliminar este producto.");

    await prisma.product.delete({ where: { id: productId } });

    return { success: true };
}

interface UpdateProductData extends Omit<ProductData, 'categoryId'> {
    productId: number;
    categoryId?: number; // Hacemos la categoría opcional en la actualización
    active?: boolean;
}

export async function updateProductAction(data: UpdateProductData) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No autenticado.");

    // Verificar si el usuario es el dueño del producto
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    
    if (!product) throw new Error("Producto no encontrado.");

    const isOwner = await prisma.vendor.findFirst({ 
        where: { 
            id: product.vendorId, 
            ownerId: user.id 
        } 
    });

    if (!isOwner) throw new Error("No tienes permiso para editar este producto.");

    // Preparar los datos para la actualización
    const updateData: any = {
        name: data.name,
        description: data.description, // Ahora acepta string | null
        price: data.price !== undefined ? parseFloat(data.price.toFixed(2)) : undefined,
        stock: data.stock,
        active: data.active,
        imageUrl: data.imageUrl, // Ahora acepta string | null
    };

    if (data.categoryId) {
        updateData.categoryId = data.categoryId;
    }

    await prisma.product.update({
        where: { id: data.productId },
        data: updateData,
    });

    return { success: true };
}

// --- FLUJO 4: Crear Orden ---
export async function createOrderAction(data: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  // 2. Crear la orden PENDIENTE en la DB usando una transacción
  const order = await prisma.$transaction(async (tx) => {
    // Reducir el stock (bloquear productos)
    for (const item of data.products) {
        await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
        });
    }

    // Crear la orden principal
    return tx.order.create({
      data: {
        userId: user.id,
        vendorId: data.vendorId,
        price: data.totalAmount,
        status: OrderStatus.PENDING,
        products: { create: data.orderProductsData },
      },
    });
  });

  // 3. Crear preferencia de Mercado Pago (usando SDK si lo tienes, o fetch)
  // Nota: Esto requiere tus credenciales SECRETAS, mejor en una API Route dedicada si el SDK es complejo
  
  // Para simplicidad, devolvemos datos para que la app cliente genere la preferencia
  const result = { 
      success: true, 
      orderId: order.id,
      items: data.itemsForMP, 
      userId: user.id
  };
  
  return result;
}

// src/app/actions.ts (Añadir al final del archivo)

// Asegúrate de importar OrderStatus al inicio:
// import { PrismaClient, Role, OrderStatus } from "@prisma/client";

interface UpdateOrderStatusData {
    orderId: number;
    status: OrderStatus;
}

export async function updateOrderStatusAction(data: UpdateOrderStatusData) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No autenticado.");

    // 1. Verificar si la orden existe y si pertenece al vendedor
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });

    if (!order) throw new Error("Orden no encontrada.");
    
    // Verificar propiedad: buscar si el usuario es dueño del vendedor de esta orden
    const isOwner = await prisma.vendor.findFirst({
        where: {
            id: order.vendorId,
            ownerId: user.id,
        }
    });

    if (!isOwner) throw new Error("No tienes permiso para editar esta orden.");

    // 2. Actualizar el estado de la orden
    await prisma.order.update({
        where: { id: data.orderId },
        data: { status: data.status },
    });

    return { success: true, message: `Orden ${data.orderId} actualizada a ${data.status}` };
}
