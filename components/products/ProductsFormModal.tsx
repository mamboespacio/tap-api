"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUpload, type UploadedFileInfo } from "@/hooks/useSupabaseUploads";
import { createProductAction } from "@/app/dashboard/products/actions"; // server action

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

export default function ProductFormModal({
  categories,
  productToEdit,
  onClose,
}: {
  categories: CategoryOption[];
  productToEdit: ProductWithCategory | null;
  onClose: () => void;
}) {
  const router = useRouter();

  const BUCKET = "tap-production";
  const PATH = "product-images";

  const {
    files,
    setFiles,
    uploadedFiles,
    loading: uploading,
    errors,
    onUpload,
    getRootProps,
    getInputProps,
    open,
    removeUploadedFile,
  } = useSupabaseUpload({
    bucketName: BUCKET,
    path: PATH,
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    maxFiles: 1,
    cacheControl: 3600,
    upsert: false,
  } as any);

  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (productToEdit) {
      setForm({
        id: productToEdit.id,
        name: productToEdit.name ?? "",
        description: productToEdit.description ?? null,
        price: typeof productToEdit.price === "string" ? Number(productToEdit.price) : productToEdit.price ?? 0,
        stock: productToEdit.stock ?? 0,
        active: productToEdit.active ?? true,
        category_id: productToEdit.category_id ?? categories[0]?.id ?? 0,
        image_url: productToEdit.image_url ?? null,
        image_path: productToEdit.image_path ?? null,
      });
      setPreviewUrl(productToEdit.image_url ?? null);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setPreviewUrl(null);
      setForm((f) => ({ ...f, image_url: null, image_path: null }));
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit, categories]);

  // When files change we trigger upload and use the returned uploadedFiles to populate form
  useEffect(() => {
    if (files.length === 0) return;

    (async () => {
      try {
        const results: UploadedFileInfo[] = await onUpload();
        if (results && results.length > 0) {
          const first = results[0];
          setForm((s) => ({ ...s, image_url: first.publicUrl, image_path: first.path }));
          setPreviewUrl(first.publicUrl);
        }
        // clear staged files (the hook also maintains uploadedFiles)
        setFiles([]);
      } catch (err) {
        console.error("Upload error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value),
    }));
  };

  const removeImage = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (form.image_path) {
      // try to delete from storage and then clear form
      const ok = await removeUploadedFile(form.image_path);
      if (!ok) {
        alert("No se pudo eliminar la imagen del storage.");
        return;
      }
    }

    setForm((s) => ({ ...s, image_url: null, image_path: null }));
    setPreviewUrl(null);
    setFiles([]);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // final sanity: if uploadedFiles has an entry for our image_path, ensure form.image_url is set
      if (!form.image_url && form.image_path) {
        const match = uploadedFiles.find((u) => u.path === form.image_path);
        if (match) {
          setForm((s) => ({ ...s, image_url: match.publicUrl }));
        }
      }

      const payload = {
        name: String(form.name),
        description: form.description ?? null,
        price: Number(form.price ?? 0),
        stock: Number(form.stock ?? 0),
        categoryId: Number(form.category_id ?? 0),
        imageUrl: form.image_url ?? null,
        imagePath: form.image_path ?? null,
      };

      console.debug("Payload enviado a createProductAction:", payload);

      await createProductAction(payload);

      onClose();
      router.refresh();
    } catch (err: any) {
      console.error("Error creando producto:", err);
      alert(err?.message ?? "Error creando el producto");
    } finally {
      setSaving(false);
    }
  };

  const localPreview = form.image_url || (files && files.length > 0 ? (files[0] as any).preview ?? null : null);

  const hasPendingUploads = uploading || files.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose()} />
      <div className="relative z-10 w-full max-w-2xl rounded bg-white p-6 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">{form.id === 0 ? "Crear producto" : "Editar producto"}</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full rounded border px-2 py-1" />
          </div>

          <div>
            <label className="block text-sm">Descripción</label>
            <textarea name="description" value={form.description ?? ""} onChange={handleChange} className="mt-1 w-full rounded border px-2 py-1" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm">Precio</label>
              <input name="price" type="number" step="0.01" value={Number(form.price ?? 0)} onChange={handleChange} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm">Stock</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm">Categoría</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className="mt-1 w-full rounded border px-2 py-1">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Imagen</label>

            <div
              {...(getRootProps ? getRootProps() : {})}
              className="min-h-[120px] flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded border-2 border-dashed p-4 text-center transition hover:border-gray-400"
            >
              <input {...(getInputProps ? getInputProps() : {})} />

              {uploading ? (
                <p className="text-sm text-gray-600">Subiendo...</p>
              ) : localPreview ? (
                <div className="flex w-full items-start justify-between gap-3">
                  <img src={localPreview} alt="preview" className="max-h-32 rounded object-contain" />
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="rounded border px-3 py-1 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(e);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">Arrastra una imagen aquí o haz click para seleccionar</p>
                  <div className="mt-2 flex gap-2 justify-center">
                    <button
                      type="button"
                      className="rounded border px-3 py-1 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        open && open();
                      }}
                    >
                      Seleccionar archivo
                    </button>
                  </div>
                  {errors && errors.length > 0 && (
                    <p className="text-xs text-red-500 mt-2">{errors[0]?.message ?? "Archivo inválido"}</p>
                  )}
                </div>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {hasPendingUploads ? "Subiendo imagen... espera antes de guardar." : "La imagen se sube a Supabase y su URL pública se guardará en el producto."}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button className="rounded border px-3 py-1" onClick={() => onClose()} disabled={saving}>Cancelar</button>
            <button
              className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
              onClick={handleSave}
              disabled={saving || hasPendingUploads}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}