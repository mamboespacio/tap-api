// src/app/dashboard-vendor/products/page.tsx (Server Component, AJUSTADO)

import { PrismaClient } from '@prisma/client';
import ProductsList from "@/components/products/ProductsList";
import { getSessionOrRedirect } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

export default async function VendorProductsPage() {
  const { user } = await getSessionOrRedirect();

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
}
