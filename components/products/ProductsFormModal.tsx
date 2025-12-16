"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUpload, type UploadedFileInfo } from "@/hooks/useSupabaseUploads";
import { createProductAction } from "@/app/dashboard/products/actions";

type CategoryOption = { id: number; name: string };
type ProductWithCategory = {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  active: boolean;
  category_id: number;
  category: { name: string };
  image_url?: string | null;
  image_path?: string | null;
};

interface ProductFormModalProps {
  categories: CategoryOption[];
  productToEdit: ProductWithCategory | null; // Si es null, el modal no se renderiza
  onClose: () => void;
}

export default function ProductFormModal({
  categories,
  productToEdit,
  onClose,
}: ProductFormModalProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const BUCKET = "tap-production";
  const PATH = "products";


  const {
    files,
    setFiles,
    onUpload,
    loading: uploading,
    open,
    getRootProps,    // <--- Ahora sí estarán disponibles
    getInputProps,   // <--- Ahora sí estarán disponibles
    isDragActive,    // (Opcional, si quieres usarlo en el estilo)
    removeUploadedFile,
  } = useSupabaseUpload({
    bucketName: BUCKET,
    path: PATH,
    // ... resto de opciones
  }) as any; // Usamos any temporalmente si el tipado UseSupabaseUploadReturn no es exacto


  const [form, setForm] = useState({
    id: 0,
    name: "",
    description: "" as string | null,
    price: 0,
    stock: 0,
    active: true,
    category_id: 0,
    image_url: "" as string | null,
    image_path: "" as string | null,
  });

  // 1. Sincronizar el formulario cuando el prop cambie
  useEffect(() => {
    if (productToEdit) {
      setForm({
        id: productToEdit.id,
        name: productToEdit.name ?? "",
        description: productToEdit.description ?? null,
        price: typeof productToEdit.price === "string" ? Number(productToEdit.price) : productToEdit.price ?? 0,
        stock: productToEdit.stock ?? 0,
        active: productToEdit.active ?? true,
        category_id: productToEdit.category_id || (categories.length > 0 ? categories[0].id : 0),
        image_url: productToEdit.image_url ?? null,
        image_path: productToEdit.image_path ?? null,
      });
      setPreviewUrl(productToEdit.image_url ?? null);
    }
  }, [productToEdit, categories]);

  // 2. Manejo de subida de archivos automática
  // useEffect para procesar la subida apenas se selecciona un archivo
  useEffect(() => {
    // Solo subimos si hay archivos nuevos que no tienen preview de Supabase
    if (files.length === 0) return;

    const uploadFile = async () => {
      try {
        // 1. Ejecutamos la subida
        const results = await onUpload();

        // 2. Si se subió con éxito (tu hook devuelve UploadedFileInfo[])
        if (results && results.length > 0) {
          const fileData = results[0]; // Tomamos el primero porque maxFiles es 1

          // 3. Actualizamos el FORMULARIO para que Prisma reciba los datos
          setForm(prev => ({
            ...prev,
            image_url: fileData.publicUrl,
            image_path: fileData.path
          }));

          // 4. Actualizamos la PREVISUALIZACIÓN local
          setPreviewUrl(fileData.publicUrl);
        }
      } catch (err) {
        console.error("Error en la subida:", err);
      }
    };

    uploadFile();
  }, [files]); // Se dispara cada vez que el dropzone recibe un archivo


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setForm((s) => ({
      ...s,
      [name]: type === "number" ? Number(val) : val,
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        id: form.id > 0 ? form.id : undefined,
        name: String(form.name),
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: Number(form.category_id),
        imageUrl: form.image_url,
        imagePath: form.image_path,
        active: form.active
      };

      await createProductAction(payload as any);
      router.refresh();
      onClose(); // Cerramos mediante el padre
    } catch (err: any) {
      alert(err?.message ?? "Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async () => {
    if (form.image_path) {
      await removeUploadedFile(form.image_path);
    }
    setForm((s) => ({ ...s, image_url: null, image_path: null }));
    setPreviewUrl(null);
  };

  // IMPORTANTE: Si no hay objeto para editar/crear, no renderizamos nada.
  // Esto evita que el modal aparezca al inicio si el padre empieza con null.
  if (!productToEdit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Ahora llama directamente a onClose */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {form.id === 0 ? "Nuevo Producto" : "Editar Producto"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del producto</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600"
              placeholder="Ej: Camiseta de Algodón"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description ?? ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 h-24 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <input
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-gray-700"
              >
                <option value={0}>Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Imagen del producto</label>

            {/* Contenedor de Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
            >
              <input {...getInputProps()} />

              {previewUrl ? (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-40 w-40 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se abra el selector de archivos
                      removeImage();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="py-4 cursor-pointer" onClick={open}>
                  <p className="text-sm text-gray-600">
                    Arrastra una imagen aquí o <span className="text-blue-600 font-bold">haz clic para buscar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Máximo 5MB</p>
                </div>
              )}
            </div>

            {uploading && <p className="text-xs text-blue-500 mt-2 animate-pulse">Subiendo a Supabase...</p>}
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/30"
          >
            {saving ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
