// src/app/dashboard-vendor/products/page.tsx (Server Component, AJUSTADO)

// Importación personalizada del cliente de servidor:
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import ProductsFormModal from "@/components/products/ProductsFormModal";
import ProductsList from "@/components/products/ProductsList";

const prisma = new PrismaClient();

export default async function VendorProductsPage() {
  // Usamos la función personalizada:s
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener el ID del vendedor para filtrar los productos
  const vendor = await prisma.vendor.findFirst({
    where: { ownerId: user.id },
    select: { id: true, name: true }
  });

  if (!vendor) {
    return <p>Configura tu perfil de vendedor primero.</p>;
  }

  // Obtener los productos del vendedor
  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    include: { category: { select: { name: true } } }
  });

  // Obtener categorías para el formulario
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });

  // Normalizar campos nulos de Prisma para que coincidan con los tipos esperados por los componentes
  const productsNormalized = products.map(p => ({
    ...p,
    imageUrl: p.imageUrl ?? undefined,
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Productos ({vendor.name})</h1>
      </div>

      <ProductsList products={productsNormalized} categories={[]} />
    </div>
  );
}
