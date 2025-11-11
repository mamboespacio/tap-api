// app/products/create/page.tsx
import db from '@/lib/prisma';
import ProductForm from '@/components/ProductForm';

export const metadata = {
  title: 'Crear producto',
};

export default async function CreateProductPage() {
  // Trae solo lo necesario para el form
  const categories = await db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const categoriesForForm = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // if (categoriesForForm.length === 0) {
  //   return (
  //     <div className="mx-auto max-w-2xl">
  //       <h1 className="mb-2 text-2xl font-semibold">Crear producto</h1>
  //       <p className="text-sm text-gray-600">
  //         Necesitás crear al menos una categoría antes de cargar productos.
  //       </p>
  //       <a
  //         href="/categories/create"
  //         className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
  //       >
  //         Crear categoría
  //       </a>
  //     </div>
  //   );
  // }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Crear producto</h1>
      <ProductForm categories={categoriesForForm} />
    </div>
  );
}
