"use client";

import { deleteProductAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import ProductFormModal from "@/components/products/ProductsFormModal"; // Reutilizamos el modal
import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";

// Definimos los tipos basados en la consulta de Prisma
export type ProductWithCategory = { // Exportamos el tipo para usarlo en el modal
  id: number;
  name: string;
  description: string | null; // Añadimos description para edición
  price: number;
  stock: number;
  active: boolean;
  category_id: number; // Añadimos categoryId para edición
  category: { name: string };
  image_url?: string | null;
};

type CategoryOption = { id: number; name: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export default function ProductsList({ products, categories }: { products: ProductWithCategory[], categories: CategoryOption[] }) {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);

  // Memorizar callbacks para evitar pasar funciones nuevas cada render
  const handleClose = useCallback(() => setEditingProduct(null), []);
  const handleEdit = useCallback((product: ProductWithCategory) => setEditingProduct(product), []);
  const handleCreate = useCallback(() => setEditingProduct({
    id: 0,
    name: '',
    description: '',
    price: 0,
    stock: 0,
    active: true,
    category_id: categories[0]?.id || 0,
    category: { name: '' },
  }), [categories]);

  const handleDelete = useCallback(async (productId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteProductAction(productId); // Llama a la Server Action
        router.refresh(); // Refresca los Server Components para mostrar la lista actualizada
      } catch (error: any) {
        alert(`Error al eliminar: ${error?.message ?? String(error)}`);
      }
    }
  }, [router]);

  // NOTE: ahora siempre montamos el modal; lo mostramos cuando editingProduct !== null
  return (
    <div>
      <ProductFormModal
        categories={categories}
        productToEdit={editingProduct}
        onClose={handleClose}
      />

      <button
        onClick={() => handleCreate()} //
        className="absolute bottom-4 right-4 p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700"
      >
        <Plus className="w-5 h-5" />
      </button>

      {products.length === 0 ? (
        <div className="mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800">
          <p className="mb-2">No tienes productos aún.</p>
          <button
            onClick={() => setEditingProduct({ // Abrir modal en modo "nuevo"
              id: 0,
              name: '',
              description: '',
              price: 0,
              stock: 0,
              active: true,
              category_id: categories[0]?.id || 0,
              category: { name: '' },
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Agregar Primer Producto
          </button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 sm:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Imagen</th>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Nombre</th>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Precio</th>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Stock</th>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Categoría</th>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Estado</th>
                <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-none overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center text-xs font-medium text-gray-500">
                            {initials(product.name)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm py-2 px-4 border-b">{product.name}</td>
                  <td className="text-sm py-2 px-4 border-b">${product.price.toFixed(2)}</td>
                  <td className="text-sm py-2 px-4 border-b">{product.stock}</td>
                  <td className="text-sm py-2 px-4 border-b">{product.category.name}</td>
                  <td className="text-sm py-2 px-4 border-b">{product.active ? 'Activo' : 'Inactivo'}</td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <button
                      onClick={() => handleEdit(product)} // Abrir modal con datos
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}