// src/app/dashboard-vendor/products/page.tsx (Server Component, AJUSTADO)

import { PrismaClient } from '@prisma/client';
import ProductsList from "@/components/products/ProductsList";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const prisma = new PrismaClient();

export default async function VendorProductsPage() {
  const supabase = await createClient();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.id) {
      // No hay usuario válido -> redirigir al login
      return redirect("/auth/login");
    }

    const user = userData.user;

  // Obtener el ID del vendedor para filtrar los productos
  const vendor = await prisma.vendor.findFirst({
    where: { owner_id: user.id },
    select: { id: true, name: true }
  });

  if (!vendor) {
    return <p>Configura tu perfil de vendedor primero.</p>;
  }

  // Obtener los productos del vendedor
  const products = await prisma.product.findMany({
    where: { vendor_id: vendor.id },
    include: {
      category: { select: { id: true, name: true } },
    }
  });

  // Obtener categorías para el formulario
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Productos ({vendor.name})</h1>
      </div>

      <ProductsList products={products} categories={categories} />
    </div>
  );
} catch (error) {
    console.error("Error en VendorProductsPage:", error);
    return <p>Error al cargar los productos. Intenta nuevamente más tarde.</p>;
  }
}
