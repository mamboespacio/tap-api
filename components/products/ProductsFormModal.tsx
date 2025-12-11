"use client";

import { useEffect, useMemo, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
// Importamos ambas acciones del servidor
import { createProductAction, updateProductAction } from '@/app/actions'; 
// Importamos el tipo ProductWithCategory exportado desde la lista
import { ProductWithCategory } from '@/components/products/ProductsList';
// Importamos el cliente de supabase client-side
import { createClient } from "@/lib/supabase/client"; 
import { Plus } from 'lucide-react';

// Definimos los tipos esperados para las categorías
type CategoryOption = { id: number; name: string };

// Esquema Zod para validación del formulario (imageUrl sigue siendo string | null)
const ProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  price: z.preprocess(
    (a) => parseFloat(a as string),
    z.number().positive("El precio debe ser positivo")
  ),
  stock: z.preprocess(
    (a) => parseInt(a as string, 10),
    z.number().int().min(0, "El stock no puede ser negativo")
  ),
  categoryId: z.preprocess(
    (a) => parseInt(a as string, 10),
    z.number().positive("Selecciona una categoría")
  ),
  imageUrl: z.string().optional().nullable(), // URL final (string)
});

type ProductInput = z.infer<typeof ProductSchema>;

// Props actualizadas para aceptar un producto a editar y un manejador de cierre
interface FormModalProps {
  categories: CategoryOption[];
  productToEdit?: ProductWithCategory | null; // Opcional para edición
  onClose?: () => void; // Opcional para cerrar desde el listado
}

export default function ProductFormModal({ categories, productToEdit, onClose }: FormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Memoizar la creación del cliente para evitar crear una nueva instancia en cada render
  const supabase = useMemo(() => createClient(), []);

  // Definimos un tipo de formulario que incluye el FileList para el hook, pero no para Zod
  type FormValuesWithFile = ProductInput & { imageFile?: FileList };

  // Valores por defecto del formulario (usamos nombres en camelCase que espera el formulario)
  const initialDefaultValues: FormValuesWithFile = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: undefined as unknown as number,
    imageUrl: null,
    imageFile: undefined,
  };

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    reset, 
    getValues 
  } = useForm<FormValuesWithFile>({
    resolver: zodResolver(ProductSchema) as any, // Forzamos 'any' en el resolver por el campo FileList
    defaultValues: initialDefaultValues,
  });

  // Sincronizar el estado del modal y los valores si se abre para editar
  // Usamos productToEdit?.id como dependencia para evitar re-ejecuciones por identidad del objeto
  useEffect(() => {
    // Cuando cambia el producto a editar, abrir o cerrar el modal y resetear el formulario.
    if (productToEdit) {
      setIsOpen(true);
      // Mapear campos de productToEdit (snake_case o camelCase) a los del formulario
      reset({
        name: productToEdit.name ?? '',
        description: productToEdit.description ?? null,
        price: (productToEdit as any).price ?? 0,
        stock: (productToEdit as any).stock ?? 0,
        categoryId: (productToEdit as any).category_id ?? (productToEdit as any).categoryId ?? undefined,
        imageUrl: (productToEdit as any).imageUrl ?? (productToEdit as any).image_url ?? null,
        imageFile: undefined,
      });
    } else {
      // Si productToEdit es null/undefined, resetear a valores iniciales y cerrar el modal
      reset(initialDefaultValues);
      setIsOpen(false);
    }
    // Dependemos solo del id del producto para evitar re-ejecuciones causadas
    // por funciones con identidad inestable como `reset`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit?.id]);

  const handleClose = () => {
    // Cerrar localmente y resetear formulario
    setIsOpen(false);
    reset(initialDefaultValues);
    if (onClose) onClose(); // Avisar al padre para que, por ejemplo, ponga productToEdit a null
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `product-images/${fileName}`; 

    const { error } = await supabase.storage.from('tap-production').upload(filePath, file);

    if (error) {
      setUploading(false);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }

    const { data } = supabase.storage.from('tap-production').getPublicUrl(filePath);
    setUploading(false);
    return data.publicUrl;
  };

  // Definimos el handler de submit con el tipo correcto que RHF espera (FormValuesWithFile)
  const onSubmit: SubmitHandler<FormValuesWithFile> = async (values) => {
    try {
      // Producto editado puede venir con imageUrl o image_url (mapear ambos)
      const existingImageUrl = (productToEdit as any)?.imageUrl ?? (productToEdit as any)?.image_url ?? null;
      let imageUrl: string | null = existingImageUrl;

      // Usamos getValues() para acceder al FileList
      const files = getValues("imageFile"); 

      if (files && files.length > 0) {
        const file = files[0];
        imageUrl = await uploadImage(file);
      }

      // Preparamos los datos finales para la Server Action (que espera ProductInput)
      const finalValues: ProductInput = { 
        name: values.name,
        description: values.description ?? null,
        price: Number(values.price),
        stock: Number(values.stock),
        categoryId: Number(values.categoryId),
        imageUrl: imageUrl ?? null,
      };

      if (productToEdit) {
        await updateProductAction({ ...finalValues, productId: (productToEdit as any).id });
        alert("Producto actualizado exitosamente");
      } else {
        await createProductAction(finalValues);
        alert("Producto creado exitosamente");
      }
      handleClose(); 
      router.refresh(); 
    } catch (error: any) {
      alert(`Error: ${error?.message ?? String(error)}`);
    }
  };

  return (
    <>
      {!productToEdit && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">{productToEdit ? 'Editar Producto' : 'Crear Producto'}</h2>
              <button onClick={handleClose} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block">Nombre</label>
                <input {...register("name")} className="w-full border p-2 rounded" />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block">Descripción</label>
                <textarea {...register("description")} className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block">Precio ($)</label>
                  <input type="number" step="0.01" {...register("price")} className="w-full border p-2 rounded" />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block">Stock</label>
                  <input type="number" {...register("stock")} className="w-full border p-2 rounded" />
                  {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="block">Categoría</label>
                  <select {...register("categoryId")} className="w-full border p-2 rounded">
                    <option value="">Selecciona...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId.message}</p>}
                </div>
              </div>

              {/* Input para la Imagen */}
              <div>
                <label className="block">Imagen del Producto</label>
                <input 
                    type="file" 
                    accept="image/*" 
                    {...register("imageFile")} 
                    className="w-full border p-2 rounded" 
                />
                {(productToEdit && ((productToEdit as any).image_url || (productToEdit as any).imageUrl)) && !uploading && (
                  <p className="text-sm mt-1">Imagen actual cargada.</p>
                )}
                {uploading && <p className="text-sm mt-1">Subiendo imagen...</p>}
              </div>

              <button type="submit" disabled={isSubmitting || uploading} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                {isSubmitting || uploading ? 'Guardando...' : productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}